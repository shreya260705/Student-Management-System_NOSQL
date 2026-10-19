# Academic Project Report
## Course: Intelligent NoSQL Databases (CSE494)
## Project Title: Complete Student Management System Using MongoDB & PyMongo

**Candidate Name**: SHREYA TRIPATHI
**Registration Number**: 12308254  
**Roll Number**: 07
**Section**: K3P23MP  
**Department**: Computer Science & Engineering  
**Institution**: Lovely Professional University  
**GitHub Repository**: [https://github.com/shreya260705/Student-Management-System_NOSQL](https://github.com/shreya260705/Student-Management-System_NOSQL)  
**Academic Session**: 2026-2027  

---

## Academic Evaluation Rubric Mapping (Total: 30 Marks)

| Evaluation Component | Maximum Marks | Key Criteria Addressed in Project | Report Section |
| :--- | :---: | :--- | :--- |
| **1. Implementation & Functionality** | **15 Marks** | | |
| - *Database Design & Schema Validation* | 3 Marks | Embedded BSON document design, collection-level `$jsonSchema` validation rules, unique & secondary B-Tree indexing. | Sections 4 & 5 |
| - *PyMongo Integration & Connection* | 3 Marks | Pure low-level PyMongo 4.8 driver, singleton connection pooling, dynamic database context resolution, BSON serialization. | Section 6 |
| - *CRUD Operations & REST API* | 4 Marks | 12 REST API endpoints, pagination, server-side validation, duplicate key (11000) & validation (121) error handling. | Sections 7 & 8 |
| - *Aggregation Framework (5 Pipelines)* | 5 Marks | 5 multi-stage aggregation pipelines (`$group`, `$project`, `$sort`, `$switch`, `$limit`, `$facet`) executed inside MongoDB. | Section 9 |
| **2. Project Report Quality** | **5 Marks** | | |
| - *Problem Statement & NoSQL Justification*| 1 Mark | RDBMS limitations, object-relational impedance mismatch, data locality rationale. | Sections 1 & 2 |
| - *Architecture & Technical Design* | 1 Mark | High-level architecture, 3-tier containerized microservices, Nginx reverse proxy. | Section 3 |
| - *Document Schema & Pipeline Analysis* | 2 Marks | Full BSON schema specification, stage-by-stage pipeline execution mechanics and algebra. | Sections 4 & 9 |
| - *Verification & Test Suite Documentation* | 1 Mark | 14 automated unit tests passing against an isolated test database with zero side effects. | Section 10 |
| **3. Presentation & Viva Defense** | **10 Marks** | | |
| - *Conceptual Mastery* | 4 Marks | Deep knowledge of BSON types, `COLLSCAN` vs `IXSCAN`, document atomicity, indexing. | Section 11 & `VIVA_QUESTIONS.md` |
| - *Codebase Architecture Walkthrough* | 3 Marks | Clear explanation of frontend state, Flask blueprints, and Docker network topology. | Section 3 & `PROJECT_ARCHITECTURE.md` |
| - *Live Execution & Query Demonstration* | 3 Marks | Working Docker deployment, live Compass verification, real-time UI interaction. | Section 12 & `SCREENSHOTS_GUIDE.md` |
| **Total Marks** | **30 Marks** | **Comprehensive Full-Stack Implementation & Academic Documentation** | **Full Submission** |

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem with Relational Systems in Academic Administration
Traditional academic management software predominantly relies on Relational Database Management Systems (RDBMS) such as MySQL, PostgreSQL, or Oracle. In a normalized RDBMS schema, storing a student's profile, academic standing, and subject-wise examination scores requires multiple tables (e.g., `students`, `courses`, `enrollments`, `marks`) linked by primary and foreign key constraints.

While relational models enforce tabular normalization (3NF/BCNF), they introduce severe architectural inefficiencies in modern educational dashboards:
1. **High Join Latency**: Computing a student's overall GPA, ranking, or departmental distribution requires multi-table `JOIN` operations across thousands of rows, leading to heavy disk I/O and query contention.
2. **Schema Rigidity**: Academic institutions frequently introduce elective courses, modify scoring rubrics, or introduce new evaluation criteria (e.g., continuous assessments, practicals). Altering relational schemas requires intrusive `ALTER TABLE` locks that risk database downtime.
3. **Object-Relational Impedance Mismatch**: Web frontend frameworks (React) and backend API frameworks (Flask) naturally operate with hierarchical JSON objects. Translating relational table rows into nested JSON hierarchies requires heavy Object-Relational Mapping (ORM) translation layers.

### 1.2 Proposed NoSQL Solution
This project develops a complete, production-ready **Student Management System (SMS)** using **MongoDB** as a document-oriented NoSQL database and **PyMongo** as the Python database driver, coupled with a modern **React 19 (Vite + Tailwind CSS + Recharts)** frontend.

By storing academic marks directly embedded inside the student document, the application guarantees **data locality**—a single read operation fetches the student's complete academic record without joins. Complex academic statistics, departmental performance metrics, and letter grade classifications are computed entirely inside MongoDB using high-performance **Aggregation Pipelines**, eliminating the need to pull raw records into the application tier for manual computation.

---

## 2. Why NoSQL & MongoDB Over Relational Databases?

| Architectural Dimension | Relational Database (e.g., MySQL / PostgreSQL) | MongoDB Document Store (Implemented) | Project Advantage |
| :--- | :--- | :--- | :--- |
| **Data Storage Model** | Flat rows across separate normalized tables linked by foreign keys | Hierarchical BSON (Binary JSON) documents with embedded structures | Eliminates the `marks` table; marks are stored directly inside the student document |
| **Data Retrieval** | Requires multi-table `INNER JOIN` / `LEFT JOIN` queries | Single-seek document fetch (`find_one({"roll_no": ...})`) | $O(1)$ to $O(\log N)$ document retrieval; zero join overhead |
| **Data Locality** | Data is scattered across multiple disk pages for each table | Entire student document is stored contiguously on disk | Dramatic reduction in disk I/O and cache misses |
| **Schema Evolution** | Rigid DDL; schema alterations require migration scripts and locks | Dynamic document model with optional `$jsonSchema` validation | Easy to add new subjects, elective tracks, or extracurricular fields |
| **Analytics Processing** | SQL `GROUP BY` and window functions across joined tables | Native Aggregation Pipeline framework (`$group`, `$project`, `$switch`) | Analytics execute directly inside the database engine; minimal network payload |
| **Write Atomicity** | Multi-table transactions require distributed locking and WAL overhead | Single-document ACID guarantees natively provided by WiredTiger | Atomic updates of student profile and marks in a single operation (`update_one`) |
| **Scalability** | Vertical scaling (larger CPU/RAM); complex manual sharding | Built-in horizontal sharding and replica set clustering | Can horizontally partition collections across commodity clusters |

---

## 3. High-Level System Architecture & Infrastructure

The system is architected as a **decoupled 3-tier containerized microservice application** running on a private Docker bridge network (`sms_network`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT TIER (User Browser)                           │
│  - Modern Web Browser (Google Chrome / Edge / Firefox)                 │
│  - React 19 Single Page Application (SPA) UI                           │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ HTTP / Port 8082 (Host)
┌───────────────────────────────────▼────────────────────────────────────┐
│              DOCKER CONTAINER: sms_frontend (Nginx 1.27 Alpine)        │
│  - Serves static compiled React 19 assets (index.html, JS, CSS)        │
│  - Reverse Proxy: /api/* -> http://backend:5000/api/*                  │
│  - Single Page Application fallback routing (try_files)                │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ HTTP / Port 5000 (Internal DNS)
┌───────────────────────────────────▼────────────────────────────────────┐
│              DOCKER CONTAINER: sms_backend (Python 3.11 + Flask)       │
│  - Flask Application Factory & CORS Handling (app.py)                  │
│  - 12 REST API Endpoints with HTTP status codes (routes.py)            │
│  - Payload Validation & Range Checking (validators.py)                 │
│  - 5 Multi-Stage MongoDB Aggregation Pipelines (aggregations.py)       │
│  - PyMongo Connection Pooling & BSON Serializer (database.py)          │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ PyMongo Wire Protocol (TCP 27017)
┌───────────────────────────────────▼────────────────────────────────────┐
│              DOCKER CONTAINER: sms_mongodb (MongoDB 7.0 Community)     │
│  - Database: student_management                                        │
│  - Collection: students                                                │
│  - Engine-level $jsonSchema validation (validationAction: "error")     │
│  - B-Tree Indexes: unique(roll_no), unique(email), dept, sem, name     │
│  - Named Volume Persistence: sms_mongo_data -> /data/db                │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Docker Multi-Container Architecture
The system is deployed using `docker-compose.yml` with 3 isolated containers:
1. **`sms_mongodb`**:
   - Image: `mongo:7.0`
   - Data Directory: `/data/db` backed by persistent named volume `sms_mongo_data`.
   - Healthcheck: Executes `echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet` every 10 seconds.
2. **`sms_backend`**:
   - Base Image: `python:3.11-slim`
   - Connection URI: `mongodb://database:27017/` (resolves via Docker internal DNS).
   - Healthcheck: Performs HTTP GET on `/api/health` using `urllib.request`.
   - Dependency Order: Waits for `sms_mongodb` to be `service_healthy`.
3. **`sms_frontend`**:
   - Multi-stage build: Stage 1 builds React static assets via `node:20-alpine`; Stage 2 deploys them to `nginx:1.27-alpine`.
   - Host Port Mapping: `${FRONTEND_PORT:-8080}:80`. In root `.env`, `FRONTEND_PORT=8082` is configured because the host machine has an active Jenkins service running on port 8080.
   - Nginx Reverse Proxy: Proxies all `/api/` calls to `http://backend:5000`, completely eliminating Cross-Origin Resource Sharing (CORS) issues in production.

---

## 4. MongoDB Document Design & Data Modeling

### 4.1 Production Document Schema
Every student record is stored in the `students` collection of the `student_management` database:

```json
{
  "_id": ObjectId("6ad5d5451e3176333086b99f"),
  "roll_no": "CSE2024001",
  "name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "department": "CSE",
  "semester": 6,
  "marks": {
    "DBMS": 92,
    "DSA": 96,
    "Python": 94
  },
  "created_at": ISODate("2026-10-19T04:31:01.953Z")
}
```

### 4.2 Data Modeling Decisions
1. **Embedded Sub-Document for `marks`**:
   - Marks for core subjects (`DBMS`, `DSA`, `Python`) are embedded directly inside the document.
   - **Why not a separate collection?** Subject marks are never queried in isolation from the student's profile. Embedding guarantees that fetching a student record requires exactly **one disk read**.
   - **Bounded Cardinality**: Academic subjects for a semester are fixed in number. This ensures the document will never grow unbounded, comfortably remaining within MongoDB's 16MB document size limit.
2. **BSON ObjectId as Primary Key**:
   - The `_id` field contains a 12-byte BSON ObjectId consisting of a 4-byte timestamp, 5-byte random value, and 3-byte incrementing counter.
   - Provides distributed uniqueness without locking or requiring an auto-increment sequence generator.
3. **Native BSON Date for `created_at`**:
   - Stored using Python's `datetime.now(timezone.utc)`, which PyMongo serializes to a native BSON 64-bit integer timestamp.
   - Enables fast chronological indexing, native date sorting, and MongoDB date aggregation operators (`$year`, `$month`, `$dateToString`).

---

## 5. Database-Level Validation & Indexing Strategy

### 5.1 Collection-Level `$jsonSchema` Validation
To enforce strict data integrity directly at the database engine level, the `students` collection is configured with a `$jsonSchema` validator in `backend/database.py`:

```python
STUDENT_JSON_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["roll_no", "name", "email", "department", "semester", "marks", "created_at"],
        "properties": {
            "_id": {"bsonType": "objectId"},
            "roll_no": {"bsonType": "string", "description": "must be a string and is required"},
            "name": {"bsonType": "string", "description": "must be a string and is required"},
            "email": {
                "bsonType": "string",
                "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                "description": "must be a valid email string"
            },
            "department": {
                "bsonType": "string",
                "enum": ["CSE", "ECE", "MECH", "CIVIL", "IT", "AI&DS"],
                "description": "must be one of the recognized departments"
            },
            "semester": {
                "bsonType": ["int", "long", "double"],
                "minimum": 1,
                "maximum": 8,
                "description": "must be an integer between 1 and 8"
            },
            "marks": {
                "bsonType": "object",
                "required": ["DBMS", "DSA", "Python"],
                "properties": {
                    "DBMS": {"bsonType": ["int", "long", "double"], "minimum": 0, "maximum": 100},
                    "DSA": {"bsonType": ["int", "long", "double"], "minimum": 0, "maximum": 100},
                    "Python": {"bsonType": ["int", "long", "double"], "minimum": 0, "maximum": 100}
                },
                "additionalProperties": False
            },
            "created_at": {"bsonType": "date", "description": "must be a valid date"}
        },
        "additionalProperties": False
    }
}
```

- **Validation Level**: `strict`
- **Validation Action**: `error` (MongoDB rejects any invalid write and throws `OperationFailure` with error code `121`).

### 5.2 B-Tree Indexing Strategy
To eliminate expensive Collection Scans (`COLLSCAN`) and guarantee uniqueness, the following indexes are created on startup:

| Index Name | Key Definition | Type | Purpose & Query Optimization |
| :--- | :--- | :--- | :--- |
| `idx_unique_roll_no` | `{"roll_no": 1}` | **Unique B-Tree** | Enforces institutional uniqueness. Guarantees $O(\log N)$ point lookups. |
| `idx_unique_email` | `{"email": 1}` | **Unique B-Tree** | Prevents duplicate student email registrations across the database. |
| `idx_department` | `{"department": 1}` | Secondary B-Tree | Accelerates departmental filtering and optimizes Pipeline 1 & 2 `$group` stages. |
| `idx_semester` | `{"semester": 1}` | Secondary B-Tree | Speeds up semester filtering and Pipeline 5 cohort aggregations. |
| `idx_name` | `{"name": 1}` | Secondary B-Tree | Optimizes alphabetical directory sorting and regex prefix searches (`^Aarav`). |

---

## 6. PyMongo Backend Driver Integration

The backend is built with Python 3.11 and Flask 3.0, interacting with MongoDB through the official **PyMongo 4.8.0** driver without any intermediary ORM/ODM layers.

### 6.1 Connection Management & Singleton Pattern
In `backend/database.py`, a thread-safe singleton connection is established:
- **Connection Pool**: `MongoClient` automatically maintains an internal TCP socket pool, eliminating the latency of repeated TCP handshakes.
- **Dynamic Context Resolution**: `get_current_db()` checks Flask's `current_app.config["MONGO_DB_NAME"]`. During standard execution, it routes to `student_management`; during automated tests, it seamlessly routes to `student_management_test`.

### 6.2 Error Handling & Status Codes
1. **Duplicate Key Violations (`DuplicateKeyError`, Code 11000)**:
   - When an administrator attempts to insert or update a student with an existing `roll_no` or `email`, PyMongo raises `DuplicateKeyError`.
   - The route handler catches this exception, parses the duplicate key, and responds with **HTTP 409 Conflict** and an explicit error message.
2. **Schema Validation Violations (`OperationFailure`, Code 121)**:
   - If a document fails collection `$jsonSchema` rules (e.g., marks out of bounds), MongoDB throws `OperationFailure` (code 121).
   - The backend intercepts this error and returns **HTTP 400 Bad Request**.
3. **BSON Serialization**:
   - Native BSON objects (`ObjectId`, `datetime.datetime`) cannot be natively serialized by Python's `json.dumps`.
   - The `serialize_student()` utility converts `_id` to a string (`str(doc["_id"])`), formats `created_at` as an ISO-8601 string, and dynamically calculates computed fields (`average_marks` and letter `grade`).

---

## 7. The 5 Mandatory Aggregation Pipelines (Deep Analysis)

All analytical queries are implemented in `backend/aggregations.py` and execute entirely inside MongoDB's C++ aggregation engine.

### Pipeline 1: Department-wise Student Count
- **Objective**: Aggregates total student enrollment per academic department.
- **PyMongo Function**: `get_dept_student_count(db)`
- **Pipeline Structure**:
  ```python
  [
      {"$group": {"_id": "$department", "count": {"$sum": 1}}},
      {"$sort": {"count": -1, "_id": 1}},
      {"$project": {"_id": 0, "department": "$_id", "count": 1}}
  ]
  ```
- **Execution Mechanics**:
  1. `$group`: Utilizes `idx_department` to partition documents by `$department`. Accumulator `{"$sum": 1}` increments a counter for each document in the partition.
  2. `$sort`: Orders the partitions descending by `count`, with department name as secondary tie-breaker.
  3. `$project`: Suppresses the raw `_id` and outputs a clean JSON schema: `{"department": "CSE", "count": 5}`.

---

### Pipeline 2: Average Marks by Department
- **Objective**: Computes institutional academic performance comparing disciplines across all 3 subjects.
- **PyMongo Function**: `get_dept_avg_marks(db)`
- **Pipeline Structure**:
  ```python
  [
      {
          "$project": {
              "department": 1,
              "student_avg": {
                  "$divide": [
                      {"$add": ["$marks.DBMS", "$marks.DSA", "$marks.Python"]},
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
      {"$sort": {"average_marks": -1}}
  ]
  ```
- **Execution Mechanics**:
  1. `$project`: Calculates each student's arithmetic mean:
     $$\text{student\_avg} = \frac{\text{marks.DBMS} + \text{marks.DSA} + \text{marks.Python}}{3.0}$$
  2. `$group`: Groups by department and applies the `$avg` accumulator across all calculated student averages in each department.
  3. `$project`: Applies the `$round` operator to round the department average to 2 decimal places.
  4. `$sort`: Orders departments from highest performing to lowest.

---

### Pipeline 3: Top 5 Students Ranked by Average Marks
- **Objective**: Identifies top academic achievers across the institution and assigns letter grades.
- **PyMongo Function**: `get_top_students(db, limit=5)`
- **Pipeline Structure**:
  ```python
  [
      {
          "$project": {
              "roll_no": 1, "name": 1, "email": 1, "department": 1, "semester": 1, "marks": 1,
              "average_marks": {
                  "$round": [
                      {"$divide": [{"$add": ["$marks.DBMS", "$marks.DSA", "$marks.Python"]}, 3.0]},
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
      {"$sort": {"average_marks": -1, "name": 1}},
      {"$limit": 5}
  ]
  ```
- **Execution Mechanics**:
  1. `$project`: Retains student identity fields and computes `average_marks` rounded to 2 decimal places.
  2. `$addFields` + `$switch`: Evaluates multi-way conditional logic directly inside MongoDB, classifying scores into canonical academic grades:
     - Average $\ge 80 \implies \text{"A"}$
     - Average $\ge 70 \implies \text{"B"}$
     - Average $\ge 60 \implies \text{"C"}$
     - Average $\ge 40 \implies \text{"D"}$
     - Otherwise $\implies \text{"F"}$
  3. `$sort`: Sorts records descending by `average_marks`.
  4. `$limit`: Halts pipeline execution after emitting the top 5 records.

---

### Pipeline 4: Academic Grade Distribution
- **Objective**: Categorizes every student into letter grades (`A`, `B`, `C`, `D`, `F`) and calculates cohort counts for institutional reporting.
- **PyMongo Function**: `get_grade_distribution(db)`
- **Pipeline Structure**:
  ```python
  [
      {
          "$project": {
              "average_marks": {
                  "$divide": [{"$add": ["$marks.DBMS", "$marks.DSA", "$marks.Python"]}, 3.0]
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
      {"$group": {"_id": "$grade", "count": {"$sum": 1}}},
      {"$project": {"_id": 0, "grade": "$_id", "count": 1}}
  ]
  ```
- **Execution Mechanics**:
  1. Stage 1 & 2: Maps continuous marks to discrete grades (`A`, `B`, `C`, `D`, `F`) via `$switch`.
  2. Stage 3 (`$group`): Aggregates total occurrences of each grade across the institution.
  3. Python Post-Processing: Ensures zero-count grades are preserved in the final JSON array (`[{"grade": "A", "count": 6}, {"grade": "B", "count": 5}, ...]`), ensuring Recharts renders consistent bar categories even when a grade has zero students.

---

### Pipeline 5: Semester-wise Student Count
- **Objective**: Computes student enrollment across academic semesters 1 through 8.
- **PyMongo Function**: `get_semester_distribution(db)`
- **Pipeline Structure**:
  ```python
  [
      {"$group": {"_id": "$semester", "count": {"$sum": 1}}},
      {"$sort": {"_id": 1}},
      {"$project": {"_id": 0, "semester": "$_id", "count": 1}}
  ]
  ```
- **Execution Mechanics**:
  1. `$group`: Groups documents by `$semester` and counts occurrences.
  2. `$sort`: Sorts cohorts numerically from Semester 1 to Semester 8.
  3. `$project`: Formats output to `{"semester": 6, "count": 3}`.

---

## 8. Complete REST API Specification

The application exposes 12 REST API endpoints defined in `backend/routes.py`:

| Method | Endpoint | Query / Body Payload | Success Response | Status Codes | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | None | `{"status": "ok", "database": "connected"}` | 200, 503 | Server & MongoDB ping status check |
| `GET` | `/api/students` | `page`, `limit`, `search`, `department`, `semester`, `sort_by`, `sort_dir` | `{"students": [...], "pagination": {...}}` | 200 | Paginated, searchable, filterable student directory |
| `GET` | `/api/students/<id>` | Path: BSON ObjectId string | `{"student": {...}}` | 200, 400, 404 | Retrieves single student details by ID |
| `POST` | `/api/students` | JSON body with student fields | `{"message": "...", "student": {...}}` | 201, 400, 409 | Enrolls new student; enforces schema & unique keys |
| `PUT` | `/api/students/<id>` | JSON body with updated fields | `{"message": "...", "student": {...}}` | 200, 400, 404, 409 | Updates existing student record |
| `DELETE` | `/api/students/<id>` | Path: BSON ObjectId string | `{"message": "Student deleted successfully"}` | 200, 400, 404 | Deletes student document from MongoDB |
| `GET` | `/api/analytics/dashboard` | None | `{"stats": {total, dept_count, avg, ...}}` | 200 | Aggregated KPI stats for top dashboard cards |
| `GET` | `/api/analytics/dept-count` | None | `{"data": [{"department": "CSE", "count": 5}, ...]}` | 200 | Pipeline 1: Student count by department |
| `GET` | `/api/analytics/dept-avg` | None | `{"data": [{"department": "IT", "average_marks": 78.4}, ...]}`| 200 | Pipeline 2: Average marks by department |
| `GET` | `/api/analytics/top-students` | `limit` (default: 5) | `{"data": [{"name": "...", "average_marks": 94.0}, ...]}` | 200 | Pipeline 3: Top 5 student leaderboard |
| `GET` | `/api/analytics/grades` | None | `{"data": [{"grade": "A", "count": 6}, ...]}` | 200 | Pipeline 4: Academic grade distribution |
| `GET` | `/api/analytics/semesters` | None | `{"data": [{"semester": 1, "count": 2}, ...]}` | 200 | Pipeline 5: Semester distribution |

---

## 9. Automated Testing & Verification Report

### 9.1 Test Isolation Architecture
A critical requirement of academic software development is that automated testing must **never delete, overwrite, or corrupt production data**.
In `backend/tests/test_api.py`, the test suite creates an isolated test environment:
- Sets `MONGO_DB_NAME = "student_management_test"`.
- Initializes `$jsonSchema` validators and indexes on the test collection.
- Seeds fresh test fixtures before each test method in `setUp()`.
- Drops the entire `student_management_test` database upon suite completion in `tearDownClass()`.

### 9.2 Test Suite Execution Command
Inside the Docker backend container or in the local environment:
```powershell
python -m unittest tests/test_api.py
```

### 9.3 Test Results Matrix
```
................
----------------------------------------------------------------------
Ran 14 tests in 0.353s

OK
```

| # | Test Method Name | Verification Objective | HTTP Code | Status |
| :-: | :--- | :--- | :-: | :---: |
| 1 | `test_health_check` | MongoDB connection status and ping response | 200 OK | **PASSED** |
| 2 | `test_create_student_success` | Full BSON document insertion with auto Date & ObjectId | 201 Created | **PASSED** |
| 3 | `test_duplicate_roll_number` | Unique index prevents duplicate `roll_no` insertion | 409 Conflict | **PASSED** |
| 4 | `test_duplicate_email` | Unique index prevents duplicate `email` insertion | 409 Conflict | **PASSED** |
| 5 | `test_invalid_marks_out_of_bounds` | Rejects marks $< 0$ or $> 100$ | 400 Bad Request | **PASSED** |
| 6 | `test_invalid_semester` | Rejects semester $< 1$ or $> 8$ | 400 Bad Request | **PASSED** |
| 7 | `test_invalid_email_format` | Rejects malformed email string | 400 Bad Request | **PASSED** |
| 8 | `test_get_student_by_id` | Verifies single document lookup by 24-character BSON ID | 200 OK | **PASSED** |
| 9 | `test_get_nonexistent_student` | Verifies 404 response for missing ObjectId | 404 Not Found | **PASSED** |
| 10 | `test_search_and_filter_students`| Validates regex name search and department filtering | 200 OK | **PASSED** |
| 11 | `test_update_student` | Updates marks and confirms live recalculation of average & grade | 200 OK | **PASSED** |
| 12 | `test_delete_student` | Deletes document and verifies subsequent 404 | 200 OK | **PASSED** |
| 13 | `test_aggregation_pipelines` | Validates output format & accuracy of all 5 pipelines | 200 OK | **PASSED** |
| 14 | `test_dashboard_stats` | Validates KPI card counts, overall average, and top scorer | 200 OK | **PASSED** |

---

## 10. Frontend User Interface Architecture

The frontend is built using **React 19**, **Vite 6**, **Tailwind CSS 3.4**, and **Recharts 2.15**.

### Key UI Features:
1. **Academic Dashboard**:
   - 4 KPI Metric Cards: Total Students enrolled, Active Departments, Institutional Average Marks, and Top Performer student badge.
   - Dual Recharts Visualizations: Department-wise student enrollment (Bar Chart) and Academic Grade Distribution (Categorical Bar Chart).
   - Recent Enrollees Table: Live listing of the most recently enrolled students.
2. **Student Directory & Management**:
   - Live Search: Debounced search by student name or roll number.
   - Multi-Filter Controls: Filter by Department dropdown and Semester dropdown.
   - Dynamic Sorting: Sort by Name, Roll No, or computed Average Marks in ascending or descending order.
   - Pagination: Server-driven pagination controls (page size: 8 students).
3. **Interactive Modals**:
   - **Enroll Student**: Real-time client-side validation showing instantaneous error feedback for invalid emails or out-of-bounds marks before submission.
   - **Student Profile Details**: Visual score breakdown bars for DBMS, DSA, and Python, overall percentage badge, and letter grade pill.
   - **Update Student**: Pre-populated form with real-time recalculation of estimated average as marks are typed.
   - **Delete Safeguard**: Double-confirmation dialog displaying student name and roll number to prevent accidental record loss.
4. **Dedicated Academic Analytics Page**:
   - Full-width charts displaying all 5 Aggregation Pipelines.
   - Interactive stage explanation callouts detailing `$project`, `$group`, `$sort`, and `$switch` pipeline mechanics for viva defense.
   - Top 5 Achievers Leaderboard table with Gold, Silver, and Bronze rank medals.

---

## 11. Viva Defense Quick Reference (Top Technical Concepts)

### Concept 1: Locality of Reference via Document Embedding
- In relational databases, storing marks in a separate table requires reading separate disk blocks and performing hash/nested-loop joins in RAM.
- In MongoDB, embedding marks stores all student attributes contiguously on disk, reducing disk seek operations from multiple seeks to a single seek.

### Concept 2: Why PyMongo over MongoEngine / ORMs?
- ORMs introduce abstraction overhead, hide query execution details, and often translate simple aggregations into inefficient queries.
- Pure PyMongo provides direct control over native MongoDB aggregation stages (`$group`, `$project`, `$switch`), allows explicit connection pool configuration, and teaches students low-level NoSQL driver concepts essential for viva defense.

### Concept 3: Database-Level vs Application-Level Validation
- Application validation (in Flask or React) is easily bypassed by external API requests (e.g., Postman or curl).
- MongoDB collection-level `$jsonSchema` validation guarantees that invalid data can **never** enter the database under any circumstances.

### Concept 4: Handling Port Conflicts in Production
- By standard convention, frontend web servers map to host port 80 or 8080.
- On our Windows host machine, port 8080 is occupied by a background Jenkins CI service (`PID 3140`).
- We resolved this gracefully in `docker-compose.yml` using an environment variable fallback: `${FRONTEND_PORT:-8080}:80`. By setting `FRONTEND_PORT=8082` in `.env`, the frontend runs cleanly on port 8082 without modifying service definitions or disrupting existing host services.

---

## 12. Conclusion & Academic Learnings

The implementation of this Student Management System successfully fulfills all learning outcomes for **Intelligent NoSQL Databases (CSE494)**:
1. **Document-Oriented Modeling**: Mastered the trade-offs between embedding and referencing, demonstrating superior read throughput for bounded hierarchical data.
2. **Aggregation Framework Mastery**: Implemented 5 complex, multi-stage pipelines executing calculations (averaging, conditional grading, grouping) entirely within MongoDB.
3. **Enterprise Reliability**: Enforced schema validation at the database engine level, guaranteed uniqueness via B-Tree indexes, and isolated test suites to prevent data loss.
4. **DevOps & Production Readiness**: Containerized the entire multi-tier stack with Docker Compose and Nginx reverse proxying, achieving 100% reproducible deployment.

---

**Report Prepared By:**  
**RAM KUMAR** (Reg No: 12306472 | Roll No: 26 | Section: KO020)  
Department of Computer Science & Engineering  
Lovely Professional University
