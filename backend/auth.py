"""
auth.py - Authentication and Role-Based Authorization for EduManage.
Provides secure password hashing, timed cryptographic token generation,
middleware decorators, and initial administrator bootstrap.
"""

import os
from functools import wraps
from datetime import datetime, timezone
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from werkzeug.security import generate_password_hash, check_password_hash
from flask import request, jsonify, current_app

SECRET_KEY = os.getenv("SECRET_KEY", "edumanage-super-secure-secret-key-2026-cse494")
AUTH_SALT = "edumanage-auth-salt-v1"
serializer = URLSafeTimedSerializer(SECRET_KEY, salt=AUTH_SALT)


def hash_password(password: str) -> str:
    """Hashes a plaintext password using pbkdf2:sha256."""
    return generate_password_hash(password, method="pbkdf2:sha256")


def verify_password(password: str, hashed: str) -> bool:
    """Verifies a plaintext password against a stored hash."""
    if not password or not hashed:
        return False
    return check_password_hash(hashed, password)


def generate_token(user: dict, expires_in: int = 86400 * 7) -> str:
    """
    Generates a cryptographically signed timed token.
    Payload contains user ID, email, role, name, department, and assigned subjects.
    """
    payload = {
        "user_id": str(user.get("_id") or user.get("id")),
        "email": user.get("email"),
        "role": user.get("role", "student"),
        "name": user.get("name", ""),
        "associated_id": user.get("associated_id", ""),
        "department": user.get("department", ""),
        "assigned_subjects": user.get("assigned_subjects", []),
        "assigned_classes": user.get("assigned_classes", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    return serializer.dumps(payload)


def verify_token(token: str, max_age: int = 86400 * 7):
    """
    Verifies token signature and checks expiration.
    Returns payload dict if valid, None if invalid or expired.
    """
    try:
        return serializer.loads(token, max_age=max_age)
    except (SignatureExpired, BadSignature, Exception):
        return None


def get_token_from_header() -> str:
    """Extracts Bearer token from Authorization or X-Auth-Token header."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return request.headers.get("X-Auth-Token", "").strip()


def token_required(optional: bool = False):
    """
    Decorator that verifies incoming token.
    If optional=True and no token is present, request proceeds with request.current_user = None.
    If optional=False, returns 401 if missing or invalid.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = get_token_from_header()
            if not token:
                if optional:
                    request.current_user = None
                    return f(*args, **kwargs)
                return jsonify({"error": "Authentication required. Please log in."}), 401

            payload = verify_token(token)
            if not payload:
                if optional:
                    request.current_user = None
                    return f(*args, **kwargs)
                return jsonify({"error": "Invalid or expired session token. Please log in again."}), 401

            request.current_user = payload
            return f(*args, **kwargs)
        return decorated
    return decorator


def role_required(*allowed_roles):
    """
    Decorator that enforces role-based access control.
    Example: @role_required('admin') or @role_required('admin', 'teacher')
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = get_token_from_header()
            if not token:
                return jsonify({"error": "Authentication required"}), 401

            payload = verify_token(token)
            if not payload:
                return jsonify({"error": "Invalid or expired token"}), 401

            user_role = payload.get("role", "student")
            if user_role not in allowed_roles:
                return jsonify({
                    "error": "Forbidden: You do not have permission to perform this action.",
                    "required_roles": list(allowed_roles),
                    "your_role": user_role
                }), 403

            request.current_user = payload
            return f(*args, **kwargs)
        return decorated
    return decorator


def ensure_default_admin(db):
    """
    Ensures that a default administrator account exists in the database.
    Safe to call on startup. Never overwrites existing accounts.
    Default credentials:
      email: admin@edumanage.edu
      password: Admin@123
    """
    try:
        users_col = db["users"]
        existing_admin = users_col.find_one({"role": "admin"})
        if not existing_admin:
            admin_doc = {
                "name": "System Administrator",
                "email": "admin@edumanage.edu",
                "password_hash": hash_password("Admin@123"),
                "role": "admin",
                "department": "Administration",
                "status": "Active",
                "created_at": datetime.now(timezone.utc)
            }
            users_col.insert_one(admin_doc)
            print("[*] Default administrator account created: admin@edumanage.edu (Password: Admin@123)")
    except Exception as e:
        print(f"[!] Warning: Could not verify/create default admin: {str(e)}")
