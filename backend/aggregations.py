"""
aggregations.py - Dedicated MongoDB Aggregation Pipelines using PyMongo.
Written with clear stages and explanations for CSE494 viva defense.
"""

from pymongo.collection import Collection


def get_department_counts_pipeline():
    """
    Pipeline 1: Department-wise Student Count.
    Stages:
      1. $group: Groups all documents by 'department' and counts them using {$sum: 1}.
      2. $sort: Sorts departments in descending order by student count.
      3. $project: Reshapes output fields to cleaner names {department, count}.
    """
    return [
        {
            "$group": {
                "_id": "$department",
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {
                "count": -1,
                "_id": 1
            }
        },
        {
            "$project": {
                "_id": 0,
                "department": "$_id",
                "count": 1
            }
        }
    ]


def get_department_averages_pipeline():
    """
    Pipeline 2: Average Marks by Department.
    Stages:
      1. $project: Computes student average = (DBMS + DSA + Python) / 3.0.
      2. $group: Groups by department and calculates $avg of student averages.
      3. $project: Rounds average marks to 2 decimal places.
      4. $sort: Sorts descending by department average score.
    """
    return [
        {
            "$project": {
                "department": 1,
                "student_avg": {
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
                }
            }
        },
        {
            "$group": {
                "_id": "$department",
                "average_marks": {"$avg": "$student_avg"},
                "student_count": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "department": "$_id",
                "average_marks": {"$round": ["$average_marks", 2]},
                "student_count": 1
            }
        },
        {
            "$sort": {
                "average_marks": -1
            }
        }
    ]


def get_top_students_pipeline(limit=5):
    """
    Pipeline 3: Top Students Ranked by Average Marks.
    Stages:
      1. $project: Computes individual student average marks and retains details.
      2. $addFields: Evaluates letter grade based on college boundaries:
             A: >= 80, B: >= 70, C: >= 60, D: >= 40, F: < 40.
      3. $sort: Orders students descending by average marks.
      4. $limit: Selects top N students (default 5).
      5. $project: Converts _id to string and projects clean fields.
    """
    return [
        {
            "$project": {
                "roll_no": 1,
                "name": 1,
                "email": 1,
                "department": 1,
                "semester": 1,
                "marks": 1,
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
        {
            "$addFields": {
                "grade": {
                    "$switch": {
                        "branches": [
                            {"case": {"$gte": ["$average_marks", 80]}, "then": "A"},
                            {"case": {"$gte": ["$average_marks", 70]}, "then": "B"},
                            {"case": {"$gte": ["$average_marks", 60]}, "then": "C"},
                            {"case": {"$gte": ["$average_marks", 40]}, "then": "D"}
                        ],
                        "default": "F"
                    }
                }
            }
        },
        {
            "$sort": {
                "average_marks": -1,
                "name": 1
            }
        },
        {
            "$limit": limit
        },
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "id": {"$toString": "$_id"},
                "roll_no": 1,
                "name": 1,
                "email": 1,
                "department": 1,
                "semester": 1,
                "marks": 1,
                "average_marks": 1,
                "grade": 1
            }
        }
    ]


def get_grade_distribution_pipeline():
    """
    Pipeline 4: Grade Distribution.
    Stages:
      1. $project: Computes student average marks.
      2. $project: Evaluates grade letter using $switch.
      3. $group: Groups by grade letter and counts students in each grade.
      4. $project: Cleans field names.
    """
    return [
        {
            "$project": {
                "average_marks": {
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
                }
            }
        },
        {
            "$project": {
                "grade": {
                    "$switch": {
                        "branches": [
                            {"case": {"$gte": ["$average_marks", 80]}, "then": "A"},
                            {"case": {"$gte": ["$average_marks", 70]}, "then": "B"},
                            {"case": {"$gte": ["$average_marks", 60]}, "then": "C"},
                            {"case": {"$gte": ["$average_marks", 40]}, "then": "D"}
                        ],
                        "default": "F"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$grade",
                "count": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "grade": "$_id",
                "count": 1
            }
        }
    ]


def get_semester_counts_pipeline():
    """
    Pipeline 5: Semester-wise Student Count.
    Stages:
      1. $group: Groups by 'semester' and counts students using $sum: 1.
      2. $sort: Orders sequentially from semester 1 to 8.
      3. $project: Cleans field names.
    """
    return [
        {
            "$group": {
                "_id": "$semester",
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {
                "_id": 1
            }
        },
        {
            "$project": {
                "_id": 0,
                "semester": "$_id",
                "count": 1
            }
        }
    ]


# ==============================================================================
# Execution wrappers with PyMongo & safe empty collection handling
# ==============================================================================

def execute_department_counts(collection: Collection):
    """Executes Pipeline 1 via PyMongo."""
    pipeline = get_department_counts_pipeline()
    results = list(collection.aggregate(pipeline))
    return results


def execute_department_averages(collection: Collection):
    """Executes Pipeline 2 via PyMongo."""
    pipeline = get_department_averages_pipeline()
    results = list(collection.aggregate(pipeline))
    return results


def execute_top_students(collection: Collection, limit=5):
    """Executes Pipeline 3 via PyMongo."""
    pipeline = get_top_students_pipeline(limit)
    results = list(collection.aggregate(pipeline))
    return results


def execute_grade_distribution(collection: Collection):
    """
    Executes Pipeline 4 via PyMongo.
    Guarantees that all grades [A, B, C, D, F] exist in the output even with 0 counts.
    """
    pipeline = get_grade_distribution_pipeline()
    raw_results = list(collection.aggregate(pipeline))
    counts_map = {item["grade"]: item["count"] for item in raw_results if "grade" in item}

    # Ensure all canonical grade letters are returned in ordered fashion
    ordered_grades = ["A", "B", "C", "D", "F"]
    return [{"grade": g, "count": counts_map.get(g, 0)} for g in ordered_grades]


def execute_semester_counts(collection: Collection):
    """Executes Pipeline 5 via PyMongo."""
    pipeline = get_semester_counts_pipeline()
    results = list(collection.aggregate(pipeline))
    return results


def execute_dashboard_summary(collection: Collection):
    """
    Aggregates overall summary KPIs for the dashboard:
    - total_students
    - total_departments
    - overall_average
    - highest_scoring_student
    - department_distribution
    - grade_distribution
    - recent_students
    Handles empty collection safely.
    """
    total_students = collection.count_documents({})

    if total_students == 0:
        return {
            "total_students": 0,
            "total_departments": 0,
            "overall_average": 0.0,
            "highest_scoring_student": None,
            "department_distribution": [],
            "grade_distribution": [{"grade": g, "count": 0} for g in ["A", "B", "C", "D", "F"]],
            "recent_students": []
        }

    # Distinct departments count
    departments = collection.distinct("department")
    total_departments = len(departments)

    # Overall average calculation across all students
    overall_avg_pipeline = [
        {
            "$project": {
                "student_avg": {
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
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "overall_average": {"$avg": "$student_avg"}
            }
        }
    ]
    avg_result = list(collection.aggregate(overall_avg_pipeline))
    overall_average = round(avg_result[0]["overall_average"], 2) if avg_result else 0.0

    # Highest scoring student
    top_students = execute_top_students(collection, limit=1)
    highest_student = top_students[0] if top_students else None

    # Distributions
    dept_dist = execute_department_counts(collection)
    grade_dist = execute_grade_distribution(collection)

    # 5 Most recently added students
    from database import serialize_student
    recent_docs = list(collection.find().sort("created_at", -1).limit(5))
    recent_students = [serialize_student(doc) for doc in recent_docs]

    return {
        "total_students": total_students,
        "total_departments": total_departments,
        "overall_average": overall_average,
        "highest_scoring_student": highest_student,
        "department_distribution": dept_dist,
        "grade_distribution": grade_dist,
        "recent_students": recent_students
    }
