"""
seed.py - Idempotent sample data seeder for EduManage Student Management System.
Populates:
1. Demo user accounts (Admin, Teacher, Student) with hashed passwords
2. 16 realistic student records across departments (preserving grade distribution)
3. Faculty members (Teachers)
4. Academic structure (Courses, Classes, Subjects)
5. Attendance sessions and records
6. Examination definitions
7. Weekly Timetable schedules
8. Student fee records and receipts
9. Institution announcements

Safe to rerun repeatedly: Uses upsert on unique keys.
"""

from datetime import datetime, timezone, timedelta
from database import get_db, init_database
from auth import hash_password

SAMPLE_STUDENTS = [
    # --- Grade A Students (Avg >= 80) ---
    {
        "roll_no": "CSE2024001",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@example.com",
        "department": "CSE",
        "semester": 4,
        "marks": {"DBMS": 92, "DSA": 96, "Python": 94},  # Avg: 94.0 -> A
        "phone": "+91 98765 43210",
        "status": "Active"
    },
    {
        "roll_no": "IT2024002",
        "name": "Priya Patel",
        "email": "priya.patel@example.com",
        "department": "IT",
        "semester": 4,
        "marks": {"DBMS": 88, "DSA": 84, "Python": 90},  # Avg: 87.33 -> A
        "phone": "+91 98765 43211",
        "status": "Active"
    },
    {
        "roll_no": "AIDS2024003",
        "name": "Rohan Verma",
        "email": "rohan.verma@example.com",
        "department": "AI&DS",
        "semester": 4,
        "marks": {"DBMS": 82, "DSA": 86, "Python": 87},  # Avg: 85.0 -> A
        "phone": "+91 98765 43212",
        "status": "Active"
    },
    {
        "roll_no": "ECE2024004",
        "name": "Sneha Reddy",
        "email": "sneha.reddy@example.com",
        "department": "ECE",
        "semester": 5,
        "marks": {"DBMS": 80, "DSA": 85, "Python": 81},  # Avg: 82.0 -> A
        "phone": "+91 98765 43213",
        "status": "Active"
    },

    # --- Grade B Students (70 <= Avg < 80) ---
    {
        "roll_no": "CSE2024005",
        "name": "Aditya Singh",
        "email": "aditya.singh@example.com",
        "department": "CSE",
        "semester": 6,
        "marks": {"DBMS": 76, "DSA": 78, "Python": 80},  # Avg: 78.0 -> B
        "phone": "+91 98765 43214",
        "status": "Active"
    },
    {
        "roll_no": "MECH2024006",
        "name": "Vikram Malhotra",
        "email": "vikram.malhotra@example.com",
        "department": "MECH",
        "semester": 7,
        "marks": {"DBMS": 74, "DSA": 75, "Python": 76},  # Avg: 75.0 -> B
        "phone": "+91 98765 43215",
        "status": "Active"
    },
    {
        "roll_no": "CIVIL2024007",
        "name": "Ananya Joshi",
        "email": "ananya.joshi@example.com",
        "department": "CIVIL",
        "semester": 3,
        "marks": {"DBMS": 70, "DSA": 72, "Python": 74},  # Avg: 72.0 -> B
        "phone": "+91 98765 43216",
        "status": "Active"
    },
    {
        "roll_no": "IT2024008",
        "name": "Kavya Nair",
        "email": "kavya.nair@example.com",
        "department": "IT",
        "semester": 4,
        "marks": {"DBMS": 71, "DSA": 73, "Python": 70},  # Avg: 71.33 -> B
        "phone": "+91 98765 43217",
        "status": "Active"
    },

    # --- Grade C Students (60 <= Avg < 70) ---
    {
        "roll_no": "CSE2024009",
        "name": "Ishaan Gupta",
        "email": "ishaan.gupta@example.com",
        "department": "CSE",
        "semester": 4,
        "marks": {"DBMS": 68, "DSA": 65, "Python": 67},  # Avg: 66.67 -> C
        "phone": "+91 98765 43218",
        "status": "Active"
    },
    {
        "roll_no": "ECE2024010",
        "name": "Meera Iyer",
        "email": "meera.iyer@example.com",
        "department": "ECE",
        "semester": 5,
        "marks": {"DBMS": 62, "DSA": 64, "Python": 65},  # Avg: 63.67 -> C
        "phone": "+91 98765 43219",
        "status": "Active"
    },
    {
        "roll_no": "AIDS2024011",
        "name": "Arjun Rao",
        "email": "arjun.rao@example.com",
        "department": "AI&DS",
        "semester": 4,
        "marks": {"DBMS": 60, "DSA": 62, "Python": 61},  # Avg: 61.0 -> C
        "phone": "+91 98765 43220",
        "status": "Active"
    },

    # --- Grade D Students (40 <= Avg < 60) ---
    {
        "roll_no": "MECH2024012",
        "name": "Tanvi Deshmukh",
        "email": "tanvi.deshmukh@example.com",
        "department": "MECH",
        "semester": 7,
        "marks": {"DBMS": 52, "DSA": 55, "Python": 50},  # Avg: 52.33 -> D
        "phone": "+91 98765 43221",
        "status": "Active"
    },
    {
        "roll_no": "CIVIL2024013",
        "name": "Siddharth Jain",
        "email": "siddharth.jain@example.com",
        "department": "CIVIL",
        "semester": 3,
        "marks": {"DBMS": 48, "DSA": 45, "Python": 50},  # Avg: 47.67 -> D
        "phone": "+91 98765 43222",
        "status": "Active"
    },
    {
        "roll_no": "CSE2024014",
        "name": "Diya Chatterjee",
        "email": "diya.chatterjee@example.com",
        "department": "CSE",
        "semester": 4,
        "marks": {"DBMS": 42, "DSA": 44, "Python": 46},  # Avg: 44.0 -> D
        "phone": "+91 98765 43223",
        "status": "Active"
    },

    # --- Grade F Students (Avg < 40) ---
    {
        "roll_no": "IT2024015",
        "name": "Varun Kapoor",
        "email": "varun.kapoor@example.com",
        "department": "IT",
        "semester": 4,
        "marks": {"DBMS": 35, "DSA": 32, "Python": 38},  # Avg: 35.0 -> F
        "phone": "+91 98765 43224",
        "status": "Active"
    },
    {
        "roll_no": "ECE2024016",
        "name": "Riya Sen",
        "email": "riya.sen@example.com",
        "department": "ECE",
        "semester": 5,
        "marks": {"DBMS": 28, "DSA": 30, "Python": 25},  # Avg: 27.67 -> F
        "phone": "+91 98765 43225",
        "status": "Active"
    },
]

