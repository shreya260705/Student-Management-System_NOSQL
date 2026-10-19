# Academic Submission: Screenshots Checklist & Capture Guide
## Course: Intelligent NoSQL Databases (CSE494)
## Project Title: Complete Student Management System Using MongoDB & PyMongo

**Candidate Name**: Shreya Tripathi 
**Registration Number**: 12308254  
**Roll Number**: 07   
**Department**: Computer Science & Engineering  
**Institution**: Lovely Professional University  
**GitHub Repository**: [https://github.com/shreya260705/Student-Management-System_NOSQL](https://github.com/shreya260705/Student-Management-System_NOSQL)  

---

This guide provides a structured, step-by-step checklist of all **15 essential screenshots** to capture from your browser, terminal, and MongoDB Compass for your academic project report and viva presentation.

---

## 1. Environment URLs & Quick Start

You can capture screenshots either using the **Dockerized Production Stack** or the **Local Development Stack**:

### Option A: Dockerized Application (Recommended)
```powershell
docker compose up -d
```
- **Web Application URL**: `http://localhost:8082`  
  *(Note: Port 8082 is configured in `.env` to avoid conflict with host port 8080)*
- **Backend Direct API**: `http://localhost:5000/api/health`

### Option B: Local Development Stack
- **Frontend URL**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 2. Master Screenshot Checklist (15 Essential Captures)

| # | Screenshot Filename | Source / Tool | View to Capture & What to Highlight |
| :-: | :--- | :--- | :--- |
| **01** | `01_dashboard_overview.png` | Browser (`http://localhost:8082`) | **Executive Academic Dashboard**: Capture the 4 KPI cards (Total Students: 16, Active Departments: 6, Institutional Average: ~67%, Top Performer), Department distribution bar chart, and Grade distribution chart. |
| **02** | `02_students_directory.png` | Browser (`/students`) | **Student Directory View**: Display the responsive table showing Roll Numbers, Names, Emails, Departments, Semesters, Marks breakdown, Average Scores, Letter Grade pills, and pagination. |
| **03** | `03_search_and_filter.png` | Browser (`/students`) | **Live Filter & Sorting**: Type a search query (e.g., `"Aarav"` or `"CSE"`), select a department filter (`CSE`), and sort by `Average Marks` descending. |
| **04** | `04_enroll_student_modal.png` | Browser Modal | **Enroll Student Modal Form**: Open the modal. Show clean fields for Roll Number, Name, Email, Department dropdown, Semester selector, and marks for DBMS, DSA, and Python. |
| **05** | `05_form_validation_error.png` | Browser Modal | **Client-Side Validation Error**: Enter an invalid mark (e.g., `120` or `-10`) or an invalid email format. Highlight the red validation alert message blocking submission. |
| **06** | `06_duplicate_key_error.png` | Browser Toast | **MongoDB Duplicate Key Protection**: Attempt to register a student with an already existing roll number (e.g., `CSE2024001`). Highlight the red HTTP 409 Conflict toast message. |
| **07** | `07_student_details_modal.png` | Browser Modal | **Student Profile & Marks Card**: Click "Details" on a student. Highlight the visual subject score progress bars (DBMS, DSA, Python), overall percentage, and Grade badge. |
| **08** | `08_edit_student_modal.png` | Browser Modal | **Update Record Workflow**: Click "Edit", modify a mark score, and show the real-time estimated average recalculation before saving. |
| **09** | `09_delete_confirmation.png` | Browser Modal | **Safe Deletion Dialog**: Click the trash icon. Highlight the safeguard confirmation dialog displaying the student's name and roll number. |
| **10** | `10_analytics_pipelines.png` | Browser (`/analytics`) | **MongoDB Aggregation Analytics**: Full view of the Analytics page showing interactive charts for Department Counts, Department Averages, Grade Distribution, and Semester Distribution. |
| **11** | `11_top_5_leaderboard.png` | Browser (`/analytics`) | **Top 5 Leaderboard**: Show the Top 5 ranked achievers table with Gold, Silver, and Bronze medal badges and computed Grade A scores. |
| **12** | `12_mongodb_compass_docs.png` | MongoDB Compass | **Compass Document Viewer**: Connect to `mongodb://localhost:27017/` (or via container). Open `student_management.students`. Show documents with native BSON `ObjectId`, embedded `marks`, and native `created_at` Date. |
| **13** | `13_mongodb_indexes.png` | MongoDB Compass | **Database Indexes Tab**: Show `idx_unique_roll_no` (Unique), `idx_unique_email` (Unique), `idx_department`, `idx_semester`, and `idx_name`. |
| **14** | `14_test_suite_passing.png` | Terminal | **Automated Tests Passing**: Run `python -m unittest tests/test_api.py`. Show terminal output: `Ran 14 tests in 0.353s OK`. |
| **15** | `15_docker_containers.png` | Terminal | **Docker Infrastructure Status**: Run `docker compose ps`. Show all 3 containers (`sms_mongodb`, `sms_backend`, `sms_frontend`) in `Up (healthy)` state. |

---

## 3. Recommended Capture Sequence & Viva Demonstration Tips

1. **Terminal Pre-Checks (Screenshots 14 & 15)**:
   - Run `docker compose ps` to prove your multi-container environment is healthy.
   - Run `docker compose exec backend python -m unittest tests/test_api.py` to demonstrate that all 14 automated tests pass inside the container.
2. **MongoDB Compass Inspection (Screenshots 12 & 13)**:
   - Show the examiner the raw BSON document structure in MongoDB Compass to defend your embedded marks design.
   - Click the "Indexes" tab in Compass to demonstrate how uniqueness is guaranteed at the database engine level.
3. **Application Interaction (Screenshots 01 to 11)**:
   - Navigate to `http://localhost:8082` in Google Chrome or Microsoft Edge.
   - Press `Win + Shift + S` (Windows Snipping Tool) to capture high-resolution screenshots.
   - Demonstrate the Top 5 Leaderboard and explain how the `$switch` and `$limit` aggregation stages function.
