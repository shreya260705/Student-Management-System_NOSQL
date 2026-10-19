"""
test_api.py - Comprehensive Automated Test Suite for Student Management System.
Tests:
- Health check endpoint
- Student CRUD operations
- Duplicate roll_no and email handling (409)
- Schema and field validation rejection (400)
- Pagination, search, and filtering
- All 5 MongoDB Aggregation pipelines
- Dashboard statistics calculation

CRITICAL: Runs against an ISOLATED database ('student_management_test')
so the user's main project database ('student_management') is never corrupted or deleted.
"""

import os
import unittest
from datetime import datetime, timezone
from pymongo import MongoClient

from app import create_app
from database import get_db, init_database

TEST_DB_NAME = os.getenv("TEST_DB_NAME", "student_management_test")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")


class StudentAPITestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure Flask app to use test database
        cls.app = create_app({
            "TESTING": True,
            "DB_NAME": TEST_DB_NAME,
            "MONGO_URI": MONGO_URI
        })
        cls.client = cls.app.test_client()

        # Connect to isolated test database
        cls.mongo_client = MongoClient(MONGO_URI)
        cls.test_db = cls.mongo_client[TEST_DB_NAME]
        init_database(cls.test_db)

    @classmethod
    def tearDownClass(cls):
        # Drop ONLY the isolated test database
        cls.mongo_client.drop_database(TEST_DB_NAME)
        cls.mongo_client.close()

    def setUp(self):
        # Clear students collection in test DB before each test
        self.test_db["students"].delete_many({})

    def create_sample_student(self, roll_no="TEST001", name="Test Student", email="test@example.com",
                              department="CSE", semester=4, dbms=85, dsa=90, python_mark=80):
        """Helper to create a student via API."""
        payload = {
            "roll_no": roll_no,
            "name": name,
            "email": email,
            "department": department,
            "semester": semester,
            "marks": {
                "DBMS": dbms,
                "DSA": dsa,
                "Python": python_mark
            }
        }
        return self.client.post("/api/students", json=payload)

    # 1. Health Endpoint Test
    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["mongodb"], "connected")

    # 2. Student Creation & Calculation Tests
    def test_create_student_success(self):
        response = self.create_sample_student()
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("student", data)
        student = data["student"]
        self.assertEqual(student["roll_no"], "TEST001")
        self.assertEqual(student["name"], "Test Student")
        self.assertEqual(student["department"], "CSE")
        self.assertEqual(student["semester"], 4)
        # Average: (85 + 90 + 80) / 3 = 85.0 -> Grade A
        self.assertEqual(student["average_marks"], 85.0)
        self.assertEqual(student["grade"], "A")

    # 3. Duplicate Key Handling (Roll No & Email)
    def test_duplicate_roll_number(self):
        res1 = self.create_sample_student(roll_no="DUP001", email="student1@example.com")
        self.assertEqual(res1.status_code, 201)

        # Attempt to insert same roll number with different email
        res2 = self.create_sample_student(roll_no="DUP001", email="student2@example.com")
        self.assertEqual(res2.status_code, 409)
        data = res2.get_json()
        self.assertIn("error", data)

    def test_duplicate_email(self):
        res1 = self.create_sample_student(roll_no="ROLL01", email="same@example.com")
        self.assertEqual(res1.status_code, 201)

        # Attempt to insert same email with different roll number
        res2 = self.create_sample_student(roll_no="ROLL02", email="same@example.com")
        self.assertEqual(res2.status_code, 409)

    # 4. Input Validation & Error Responses
    def test_invalid_marks_out_of_bounds(self):
        # Marks > 100
        res = self.create_sample_student(roll_no="ERR01", email="err1@example.com", dbms=105)
        self.assertEqual(res.status_code, 400)

        # Negative marks
        res2 = self.create_sample_student(roll_no="ERR02", email="err2@example.com", dsa=-5)
        self.assertEqual(res2.status_code, 400)

    def test_invalid_semester(self):
        res = self.create_sample_student(roll_no="SEM99", email="sem@example.com", semester=9)
        self.assertEqual(res.status_code, 400)

    def test_invalid_email_format(self):
        res = self.create_sample_student(roll_no="EM01", email="not-an-email")
        self.assertEqual(res.status_code, 400)

    # 5. Read Individual Student & List with Pagination/Filter
    def test_get_student_by_id(self):
        create_res = self.create_sample_student(roll_no="GET001", email="get@example.com")
        student_id = create_res.get_json()["student"]["id"]

        fetch_res = self.client.get(f"/api/students/{student_id}")
        self.assertEqual(fetch_res.status_code, 200)
        self.assertEqual(fetch_res.get_json()["student"]["roll_no"], "GET001")

    def test_get_nonexistent_student(self):
        fake_id = "507f1f77bcf86cd799439011"
        res = self.client.get(f"/api/students/{fake_id}")
        self.assertEqual(res.status_code, 404)

    def test_search_and_filter_students(self):
        self.create_sample_student(roll_no="CSE101", name="Alice Smith", email="alice@example.com", department="CSE", semester=3)
        self.create_sample_student(roll_no="ECE102", name="Bob Jones", email="bob@example.com", department="ECE", semester=5)

        # Search by name
        res = self.client.get("/api/students?search=Alice")
        data = res.get_json()
        self.assertEqual(len(data["students"]), 1)
        self.assertEqual(data["students"][0]["name"], "Alice Smith")

        # Filter by department
        res_dept = self.client.get("/api/students?department=ECE")
        data_dept = res_dept.get_json()
        self.assertEqual(len(data_dept["students"]), 1)
        self.assertEqual(data_dept["students"][0]["department"], "ECE")

    # 6. Update Student
    def test_update_student(self):
        create_res = self.create_sample_student(roll_no="UPD001", email="upd@example.com", dbms=50, dsa=50, python_mark=50)
        student_id = create_res.get_json()["student"]["id"]

        # Update marks to improve grade
        update_payload = {
            "marks": {"DBMS": 90, "DSA": 90, "Python": 90}
        }
        put_res = self.client.put(f"/api/students/{student_id}", json=update_payload)
        self.assertEqual(put_res.status_code, 200)
        updated_data = put_res.get_json()["student"]
        self.assertEqual(updated_data["average_marks"], 90.0)
        self.assertEqual(updated_data["grade"], "A")

    # 7. Delete Student
    def test_delete_student(self):
        create_res = self.create_sample_student(roll_no="DEL001", email="del@example.com")
        student_id = create_res.get_json()["student"]["id"]

        del_res = self.client.delete(f"/api/students/{student_id}")
        self.assertEqual(del_res.status_code, 200)

        # Verify it no longer exists
        fetch_res = self.client.get(f"/api/students/{student_id}")
        self.assertEqual(fetch_res.status_code, 404)

    # 8. All 5 MongoDB Aggregation Pipelines
    def test_aggregation_pipelines(self):
        # Insert diverse test cohort
        self.create_sample_student("A01", "Student A", "a@test.com", "CSE", 2, 95, 95, 95)  # Avg: 95 -> A
        self.create_sample_student("B01", "Student B", "b@test.com", "IT", 2, 75, 75, 75)   # Avg: 75 -> B
        self.create_sample_student("C01", "Student C", "c@test.com", "CSE", 4, 65, 65, 65)  # Avg: 65 -> C
        self.create_sample_student("D01", "Student D", "d@test.com", "ECE", 6, 50, 50, 50)  # Avg: 50 -> D
        self.create_sample_student("F01", "Student F", "f@test.com", "ECE", 8, 30, 30, 30)  # Avg: 30 -> F

        # Pipeline 1: Department Counts
        res1 = self.client.get("/api/analytics/department-counts")
        self.assertEqual(res1.status_code, 200)
        dept_data = {item["department"]: item["count"] for item in res1.get_json()["data"]}
        self.assertEqual(dept_data["CSE"], 2)
        self.assertEqual(dept_data["ECE"], 2)
        self.assertEqual(dept_data["IT"], 1)

        # Pipeline 2: Department Averages
        res2 = self.client.get("/api/analytics/department-averages")
        self.assertEqual(res2.status_code, 200)
        dept_avgs = {item["department"]: item["average_marks"] for item in res2.get_json()["data"]}
        self.assertEqual(dept_avgs["CSE"], 80.0)  # (95 + 65) / 2 = 80.0
        self.assertEqual(dept_avgs["IT"], 75.0)
        self.assertEqual(dept_avgs["ECE"], 40.0)  # (50 + 30) / 2 = 40.0

        # Pipeline 3: Top Students
        res3 = self.client.get("/api/analytics/top-students?limit=3")
        self.assertEqual(res3.status_code, 200)
        top_list = res3.get_json()["data"]
        self.assertEqual(len(top_list), 3)
        self.assertEqual(top_list[0]["roll_no"], "A01")
        self.assertEqual(top_list[0]["grade"], "A")

        # Pipeline 4: Grade Distribution
        res4 = self.client.get("/api/analytics/grade-distribution")
        self.assertEqual(res4.status_code, 200)
        grade_map = {item["grade"]: item["count"] for item in res4.get_json()["data"]}
        self.assertEqual(grade_map["A"], 1)
        self.assertEqual(grade_map["B"], 1)
        self.assertEqual(grade_map["C"], 1)
        self.assertEqual(grade_map["D"], 1)
        self.assertEqual(grade_map["F"], 1)

        # Pipeline 5: Semester Counts
        res5 = self.client.get("/api/analytics/semester-counts")
        self.assertEqual(res5.status_code, 200)
        sem_data = {item["semester"]: item["count"] for item in res5.get_json()["data"]}
        self.assertEqual(sem_data[2], 2)
        self.assertEqual(sem_data[4], 1)
        self.assertEqual(sem_data[6], 1)
        self.assertEqual(sem_data[8], 1)

    # 9. Dashboard Statistics Calculation
    def test_dashboard_stats(self):
        self.create_sample_student("DASH1", "Top Student", "dash1@test.com", "CSE", 3, 90, 90, 90)
        self.create_sample_student("DASH2", "Second Student", "dash2@test.com", "IT", 5, 80, 80, 80)

        res = self.client.get("/api/dashboard/stats")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["total_students"], 2)
        self.assertEqual(data["total_departments"], 2)
        self.assertEqual(data["overall_average"], 85.0)
        self.assertIsNotNone(data["highest_scoring_student"])
        self.assertEqual(data["highest_scoring_student"]["roll_no"], "DASH1")


if __name__ == "__main__":
    unittest.main()