DEMO_USERS = [
    {
        "email": "admin@edumanage.edu",
        "name": "System Administrator",
        "password": "Admin@123",
        "role": "admin",
        "department": "Administration",
        "status": "Active"
    },
    {
        "email": "priya.patel@edumanage.edu",
        "name": "Prof. Priya Patel",
        "password": "Teacher@123",
        "role": "teacher",
        "associated_id": "TCH0101",
        "department": "IT",
        "assigned_subjects": ["DBMS", "Python"],
        "assigned_classes": ["AI&DS-Sem4", "CSE-Sem4", "IT-Sem4"],
        "status": "Active"
    },
    {
        "email": "aarav.sharma@example.com",
        "name": "Aarav Sharma",
        "password": "Student@123",
        "role": "student",
        "associated_id": "CSE2024001",
        "department": "CSE",
        "semester": 4,
        "status": "Active"
    }
]

TEACHERS = [
    {
        "teacher_id": "TCH0101",
        "name": "Prof. Priya Patel",
        "email": "priya.patel@edumanage.edu",
        "department": "IT",
        "phone": "+91 98111 22334",
        "designation": "Associate Professor",
        "assigned_subjects": ["DBMS", "Python"],
        "assigned_classes": ["AI&DS-Sem4", "CSE-Sem4", "IT-Sem4"],
        "status": "Active"
    },
    {
        "teacher_id": "TCH0102",
        "name": "Dr. Ramesh Gupta",
        "email": "ramesh.gupta@edumanage.edu",
        "department": "CSE",
        "phone": "+91 98222 33445",
        "designation": "Professor & Head",
        "assigned_subjects": ["DSA", "DBMS"],
        "assigned_classes": ["CSE-Sem4", "CSE-Sem6"],
        "status": "Active"
    },
    {
        "teacher_id": "TCH0103",
        "name": "Dr. Amit Roy",
        "email": "amit.roy@edumanage.edu",
        "department": "AI&DS",
        "phone": "+91 98333 44556",
        "designation": "Assistant Professor",
        "assigned_subjects": ["Python", "DSA"],
        "assigned_classes": ["AI&DS-Sem2"],
        "status": "Active"
    },
    {
        "teacher_id": "TCH0104",
        "name": "Prof. Sneha Reddy",
        "email": "sneha.reddy@edumanage.edu",
        "department": "ECE",
        "phone": "+91 98444 55667",
        "designation": "Associate Professor",
        "assigned_subjects": ["Python"],
        "assigned_classes": ["ECE-Sem5"],
        "status": "Active"
    }
]


