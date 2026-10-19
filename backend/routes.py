"""
routes.py - Flask Blueprint containing all REST API routes for:
- Health check
- Student CRUD operations
- Analytics aggregation endpoints
- Dashboard summary statistics
"""

import math
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify, current_app
from pymongo.errors import DuplicateKeyError, OperationFailure

from database import get_db, serialize_student, check_connection
from validators import validate_student_data
from aggregations import (
    execute_department_counts,
    execute_department_averages,
    execute_top_students,
    execute_grade_distribution,
    execute_semester_counts,
    execute_dashboard_summary,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")


def get_current_db():
    """Helper to get database respecting current Flask app config."""
    db_name = None
    mongo_uri = None
    try:
        if current_app:
            db_name = current_app.config.get("DB_NAME")
            mongo_uri = current_app.config.get("MONGO_URI")
    except RuntimeError:
        pass
    return get_db(db_name=db_name, uri=mongo_uri)


def get_students_collection():
    """Helper to get current database's students collection."""
    db = get_current_db()
    return db["students"]


# ==============================================================================
# Health Check Endpoint
# ==============================================================================
@api_bp.route("/health", methods=["GET"])
def health_check():
    """
    GET /api/health
    Pings MongoDB and returns operational status and total count of student records.
    """
    db = get_current_db()
    is_connected, message = check_connection(db)

    if not is_connected:
        return jsonify({
            "status": "unhealthy",
            "mongodb": "disconnected",
            "error": message
        }), 503

    try:
        count = db["students"].count_documents({})
        return jsonify({
            "status": "healthy",
            "mongodb": "connected",
            "database": db.name,
            "total_students": count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "mongodb": "error",
            "error": str(e)
        }), 500


# ==============================================================================
# Student CRUD Endpoints
# ==============================================================================

@api_bp.route("/students", methods=["GET"])
def list_students():
    """
    GET /api/students
    Retrieves paginated, filtered, searched, and sorted list of students.
    Query parameters:
      - page: int (default 1)
      - limit: int (default 10)
      - search: string (matches name, roll_no, or email)
      - department: string (e.g., CSE)
      - semester: int (e.g., 5)
      - sort_by: string ('name', 'roll_no', 'average_marks', 'created_at')
      - sort_order: string ('asc' or 'desc')
    """
    try:
        page = max(1, int(request.args.get("page", 1)))
        limit = max(1, min(100, int(request.args.get("limit", 10))))
        search = request.args.get("search", "").strip()
        department = request.args.get("department", "").strip().upper()
        semester_param = request.args.get("semester", "").strip()
        sort_by = request.args.get("sort_by", "created_at").strip()
        sort_order = request.args.get("sort_order", "desc").strip().lower()

        order_dir = 1 if sort_order == "asc" else -1
        skip = (page - 1) * limit

        collection = get_students_collection()

        # Build MongoDB filter query
        query = {}
        if search:
            regex_pattern = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": regex_pattern},
                {"roll_no": regex_pattern},
                {"email": regex_pattern}
            ]
        if department:
            query["department"] = department
        if semester_param:
            try:
                query["semester"] = int(semester_param)
            except ValueError:
                pass

        # If sorting by calculated field 'average_marks', use MongoDB Aggregation pipeline
        if sort_by == "average_marks":
            pipeline = [
                {"$match": query},
                {
                    "$project": {
                        "roll_no": 1,
                        "name": 1,
                        "email": 1,
                        "department": 1,
                        "semester": 1,
                        "marks": 1,
                        "created_at": 1,
                        "average_marks": {
                            "$round": [
                                {
                                    "$divide": [
                                        {
                                            "$add": [
                                                {"$ifNull": ["$marks.DBMS", 0]},
                                                {"$ifNull": ["$marks.DSA", 0]},
                                                {"$ifNull": ["$marks.Python", 0]}
                                            ]
                                        },
                                        3.0
                                    ]
                                },
                                2
                            ]
                        }
                    }
                },
                {"$sort": {"average_marks": order_dir, "name": 1}},
                {
                    "$facet": {
                        "metadata": [{"$count": "total"}],
                        "data": [{"$skip": skip}, {"$limit": limit}]
                    }
                }
            ]
            facet_res = list(collection.aggregate(pipeline))[0]
            total_items = facet_res["metadata"][0]["total"] if facet_res["metadata"] else 0
            student_docs = facet_res["data"]
            students = [serialize_student(doc) for doc in student_docs]
        else:
            # Sort by normal document field (e.g., name, roll_no, created_at)
            allowed_sort_fields = {
                "name": "name",
                "roll_no": "roll_no",
                "semester": "semester",
                "created_at": "created_at"
            }
            mongo_sort_field = allowed_sort_fields.get(sort_by, "created_at")

            total_items = collection.count_documents(query)
            cursor = collection.find(query).sort(mongo_sort_field, order_dir).skip(skip).limit(limit)
            students = [serialize_student(doc) for doc in cursor]

        total_pages = math.ceil(total_items / limit) if total_items > 0 else 1

        return jsonify({
            "students": students,
            "pagination": {
                "total": total_items,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve students: {str(e)}"}), 500


@api_bp.route("/students/<student_id>", methods=["GET"])
def get_student(student_id):
    """
    GET /api/students/<student_id>
    Fetches a single student document by MongoDB ObjectId.
    """
    collection = get_students_collection()
    try:
        obj_id = ObjectId(student_id)
    except InvalidId:
        return jsonify({"error": f"Invalid student ID format '{student_id}'"}), 400

    doc = collection.find_one({"_id": obj_id})
    if not doc:
        return jsonify({"error": "Student not found"}), 404

    return jsonify({"student": serialize_student(doc)}), 200


@api_bp.route("/students", methods=["POST"])
def create_student():
    """
    POST /api/students
    Creates a new student document with JSON Schema enforcement and PyMongo duplicate checking.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400

    # 1. Server-side validation
    is_valid, validated_data = validate_student_data(data, is_update=False)
    if not is_valid:
        return jsonify({
            "error": "Validation failed",
            "details": validated_data
        }), 400

    # 2. Attach native BSON Date
    validated_data["created_at"] = datetime.now(timezone.utc)

    collection = get_students_collection()

    # 3. Insert into MongoDB with graceful error handling
    try:
        result = collection.insert_one(validated_data)
        created_doc = collection.find_one({"_id": result.inserted_id})
        return jsonify({
            "message": "Student created successfully",
            "student": serialize_student(created_doc)
        }), 201

    except DuplicateKeyError as e:
        err_msg = str(e)
        if "roll_no" in err_msg:
            return jsonify({
                "error": "Duplicate entry",
                "details": {"roll_no": f"Roll number '{validated_data.get('roll_no')}' is already registered."}
            }), 409
        elif "email" in err_msg:
            return jsonify({
                "error": "Duplicate entry",
                "details": {"email": f"Email address '{validated_data.get('email')}' is already in use."}
            }), 409
        else:
            return jsonify({
                "error": "Duplicate key violation: A student with this roll number or email already exists."
            }), 409

    except OperationFailure as e:
        # Schema validation error from MongoDB
        return jsonify({
            "error": "Database schema validation failed",
            "details": str(e)
        }), 400

    except Exception as e:
        return jsonify({"error": f"Failed to create student: {str(e)}"}), 500


@api_bp.route("/students/<student_id>", methods=["PUT"])
def update_student(student_id):
    """
    PUT /api/students/<student_id>
    Updates an existing student document.
    """
    collection = get_students_collection()
    try:
        obj_id = ObjectId(student_id)
    except InvalidId:
        return jsonify({"error": f"Invalid student ID format '{student_id}'"}), 400

    # Verify student exists
    existing_doc = collection.find_one({"_id": obj_id})
    if not existing_doc:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400

    # Validate update payload
    is_valid, validated_data = validate_student_data(data, is_update=True)
    if not is_valid:
        return jsonify({
            "error": "Validation failed",
            "details": validated_data
        }), 400

    try:
        collection.update_one({"_id": obj_id}, {"$set": validated_data})
        updated_doc = collection.find_one({"_id": obj_id})
        return jsonify({
            "message": "Student updated successfully",
            "student": serialize_student(updated_doc)
        }), 200

    except DuplicateKeyError as e:
        err_msg = str(e)
        if "roll_no" in err_msg:
            return jsonify({
                "error": "Duplicate entry",
                "details": {"roll_no": f"Roll number is already taken."}
            }), 409
        elif "email" in err_msg:
            return jsonify({
                "error": "Duplicate entry",
                "details": {"email": f"Email address is already taken."}
            }), 409
        else:
            return jsonify({
                "error": "Duplicate key violation: A record with this roll number or email already exists."
            }), 409

    except OperationFailure as e:
        return jsonify({
            "error": "Database schema validation failed",
            "details": str(e)
        }), 400

    except Exception as e:
        return jsonify({"error": f"Failed to update student: {str(e)}"}), 500


@api_bp.route("/students/<student_id>", methods=["DELETE"])
def delete_student(student_id):
    """
    DELETE /api/students/<student_id>
    Deletes an individual student by ObjectId.
    """
    collection = get_students_collection()
    try:
        obj_id = ObjectId(student_id)
    except InvalidId:
        return jsonify({"error": f"Invalid student ID format '{student_id}'"}), 400

    result = collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Student not found"}), 404

    return jsonify({"message": "Student record deleted successfully"}), 200


# ==============================================================================
# Aggregation & Analytics Endpoints
# ==============================================================================

@api_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """
    GET /api/dashboard/stats
    Returns consolidated dashboard metrics calculated via MongoDB queries & aggregations.
    """
    try:
        collection = get_students_collection()
        stats = execute_dashboard_summary(collection)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": f"Failed to calculate dashboard statistics: {str(e)}"}), 500


@api_bp.route("/analytics/department-counts", methods=["GET"])
def get_dept_counts():
    """
    GET /api/analytics/department-counts
    Pipeline 1: Department-wise student count.
    """
    try:
        collection = get_students_collection()
        data = execute_department_counts(collection)
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to run pipeline: {str(e)}"}), 500


@api_bp.route("/analytics/department-averages", methods=["GET"])
def get_dept_averages():
    """
    GET /api/analytics/department-averages
    Pipeline 2: Average marks by department.
    """
    try:
        collection = get_students_collection()
        data = execute_department_averages(collection)
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to run pipeline: {str(e)}"}), 500


@api_bp.route("/analytics/top-students", methods=["GET"])
def get_top_students():
    """
    GET /api/analytics/top-students?limit=5
    Pipeline 3: Top 5 students based on average marks.
    """
    try:
        limit = max(1, min(20, int(request.args.get("limit", 5))))
        collection = get_students_collection()
        data = execute_top_students(collection, limit=limit)
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to run pipeline: {str(e)}"}), 500


@api_bp.route("/analytics/grade-distribution", methods=["GET"])
def get_grade_dist():
    """
    GET /api/analytics/grade-distribution
    Pipeline 4: Grade distribution.
    """
    try:
        collection = get_students_collection()
        data = execute_grade_distribution(collection)
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to run pipeline: {str(e)}"}), 500


@api_bp.route("/analytics/semester-counts", methods=["GET"])
def get_sem_counts():
    """
    GET /api/analytics/semester-counts
    Pipeline 5: Semester-wise student count.
    """
    try:
        collection = get_students_collection()
        data = execute_semester_counts(collection)
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to run pipeline: {str(e)}"}), 500
