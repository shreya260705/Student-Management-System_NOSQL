"""
app.py - Main entry point for Flask backend server.
Configures CORS, registers API blueprints, and ensures MongoDB collections & indexes are initialized.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from database import init_database, get_db
from routes import api_bp

# Load environment configuration
load_dotenv()


def create_app(test_config=None):
    """
    Application factory pattern for Flask.
    Allows easy switching between main and test databases.
    """
    app = Flask(__name__)

    # Allow requests from Vite frontend (localhost:5173 by default)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Apply configuration
    if test_config:
        app.config.update(test_config)

    # Initialize MongoDB collection, schema validation, and indexes
    db_name = app.config.get("DB_NAME", os.getenv("DB_NAME", "student_management"))
    mongo_uri = app.config.get("MONGO_URI", os.getenv("MONGO_URI", "mongodb://localhost:27017/"))

    try:
        db = get_db(db_name=db_name, uri=mongo_uri)
        init_database(db)
        print(f"[*] MongoDB initialized successfully for database: '{db_name}'")
    except Exception as e:
        print(f"[!] Warning: Failed to initialize MongoDB ({e}). Verify MongoDB service is running.")

    # Register API blueprint
    app.register_blueprint(api_bp)

    # Global HTTP error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed on this endpoint"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "An internal server error occurred"}), 500

    @app.route("/")
    def index():
        return jsonify({
            "project": "Student Management System API",
            "course": "Intelligent NoSQL Databases (CSE494)",
            "status": "Online",
            "endpoints": {
                "health": "/api/health",
                "students": "/api/students",
                "dashboard": "/api/dashboard/stats",
                "analytics_department_counts": "/api/analytics/department-counts",
                "analytics_department_averages": "/api/analytics/department-averages",
                "analytics_top_students": "/api/analytics/top-students",
                "analytics_grade_distribution": "/api/analytics/grade-distribution",
                "analytics_semester_counts": "/api/analytics/semester-counts"
            }
        }), 200

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[*] Starting Student Management System Backend on http://{host}:{port}")
    app.run(host=host, port=port, debug=True)
