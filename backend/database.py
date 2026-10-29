"""
database.py - MongoDB Connection, Collection Setup, JSON Schema Validation, and Index Management.
Designed for Intelligent NoSQL Databases (CSE494) college project and EduManage SaaS.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, OperationFailure

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "student_management")

# Global client cache
_client = None


def get_client(uri=None):
    """
    Get or create a singleton MongoClient instance.
    """
    global _client
    if _client is None or uri is not None:
        client_uri = uri or MONGO_URI
        _client = MongoClient(
            client_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
    return _client


def get_db(db_name=None, uri=None):
    """
    Returns the MongoDB database instance.
    """
    client = get_client(uri)
    target_db = db_name or DB_NAME
    return client[target_db]


# MongoDB Collection-Level JSON Schema Validator definition
# Ensures document structure, field types, semester range (1-8), and marks (0-100).
STUDENT_JSON_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["roll_no", "name", "email", "department", "semester", "marks", "created_at"],
        "properties": {
            "_id": {
                "bsonType": "objectId",
                "description": "MongoDB internal ObjectId"
            },
            "roll_no": {
                "bsonType": "string",
                "description": "Unique student roll number (e.g., CSE2026001)"
            },
            "name": {
                "bsonType": "string",
                "description": "Student full name"
            },
            "email": {
                "bsonType": "string",
                "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                "description": "Valid email address"
            },
            "department": {
                "bsonType": "string",
                "enum": ["CSE", "ECE", "MECH", "CIVIL", "IT", "AI&DS"],
                "description": "Department name from allowed list"
            },
            "semester": {
                "bsonType": ["int", "long", "double"],
                "minimum": 1,
                "maximum": 8,
                "description": "Semester must be an integer between 1 and 8"
            },
            "marks": {
                "bsonType": "object",
                "required": ["DBMS", "DSA", "Python"],
                "properties": {
                    "DBMS": {
                        "bsonType": ["int", "long", "double"],
                        "minimum": 0,
                        "maximum": 100,
                        "description": "DBMS marks between 0 and 100"
                    },
                    "DSA": {
                        "bsonType": ["int", "long", "double"],
                        "minimum": 0,
                        "maximum": 100,
                        "description": "DSA marks between 0 and 100"
                    },
                    "Python": {
                        "bsonType": ["int", "long", "double"],
                        "minimum": 0,
                        "maximum": 100,
                        "description": "Python marks between 0 and 100"
                    }
                },
                "additionalProperties": True,
                "description": "Nested document containing subject marks"
            },
            "phone": {
                "bsonType": "string",
                "description": "Student contact phone number"
            },
            "status": {
                "bsonType": "string",
                "description": "Student academic status (Active, Inactive, Archived)"
            },
            "dob": {
                "bsonType": "string",
                "description": "Date of Birth (YYYY-MM-DD)"
            },
            "address": {
                "bsonType": "string",
                "description": "Residential address"
            },
            "created_at": {
                "bsonType": "date",
                "description": "Native BSON Date when the student record was created"
            }
        },
        "additionalProperties": True
    }
}


def init_database(db=None):
    """
    Initializes collections, applies JSON Schema validation, creates indexes,
    and bootstraps default administrator. Safe to call repeatedly on startup.
    """
    if db is None:
        db = get_db()

    collection_names = db.list_collection_names()

    # 1. Create or update students collection with JSON Schema validator
    if "students" not in collection_names:
        db.create_collection(
            "students",
            validator=STUDENT_JSON_SCHEMA,
            validationLevel="moderate",
            validationAction="error"
        )
    else:
        try:
            db.command(
                "collMod",
                "students",
                validator=STUDENT_JSON_SCHEMA,
                validationLevel="moderate",
                validationAction="error"
            )
        except OperationFailure:
            pass  # Some cloud providers disallow collMod

    students_col = db["students"]

    # Student indexes
    students_col.create_index([("roll_no", ASCENDING)], unique=True, name="idx_unique_roll_no")
    students_col.create_index([("email", ASCENDING)], unique=True, name="idx_unique_email")
    students_col.create_index([("department", ASCENDING)], name="idx_department")
    students_col.create_index([("semester", ASCENDING)], name="idx_semester")
    students_col.create_index([("name", ASCENDING)], name="idx_name")

    # 2. Users collection (Authentication & RBAC)
    users_col = db["users"]
    users_col.create_index([("email", ASCENDING)], unique=True, name="idx_unique_user_email")
    users_col.create_index([("role", ASCENDING)], name="idx_user_role")

    # 3. Teachers collection
    teachers_col = db["teachers"]
    teachers_col.create_index([("teacher_id", ASCENDING)], unique=True, name="idx_unique_teacher_id")
    teachers_col.create_index([("email", ASCENDING)], name="idx_teacher_email")
    teachers_col.create_index([("department", ASCENDING)], name="idx_teacher_department")

    # 4. Academic: Courses, Classes, Subjects
    db["courses"].create_index([("course_code", ASCENDING)], unique=True, name="idx_unique_course_code")
    db["classes"].create_index([("class_id", ASCENDING)], unique=True, name="idx_unique_class_id")
    db["subjects"].create_index([("subject_code", ASCENDING)], unique=True, name="idx_unique_subject_code")

    # 5. Attendance collection
    attendance_col = db["attendance"]
    attendance_col.create_index(
        [("date", ASCENDING), ("department", ASCENDING), ("semester", ASCENDING), ("subject", ASCENDING)],
        name="idx_attendance_session"
    )

    # 6. Examination & Marks
    db["exams"].create_index([("exam_id", ASCENDING)], unique=True, name="idx_unique_exam_id")

    # 7. Timetable collection
    db["timetable"].create_index([("day", ASCENDING), ("department", ASCENDING), ("semester", ASCENDING)], name="idx_timetable_slot")

    # 8. Fees collection
    db["fees"].create_index([("roll_no", ASCENDING)], name="idx_fee_roll_no")
    db["fees"].create_index([("receipt_no", ASCENDING)], name="idx_fee_receipt")

    # 9. Announcements, Contact Messages, Audit Logs
    db["announcements"].create_index([("created_at", DESCENDING)], name="idx_announcements_created")
    db["contact_messages"].create_index([("created_at", DESCENDING)], name="idx_contact_created")
    db["audit_logs"].create_index([("timestamp", DESCENDING)], name="idx_audit_timestamp")

    # Bootstrap default administrator account if needed
    try:
        from auth import ensure_default_admin
        ensure_default_admin(db)
    except Exception as e:
        print(f"[!] Info: auth admin bootstrap skipped: {e}")

    return students_col


def calculate_grade(average):
    """
    Calculates letter grade consistently with college project boundaries:
    A: >= 80
    B: 70 <= average < 80
    C: 60 <= average < 70
    D: 40 <= average < 60
    F: < 40
    """
    if average is None:
        return "N/A"
    if average >= 80:
        return "A"
    elif average >= 70:
        return "B"
    elif average >= 60:
        return "C"
    elif average >= 40:
        return "D"
    else:
        return "F"


def calculate_gpa(average):
    """
    Converts average percentage to standard 10.0 scale GPA.
    Formula: round(average / 10.0, 2)
    """
    if average is None:
        return 0.0
    return round(float(average) / 10.0, 2)


def serialize_student(doc):
    """
    Serializes a MongoDB BSON document into a JSON-friendly dictionary.
    Converts ObjectId to string, formats datetime, and computes average, grade, and GPA.
    """
    if not doc:
        return None

    serialized = dict(doc)
    # Serialize ObjectId
    if "_id" in serialized:
        serialized["_id"] = str(serialized["_id"])
        serialized["id"] = serialized["_id"]

    # Serialize datetime
    if "created_at" in serialized and isinstance(serialized["created_at"], datetime):
        serialized["created_at"] = serialized["created_at"].isoformat()

    # Calculate student-level average marks, grade, and GPA
    marks = serialized.get("marks", {})
    if isinstance(marks, dict) and len(marks) > 0:
        # Sum all subject marks present
        valid_marks = [float(v) for v in marks.values() if v is not None and isinstance(v, (int, float))]
        if valid_marks:
            avg = round(sum(valid_marks) / float(len(valid_marks)), 2)
        else:
            avg = 0.0
    else:
        avg = 0.0

    serialized["average_marks"] = avg
    serialized["grade"] = calculate_grade(avg)
    serialized["gpa"] = calculate_gpa(avg)
    serialized["status"] = serialized.get("status", "Active")
    serialized["phone"] = serialized.get("phone", "")

    # Resolve enrolled subjects
    if not serialized.get("enrolled_subjects"):
        if isinstance(marks, dict) and len(marks) > 0:
            serialized["enrolled_subjects"] = list(marks.keys())
        else:
            dept = serialized.get("department", "CSE")
            defaults_map = {
                "CSE": ["DBMS", "DSA", "Python"],
                "IT": ["DBMS", "Python", "Web Technologies"],
                "AI&DS": ["Python", "Machine Learning", "Data Mining"],
                "ECE": ["Signals & Systems", "Digital Circuits", "Python"],
                "MECH": ["Thermodynamics", "Fluid Mechanics", "CAD/CAM"],
                "CIVIL": ["Structural Analysis", "Geotechnical", "Surveying"]
            }
            serialized["enrolled_subjects"] = defaults_map.get(dept, ["DBMS", "DSA", "Python"])

    return serialized


def serialize_doc(doc):
    """
    Generic serializer for any MongoDB document.
    Converts ObjectId to string and datetime to ISO string.
    Removes sensitive password_hash if present.
    """
    if not doc:
        return None
    res = dict(doc)
    if "_id" in res:
        res["_id"] = str(res["_id"])
        res["id"] = res["_id"]
    if "password_hash" in res:
        del res["password_hash"]
    for k, v in list(res.items()):
        if isinstance(v, datetime):
            res[k] = v.isoformat()
    return res


def check_connection(db=None):
    """
    Pings MongoDB to verify active connection.
    Returns (status_bool, message_str)
    """
    try:
        if db is None:
            db = get_db()
        db.command("ping")
        return True, "MongoDB connected successfully"
    except ConnectionFailure as e:
        return False, f"Could not connect to MongoDB server: {str(e)}"
    except Exception as e:
        return False, f"MongoDB error: {str(e)}"
