"""
validators.py - Input validation logic for student data and academic modules.
Validates fields before hitting MongoDB to return clear, beginner-friendly errors.
"""

import re

# Allowed academic departments in the institution
ALLOWED_DEPARTMENTS = ["CSE", "ECE", "MECH", "CIVIL", "IT", "AI&DS"]

# Standard regex for email address verification
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def validate_student_data(data, is_update=False):
    """
    Validates student payload for creation or update.
    Returns: (is_valid: bool, cleaned_data_or_errors: dict)
    If valid, returns (True, cleaned_data)
    If invalid, returns (False, error_dictionary)
    """
    errors = {}
    cleaned = {}

    if not isinstance(data, dict):
        return False, {"error": "Invalid request body: expected a JSON object."}

    # 1. Roll Number
    if not is_update or "roll_no" in data:
        roll_no = data.get("roll_no")
        if not roll_no or not isinstance(roll_no, str) or not roll_no.strip():
            errors["roll_no"] = "Roll number is required and cannot be blank."
        else:
            cleaned_roll = roll_no.strip().upper()
            if len(cleaned_roll) < 3 or len(cleaned_roll) > 20:
                errors["roll_no"] = "Roll number must be between 3 and 20 characters."
            else:
                cleaned["roll_no"] = cleaned_roll

    # 2. Student Full Name
    if not is_update or "name" in data:
        name = data.get("name")
        if not name or not isinstance(name, str) or not name.strip():
            errors["name"] = "Full name is required."
        else:
            cleaned_name = name.strip()
            if len(cleaned_name) < 2:
                errors["name"] = "Name must contain at least 2 characters."
            else:
                cleaned["name"] = cleaned_name

    # 3. Email Address
    if not is_update or "email" in data:
        email = data.get("email")
        if not email or not isinstance(email, str) or not email.strip():
            errors["email"] = "Email address is required."
        else:
            cleaned_email = email.strip().lower()
            if not EMAIL_REGEX.match(cleaned_email):
                errors["email"] = "Please provide a valid email address (e.g., student@example.com)."
            else:
                cleaned["email"] = cleaned_email

    # 4. Department
    if not is_update or "department" in data:
        department = data.get("department")
        if not department or not isinstance(department, str) or not department.strip():
            errors["department"] = f"Department is required. Choose from: {', '.join(ALLOWED_DEPARTMENTS)}."
        else:
            cleaned_dept = department.strip().upper()
            if cleaned_dept not in ALLOWED_DEPARTMENTS:
                errors["department"] = f"Invalid department '{department}'. Must be one of: {', '.join(ALLOWED_DEPARTMENTS)}."
            else:
                cleaned["department"] = cleaned_dept

    # 5. Semester
    if not is_update or "semester" in data:
        semester = data.get("semester")
        try:
            sem_int = int(semester)
            if sem_int < 1 or sem_int > 8:
                errors["semester"] = "Semester must be an integer between 1 and 8."
            else:
                cleaned["semester"] = sem_int
        except (ValueError, TypeError):
            errors["semester"] = "Semester must be a valid integer between 1 and 8."

    # 6. Marks (Nested document: DBMS, DSA, Python)
    if not is_update or "marks" in data:
        marks = data.get("marks")
        if not marks or not isinstance(marks, dict):
            errors["marks"] = "Marks must be an object with DBMS, DSA, and Python scores."
        else:
            cleaned_marks = {}
            for subject in ["DBMS", "DSA", "Python"]:
                if subject not in marks:
                    errors[f"marks.{subject}"] = f"Marks for {subject} are required."
                    continue
                score = marks.get(subject)
                try:
                    score_num = float(score)
                    if score_num < 0 or score_num > 100:
                        errors[f"marks.{subject}"] = f"{subject} marks must be between 0 and 100."
                    else:
                        cleaned_marks[subject] = int(score_num) if score_num.is_integer() else round(score_num, 2)
                except (ValueError, TypeError):
                    errors[f"marks.{subject}"] = f"{subject} marks must be a valid number between 0 and 100."

            # Preserve any additional optional subjects if passed
            for extra_subj, extra_val in marks.items():
                if extra_subj not in ["DBMS", "DSA", "Python"]:
                    try:
                        score_num = float(extra_val)
                        if 0 <= score_num <= 100:
                            cleaned_marks[extra_subj] = int(score_num) if score_num.is_integer() else round(score_num, 2)
                    except (ValueError, TypeError):
                        pass

            cleaned["marks"] = cleaned_marks

    # 7. Optional Metadata (Phone, Status, DOB, Address)
    if "phone" in data and data.get("phone") is not None:
        cleaned["phone"] = str(data["phone"]).strip()
    if "status" in data and data.get("status") is not None:
        val = str(data["status"]).strip().capitalize()
        cleaned["status"] = val if val in ["Active", "Inactive", "Archived"] else "Active"
    elif not is_update and "status" not in cleaned:
        cleaned["status"] = "Active"

    if "dob" in data and data.get("dob") is not None:
        cleaned["dob"] = str(data["dob"]).strip()
    if "address" in data and data.get("address") is not None:
        cleaned["address"] = str(data["address"]).strip()

    if errors:
        return False, errors
    return True, cleaned
