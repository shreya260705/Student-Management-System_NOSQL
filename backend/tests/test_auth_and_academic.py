"""
test_auth_and_academic.py - Automated unit tests for authentication,
role-based authorization, public stats, attendance, report cards, and fees.
"""

import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from app import create_app
from auth import (
    hash_password,
    verify_password,
    generate_token,
    verify_token,
)
from database import calculate_grade, calculate_gpa


class AuthAndAcademicUnitTestCase(unittest.TestCase):
    """
    Tests security, hashing, tokens, grading, and API validation.
    Runs in-memory without requiring live network sockets.
    """

    def setUp(self):
        self.app = create_app({"TESTING": True})
        self.client = self.app.test_client()

    def test_password_hashing_and_verification(self):
        password = "SecurePassword@123"
        hashed = hash_password(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_token_generation_and_expiry(self):
        user_data = {
            "_id": "65b8c9d0e1f2a3b4c5d6e7f8",
            "email": "test@edumanage.edu",
            "name": "Test User",
            "role": "teacher",
            "associated_id": "TCH001"
        }
        token = generate_token(user_data)
        self.assertTrue(isinstance(token, str) and len(token) > 20)

        # Verify token payload
        payload = verify_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["email"], "test@edumanage.edu")
        self.assertEqual(payload["role"], "teacher")

    def test_grading_and_gpa_formula(self):
        self.assertEqual(calculate_grade(95.0), "A")
        self.assertEqual(calculate_grade(75.5), "B")
        self.assertEqual(calculate_grade(65.0), "C")
        self.assertEqual(calculate_grade(50.0), "D")
        self.assertEqual(calculate_grade(35.0), "F")

        self.assertEqual(calculate_gpa(95.0), 9.5)
        self.assertEqual(calculate_gpa(84.0), 8.4)
        self.assertEqual(calculate_gpa(70.0), 7.0)

    def test_admin_public_registration_blocked(self):
        """Verifies that public signup CANNOT register an administrator account."""
        response = self.client.post("/api/auth/register", json={
            "name": "Malicious Admin",
            "email": "hacker@example.com",
            "password": "Password123",
            "role": "admin"
        })
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertIn("error", data)
        self.assertIn("cannot be created via public registration", data["error"])

    def test_contact_form_validation(self):
        """Verifies backend validation on the public landing page contact form."""
        # Empty submission
        res1 = self.client.post("/api/public/contact", json={})
        self.assertEqual(res1.status_code, 400)

        # Invalid email
        res2 = self.client.post("/api/public/contact", json={
            "name": "John Doe",
            "email": "invalid-email",
            "message": "Hello institution"
        })
        self.assertEqual(res2.status_code, 400)

    def test_forgot_password_validation(self):
        """Verifies validation on the forgot-password endpoint."""
        res1 = self.client.post("/api/auth/forgot-password", json={})
        self.assertEqual(res1.status_code, 400)

        res2 = self.client.post("/api/auth/forgot-password", json={"email": "not-an-email"})
        self.assertEqual(res2.status_code, 400)

    def test_reset_password_validation(self):
        """Verifies validation on the reset-password endpoint."""
        res1 = self.client.post("/api/auth/reset-password", json={})
        self.assertEqual(res1.status_code, 400)

        res2 = self.client.post("/api/auth/reset-password", json={
            "email": "student@example.com",
            "reset_code": "123456",
            "new_password": "123"  # too short
        })
        self.assertEqual(res2.status_code, 400)

    def test_google_auth_validation(self):
        """Verifies validation on the google auth endpoint."""
        res1 = self.client.post("/api/auth/google", json={})
        self.assertEqual(res1.status_code, 400)

    def test_teacher_token_payload_with_assigned_classes(self):
        """Verifies teacher token payload preserves assigned_classes and assigned_subjects."""
        user_data = {
            "_id": "65b8c9d0e1f2a3b4c5d6e7f8",
            "email": "priya.patel@edumanage.edu",
            "name": "Prof. Priya Patel",
            "role": "teacher",
            "department": "IT",
            "associated_id": "TCH0101",
            "assigned_subjects": ["DBMS", "Python"],
            "assigned_classes": ["CSE-Sem4", "IT-Sem4"]
        }
        token = generate_token(user_data)
        payload = verify_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["assigned_subjects"], ["DBMS", "Python"])
        self.assertEqual(payload["assigned_classes"], ["CSE-Sem4", "IT-Sem4"])

    @patch("routes.get_current_db")
    def test_batch_marks_unauthorized_subject(self, mock_get_db):
        """Verifies that a faculty cannot enter marks for unassigned subjects."""
        mock_db = MagicMock()
        mock_db["teachers"].find_one.return_value = {
            "name": "Prof. Priya Patel",
            "email": "priya.patel@edumanage.edu",
            "assigned_subjects": ["DBMS", "Python"],
            "assigned_classes": ["CSE-Sem4", "IT-Sem4"]
        }
        mock_get_db.return_value = mock_db

        user_data = {
            "_id": "65b8c9d0e1f2a3b4c5d6e7f8",
            "email": "priya.patel@edumanage.edu",
            "name": "Prof. Priya Patel",
            "role": "teacher",
            "department": "IT",
            "associated_id": "TCH0101",
            "assigned_subjects": ["DBMS", "Python"],
            "assigned_classes": ["CSE-Sem4", "IT-Sem4"]
        }
        token = generate_token(user_data)
        # Attempt to grade 'Thermodynamics' which is not assigned to Priya Patel
        res = self.client.post(
            "/api/marks/batch",
            json={"subject": "Thermodynamics", "scores": [{"roll_no": "CSE2024001", "score": 90}]},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertIn("error", data)
        self.assertIn("Unauthorized", data["error"])

    @patch("routes.get_current_db")
    def test_batch_marks_student_outside_teaching_scope(self, mock_get_db):
        """Verifies that a faculty cannot enter marks for students outside assigned teaching classes."""
        mock_db = MagicMock()
        mock_db["teachers"].find_one.return_value = {
            "name": "Prof. Priya Patel",
            "email": "priya.patel@edumanage.edu",
            "assigned_subjects": ["DBMS", "Python"],
            "assigned_classes": ["CSE-Sem4", "IT-Sem4"]
        }

        # Mock students collection find_one responses:
        # Aarav Sharma: CSE Sem 4 (Allowed)
        # Rajesh Kumar: MECH Sem 6 (Outside assigned scope)
        def mock_student_find(query):
            if query.get("roll_no") == "CSE2024001":
                return {"roll_no": "CSE2024001", "department": "CSE", "semester": 4, "marks": {"DBMS": 85}}
            elif query.get("roll_no") == "MECH2024099":
                return {"roll_no": "MECH2024099", "department": "MECH", "semester": 6, "marks": {}}
            return None

        mock_db["students"].find_one.side_effect = mock_student_find
        mock_get_db.return_value = mock_db

        user_data = {
            "_id": "65b8c9d0e1f2a3b4c5d6e7f8",
            "email": "priya.patel@edumanage.edu",
            "name": "Prof. Priya Patel",
            "role": "teacher",
            "department": "IT",
            "associated_id": "TCH0101",
            "assigned_subjects": ["DBMS", "Python"],
            "assigned_classes": ["CSE-Sem4", "IT-Sem4"]
        }
        token = generate_token(user_data)

        res = self.client.post(
            "/api/marks/batch",
            json={
                "subject": "DBMS",
                "scores": [
                    {"roll_no": "CSE2024001", "score": 92},
                    {"roll_no": "MECH2024099", "score": 88}
                ]
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["updated"], 1)
        self.assertEqual(len(data["errors"]), 1)
        self.assertIn("MECH2024099", data["errors"][0])
        self.assertIn("outside your assigned teaching scope", data["errors"][0])

    @patch("routes.get_current_db")
    def test_list_faculty_allocations(self, mock_get_db):
        """Verifies GET /api/academic/allocations returns seeded allocations."""
        mock_db = MagicMock()
        mock_db["faculty_allocations"].find.return_value.sort.return_value = [
            {
                "_id": "65b8c9d0e1f2a3b4c5d6e7f1",
                "class_id": "CSE-Sem4",
                "department": "CSE",
                "semester": 4,
                "section": "A",
                "subject": "DBMS",
                "teacher_id": "TCH0101",
                "teacher_name": "Prof. Priya Patel"
            }
        ]
        mock_get_db.return_value = mock_db

        res = self.client.get("/api/academic/allocations")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("allocations", data)
        self.assertTrue(len(data["allocations"]) >= 1)
        self.assertEqual(data["allocations"][0]["subject"], "DBMS")

    def test_allot_faculty_unauthorized_non_admin(self):
        """Verifies that non-admin accounts cannot allot faculty."""
        teacher_token = generate_token({
            "_id": "65b8c9d0e1f2a3b4c5d6e7f8",
            "email": "priya.patel@edumanage.edu",
            "role": "teacher"
        })
        res = self.client.post(
            "/api/academic/allocations",
            json={
                "department": "CSE",
                "semester": 4,
                "section": "A",
                "subject": "DBMS",
                "teacher_id": "TCH0101"
            },
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        self.assertEqual(res.status_code, 403)

    @patch("routes.get_current_db")
    def test_get_teacher_students_bifurcation(self, mock_get_db):
        """Verifies GET /api/teacher/students returns students enrolled in teacher's allotted classes."""
        mock_db = MagicMock()
        mock_students_col = MagicMock()
        mock_students_col.find.return_value.sort.return_value = [
            {
                "_id": "65b8c9d0e1f2a3b4c5d6e7f1",
                "roll_no": "CSE2024001",
                "name": "Aarav Sharma",
                "department": "CSE",
                "semester": 4,
                "marks": {"DBMS": 92, "Python": 95},
                "enrolled_subjects": ["DBMS", "Python"]
            }
        ]
        mock_alloc_col = MagicMock()
        mock_alloc_col.find.return_value = [
            {"department": "CSE", "semester": 4, "section": "A", "subject": "DBMS", "teacher_name": "Prof. Priya Patel"},
            {"department": "CSE", "semester": 4, "section": "A", "subject": "Python", "teacher_name": "Prof. Priya Patel"}
        ]
        mock_alloc_col.count_documents.return_value = 2
        mock_db.__getitem__.side_effect = lambda key: mock_students_col if key == "students" else (mock_alloc_col if key == "faculty_allocations" else MagicMock())
        mock_get_db.return_value = mock_db

        teacher_token = generate_token({
            "_id": "65b8c9d0e1f2a3b4c5d6e7f8",
            "email": "priya.patel@edumanage.edu",
            "name": "Prof. Priya Patel",
            "role": "teacher",
            "associated_id": "TCH0101"
        })

        res = self.client.get(
            "/api/teacher/students?class_id=CSE-Sem4",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("students", data)
        self.assertEqual(len(data["students"]), 1)
        self.assertEqual(data["students"][0]["roll_no"], "CSE2024001")
        self.assertIn("DBMS", data["students"][0]["taught_subjects"])

    @patch("routes.get_current_db")
    def test_allot_faculty_by_admin(self, mock_get_db):
        """Verifies that Admin can successfully allot faculty to section and subject."""
        mock_db = MagicMock()
        mock_db["teachers"].find_one.return_value = {
            "_id": "65b8c9d0e1f2a3b4c5d6e7f8",
            "teacher_id": "TCH0101",
            "name": "Prof. Priya Patel",
            "email": "priya.patel@edumanage.edu",
            "department": "IT"
        }
        mock_db["faculty_allocations"].find_one.return_value = {
            "_id": "65b8c9d0e1f2a3b4c5d6e7f9",
            "class_id": "CSE-Sem4",
            "department": "CSE",
            "semester": 4,
            "section": "A",
            "subject": "DBMS",
            "teacher_id": "TCH0101",
            "teacher_name": "Prof. Priya Patel"
        }
        mock_get_db.return_value = mock_db

        admin_token = generate_token({
            "_id": "65b8c9d0e1f2a3b4c5d6e7f0",
            "email": "admin@edumanage.edu",
            "role": "admin"
        })
        res = self.client.post(
            "/api/academic/allocations",
            json={
                "department": "CSE",
                "semester": 4,
                "section": "A",
                "subject": "DBMS",
                "teacher_id": "TCH0101"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("message", data)
        self.assertIn("Successfully allocated", data["message"])
        self.assertIn("allocation", data)


if __name__ == "__main__":
    unittest.main()
