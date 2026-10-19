"""
database.py - MongoDB Connection, Collection Setup, JSON Schema Validation, and Index Management.
Designed for Intelligent NoSQL Databases (CSE494) college project.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure, OperationFailure

# Load environment variables from .env file
load_dotenv()

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
                "additionalProperties": False,
                "description": "Nested document containing subject marks"
            },
            "created_at": {
                "bsonType": "date",
                "description": "Native BSON Date when the student record was created"
            }
        },
        "additionalProperties": False
    }
}


def init_database(db=None):
    """
    Initializes collections, applies JSON Schema validation, and creates indexes.
    Safe to call repeatedly on startup.
    """
    if db is None:
        db = get_db()

    collection_names = db.list_collection_names()

    # 1. Create or update collection with JSON Schema validator
    if "students" not in collection_names:
        db.create_collection(
            "students",
            validator=STUDENT_JSON_SCHEMA,
            validationLevel="moderate",
            validationAction="error"
        )
    else:
        # Update validator on existing collection
        try:
            db.command(
                "collMod",
                "students",
                validator=STUDENT_JSON_SCHEMA,
                validationLevel="moderate",
                validationAction="error"
            )
        except OperationFailure:
            pass  # Some restricted MongoDB deployments might disallow collMod

    students_col = db["students"]

    # 2. Create required indexes
    # Unique index on roll_no
    students_col.create_index([("roll_no", ASCENDING)], unique=True, name="idx_unique_roll_no")

    # Unique index on email
    students_col.create_index([("email", ASCENDING)], unique=True, name="idx_unique_email")

    # Index on department
    students_col.create_index([("department", ASCENDING)], name="idx_department")

    # Index on semester
    students_col.create_index([("semester", ASCENDING)], name="idx_semester")

    # Compound index for sorting by name or average marks
    students_col.create_index([("name", ASCENDING)], name="idx_name")

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


def serialize_student(doc):
    """
    Serializes a MongoDB BSON document into a JSON-friendly dictionary.
    Converts ObjectId to string, formats datetime, and computes average and grade.
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

    # Calculate student-level average marks and grade
    marks = serialized.get("marks", {})
    dbms = float(marks.get("DBMS", 0) or 0)
    dsa = float(marks.get("DSA", 0) or 0)
    python_mark = float(marks.get("Python", 0) or 0)

    avg = round((dbms + dsa + python_mark) / 3.0, 2)
    serialized["average_marks"] = avg
    serialized["grade"] = calculate_grade(avg)

    return serialized


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