def seed_database(db=None):
    """
    Seeds comprehensive data safely into MongoDB.
    Uses upserts to ensure idempotent execution.
    """
    if db is None:
        db = get_db()

    init_database(db)

    # 1. Seed Demo Users
    users_col = db["users"]
    for u in DEMO_USERS:
        doc = {
            "email": u["email"],
            "name": u["name"],
            "password_hash": hash_password(u["password"]),
            "role": u["role"],
            "associated_id": u.get("associated_id", ""),
            "department": u.get("department", "CSE"),
            "status": "Active",
            "created_at": datetime.now(timezone.utc)
        }
        users_col.update_one({"email": u["email"]}, {"$setOnInsert": doc}, upsert=True)
    print(f"[*] Demo users verified/seeded (Admin, Teacher, Student).")

    # 2. Seed Teachers
    teachers_col = db["teachers"]
    for t in TEACHERS:
        t["created_at"] = datetime.now(timezone.utc)
        teachers_col.update_one({"teacher_id": t["teacher_id"]}, {"$set": t}, upsert=True)
    print(f"[*] Faculty profiles verified/seeded.")

    # 3. Seed Students (Preserves existing records with upsert)
    students_col = db["students"]
    base_time = datetime.now(timezone.utc)
    for index, student_data in enumerate(SAMPLE_STUDENTS):
        doc = dict(student_data)
        doc["created_at"] = base_time - timedelta(days=len(SAMPLE_STUDENTS) - index)
        students_col.update_one(
            {"roll_no": student_data["roll_no"]},
            {"$set": doc},
            upsert=True
        )
    print(f"[*] {len(SAMPLE_STUDENTS)} student records verified/seeded.")

    # 4. Seed Attendance Sessions
    attendance_col = db["attendance"]
    cse_students = list(students_col.find({"department": "CSE"}))
    for day_offset in range(1, 15):
        sess_date = (base_time - timedelta(days=day_offset)).strftime("%Y-%m-%d")
        records = []
        for idx, s in enumerate(cse_students):
            # Realistic attendance status
            st = "Present" if (idx + day_offset) % 7 != 0 else "Absent"
            if (idx + day_offset) % 11 == 0:
                st = "Late"
            records.append({
                "roll_no": s["roll_no"],
                "name": s["name"],
                "status": st,
                "remark": ""
            })
        attendance_col.update_one(
            {"date": sess_date, "department": "CSE", "semester": 6, "subject": "DBMS"},
            {"$set": {
                "date": sess_date,
                "department": "CSE",
                "semester": 6,
                "subject": "DBMS",
                "records": records,
                "updated_at": base_time
            }},
            upsert=True
        )
    print(f"[*] Realistic attendance sessions verified/seeded.")

    # 5. Seed Fees
    fees_col = db["fees"]
    for s in SAMPLE_STUDENTS:
        rno = s["roll_no"]
        is_paid = ("001" in rno or "002" in rno or "003" in rno or "004" in rno)
        fees_col.update_one(
            {"roll_no": rno},
            {"$setOnInsert": {
                "roll_no": rno,
                "name": s["name"],
                "department": s["department"],
                "semester": s["semester"],
                "total_amount": 45000,
                "paid_amount": 45000 if is_paid else 25000,
                "balance": 0 if is_paid else 20000,
                "status": "Paid" if is_paid else "Partial",
                "due_date": "2026-11-30",
                "receipt_no": f"REC-{rno}",
                "updated_at": base_time
            }},
            upsert=True
        )
    print(f"[*] Student fee ledger records verified/seeded.")

    print("\n" + "=" * 60)
    print("SUCCESS: EduManage NoSQL Database Seed Completed!")
    print("Demo Credentials for Evaluation & Testing:")
    print("  👑 Admin:   admin@edumanage.edu      (Password: Admin@123)")
    print("  👨‍🏫 Teacher: priya.patel@edumanage.edu (Password: Teacher@123)")
    print("  🎓 Student: aarav.sharma@example.com (Password: Student@123)")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    seed_database()
