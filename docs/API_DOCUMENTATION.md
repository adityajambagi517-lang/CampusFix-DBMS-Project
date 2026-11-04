# CampusFix — RESTful API Documentation
**Application Framework:** Next.js 14 Route Handlers  
**Authentication Scheme:** JSON Web Token (JWT) in HTTP-Only Cookie (`campusfix_token`) or Bearer Header  

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
- **Description**: Authenticates user via email and password; sets HTTP-only cookie.
- **Request Body**:
  ```json
  {
    "email": "admin@campusfix.edu",
    "password": "Password@123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "userId": 1,
      "fullName": "Campus Administrator",
      "email": "admin@campusfix.edu",
      "roleName": "ADMIN",
      "staffId": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### `POST /api/auth/register`
- **Description**: Registers a new Student or Staff User account.
- **Request Body**:
  ```json
  {
    "fullName": "Aditya Jambagi",
    "email": "aditya.student@campusfix.edu",
    "password": "Password@123",
    "roleName": "STUDENT"
  }
  ```
- **Response `200 OK`**: Returns new user session and token.

### `GET /api/auth/me`
- **Description**: Retrieves currently authenticated user session.
- **Response `200 OK`**:
  ```json
  {
    "authenticated": true,
    "user": { "userId": 1, "fullName": "Campus Administrator", "roleName": "ADMIN" }
  }
  ```

### `POST /api/auth/logout`
- **Description**: Clears the session cookie.

---

## 2. Complaint Endpoints

### `GET /api/complaints`
- **Description**: Fetches complaints with optional query filters. Students are automatically scoped to their own complaints.
- **Query Parameters**:
  - `status` (string, optional): Filter by `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `ESCALATED`.
  - `priority` (string, optional): Filter by `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - `category_id` (number, optional): Filter by category.
  - `location_id` (number, optional): Filter by location.
  - `search` (string, optional): Case-insensitive keyword search.
  - `my` (boolean, optional): Scope to current user's tickets or assigned tasks.
- **Response `200 OK`**:
  ```json
  {
    "complaints": [
      {
        "complaint_id": 1,
        "title": "Ceiling fan making loud grinding noise and running very slow",
        "status": "OPEN",
        "priority": "MEDIUM",
        "reporter_name": "Aditya Jambagi",
        "building": "Tech Park",
        "room": "Lab 302",
        "sla_status": "ON_TRACK"
      }
    ]
  }
  ```

### `POST /api/complaints`
- **Description**: Submits a new complaint. Generates 384-D vector embedding, runs duplicate check, and inserts into `complaint` and `complaint_vector` inside an ACID transaction.
- **Request Body**:
  ```json
  {
    "title": "Water leakage from pipe under sink",
    "description": "Continuous leak causing water to pool on the floor.",
    "categoryId": 4,
    "locationId": 1,
    "priority": "HIGH"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "complaint": { "complaint_id": 6, "status": "OPEN" },
    "hasPotentialDuplicate": true,
    "potentialDuplicates": [
      { "complaint_id": 3, "title": "Continuous water leakage...", "similarity": 0.88 }
    ]
  }
  ```

### `GET /api/complaints/[id]`
- **Description**: Returns detailed complaint overview, complete `status_history` audit timeline, comments discussion thread, attachments, and top semantically similar complaints.
- **Response `200 OK`**: Returns `{ complaint, statusHistory, comments, attachments, similarComplaints }`.

### `PATCH /api/complaints/[id]/status`
- **Description**: Updates complaint lifecycle state. If status is `RESOLVED` and invoked by assigned staff, executes `fn_resolve_complaint`.
- **Request Body**:
  ```json
  {
    "status": "RESOLVED",
    "remarks": "Replaced faulty switch and verified voltage."
  }
  ```

### `POST /api/complaints/[id]/assign`
- **Description**: Admin-only endpoint that executes `fn_assign_complaint(complaint_id, staff_id, admin_id)`.
- **Request Body**:
  ```json
  {
    "staffId": 1,
    "remarks": "Dispatched to senior electrician"
  }
  ```

### `POST /api/complaints/[id]/comments`
- **Description**: Appends a comment to the complaint discussion thread.
- **Request Body**:
  ```json
  {
    "body": "Technician has arrived on site to inspect the wiring."
  }
  ```

### `POST /api/complaints/similarity`
- **Description**: Real-time pre-submission semantic search. Generates 384-D vector and calls `fn_match_similar_complaints`.
- **Request Body**:
  ```json
  {
    "title": "Fan rattling",
    "description": "Ceiling fan making strange sounds in Lab 302"
  }
  ```
- **Response `200 OK`**: Returns `{ matches: [...] }`.

---

## 3. Analytics & Master Data Endpoints

### `GET /api/analytics`
- **Description**: Fetches pre-aggregated analytical data directly from database views:
  - `departmentWorkload` from `vw_department_workload`
  - `locationHotspots` from `vw_location_hotspots`
  - `staffMetrics` from `vw_staff_metrics`
  - `statusDistribution` from `complaint` grouped by status.

### `GET /api/master-data`
- **Description**: Returns lists of departments, categories with SLA hours, campus locations, and technicians for UI dropdowns.

