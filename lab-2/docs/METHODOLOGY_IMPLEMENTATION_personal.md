# II. METHODOLOGY / IMPLEMENTATION (Personal)

## Overview

This section explains how I implemented and tested the Laboratory 2 requirements using my own copy of the microservice-based Student Information System in the `lab-2` folder. The work focused on three plain‑PHP microservices (Student, Course, Enrollment), their SQLite databases, and the Laravel API gateway. I configured validation rules, standardized JSON error responses, and used `curl -i` to verify both normal and edge‑case behaviour, saving the actual responses as evidence files.

---

## 1. Understanding the Existing Setup

Before making any changes, I explored the project structure and the way the services are started:

- Microservices are located under `services/student-service`, `services/course-service`, and `services/enrollment-service`.
- Each microservice exposes its API from a single entry file: `public/index.php`.
- Migrations for each service are located in `services/*-service/migrate.php`.
- The batch script `start-services.bat` runs migrations and starts each PHP built‑in server on its own port.
- The Laravel application in the project root runs on port 8000 and serves as the main API gateway.

I first opened `start-services.bat` to see how services are orchestrated. The script:
1. Runs the three migrate scripts (`student-service`, `course-service`, `enrollment-service`).
2. Starts PHP built‑in servers on ports 8001, 8002, and 8003 with their `public` folders as document roots.
3. Prints URLs for each microservice and instructions for starting the Laravel gateway on port 8000.

This confirmed the expected architecture and the ports that I would use later in my curl tests.

After confirming the structure, I configured Laragon to use a PHP 8.4 runtime (to satisfy the Laravel gateway's Composer requirement), then consistently started the system in this order:

1. `start-services.bat` to launch the three microservices on ports 8001, 8002, and 8003.
2. `php artisan serve --host=127.0.0.1 --port=8000` to start the Laravel API gateway.

With this setup running, the browser could reach both the individual `/api/health` endpoints of each microservice and the aggregated `/api/health` endpoint exposed by the gateway.

---

## 2. Implementing Error Handling in the Student Service

**File edited:** `services/student-service/public/index.php`

### 2.1 Database and Routing

The Student Service connects to its own SQLite database (`student_service.sqlite`), creates the `students` table if it does not exist, and then routes requests based on the HTTP method and path. Routes include:
- `GET /api/students` – list all students
- `GET /api/students/count` – count all students
- `GET /api/students/active/count` – count only active students
- `POST /api/students` – create a new student
- `GET /api/students/{id}` – retrieve a specific student
- `PUT /api/students/{id}` – update a student
- `DELETE /api/students/{id}` – delete a student

### 2.2 Validation and 400 Errors

For the `POST /api/students` route, I enforced:
- Required fields: `name` and `email` must be present.
- Email format: `email` must pass `FILTER_VALIDATE_EMAIL`.

If either rule fails, the service returns:
- HTTP 400 Bad Request
- JSON body with `error: "VALIDATION_ERROR"` and a descriptive `message`.

### 2.3 Duplicate Email and 409 Errors

Before inserting a new student, I check whether the email already exists in the `students` table. If it does, the response is:
- HTTP 409 Conflict
- JSON body with `error: "DUPLICATE_EMAIL"`.

### 2.4 Student Lookup and 404 Errors

When handling `GET`, `PUT`, or `DELETE` for `/api/students/{id}`, the service performs a lookup by ID. If there is no matching student:
- HTTP 404 Not Found is returned.
- JSON body contains `error: "STUDENT_NOT_FOUND"` and includes the ID in the `message`.

### 2.5 Fallback Route and 500 Errors

If a route does not match any of the above, the service returns:
- HTTP 404 with `error: "ROUTE_NOT_FOUND"` and the requested method/URI.

All code is wrapped in a `try/catch` block. Any uncaught exception results in:
- HTTP 500 with `error: "INTERNAL_ERROR"`.

Database connection failures are caught separately, returning HTTP 500 with `error: "DATABASE_ERROR"`.

---

## 3. Implementing Error Handling in the Course Service

**File edited:** `services/course-service/public/index.php`

### 3.1 Schema and Relationships

The Course Service manages two tables:
- `courses` – main course information (name, code, description, units, schedule, room).
- `course_prerequisite` – links courses to their prerequisite courses using `course_id` and `prerequisite_id`.

Both tables are created automatically if they do not exist.

### 3.2 Routes

Key endpoints include:
- `GET /api/courses` – list courses, each with attached `prerequisites`.
- `GET /api/courses/count` – count all courses.
- `POST /api/courses` – create a new course.
- `GET /api/courses/{id}` – retrieve a course with both `prerequisites` and `required_by` (courses that depend on it).
- `PUT /api/courses/{id}` – update a course and synchronize prerequisites.
- `DELETE /api/courses/{id}` – remove a course and its prerequisite links.

### 3.3 Validation and Uniqueness

For `POST /api/courses`:
- `name` and `code` are required; missing either triggers a 400 `VALIDATION_ERROR`.
- A lookup on the `courses` table ensures the `code` is unique. If a course with the same code exists, the service returns a 409 `DUPLICATE_CODE` response.

For `PUT /api/courses/{id}`:
- The service first checks that the course exists. If not, it returns 404 `COURSE_NOT_FOUND`.
- Allowed fields are updated dynamically, and `updated_at` is refreshed.
- If `prerequisite_ids` is provided, the `course_prerequisite` table is fully resynchronized for that course.

### 3.4 Route Not Found and Internal Errors

Unmatched routes result in `ROUTE_NOT_FOUND`, while any uncaught exceptions return `INTERNAL_ERROR`, both following the common JSON error format.

---

## 4. Implementing Error Handling and Inter‑Service Logic in the Enrollment Service

**File edited:** `services/enrollment-service/public/index.php`

### 4.1 Database Design

The Enrollment Service uses three tables:
- `enrollments` – links `student_id` and `course_id` with a `status` (e.g., `ENROLLED`, `COMPLETED`). It enforces a unique pair `(student_id, course_id)`.
- `grades` – one‑to‑one relation with `enrollments` (unique `enrollment_id`), storing numeric `grade`, `remarks`, `semester`, and `academic_year`.
- `attendances` – records per‑date attendance, with a unique `(enrollment_id, date)` constraint.

Tables are created automatically if they do not exist.

### 4.2 HTTP Client Helper (httpGet)

To call the Student and Course services, I use an `httpGet()` function that:
- Builds a stream context with:
  - `method: GET`
  - `Accept: application/json` header
  - `timeout: 5` seconds
  - `ignore_errors: true` to read error bodies instead of throwing.
- Measures the elapsed time using `microtime(true)` before and after `file_get_contents()`.
- Handles three special error conditions by returning an array with `_service_error`:
  - `unavailable` – when `file_get_contents()` fails (service is down or unreachable).
  - `timeout` – when the elapsed time is close to the configured timeout (treated as a slow dependency).
  - `not_found` – when it detects HTTP status 404 from the `$http_response_header`.

If none of these special cases occur, the function decodes the JSON response and returns the data array.

### 4.3 Service Health Checks

A small helper (`checkServiceHealth`) calls `/api/health` on each dependency and decides:
- Return `null` if the service answers quickly.
- Return a structure like `{ code: 503, error: 'SERVICE_UNAVAILABLE', message: '...' }` if the service is unreachable.
- Return a structure like `{ code: 504, error: 'GATEWAY_TIMEOUT', message: '...' }` if the health endpoint is too slow.

This provides an early‑out mechanism so that enrollment operations can fail fast when dependencies are unhealthy.

### 4.4 Enrollment Endpoints

Important endpoints implemented in this file include:
- `GET /api/enrollments` – list all enrollments.
- `GET /api/enrollments/count` – count enrollments.
- `GET /api/enrollments/recent` – list the most recent enrollments with enrichment.
- `GET /api/enrollments/by-student/{studentId}` – list enrollments for a specific student, including:
  - Course data fetched from the Course Service.
  - Grade record (if it exists) plus a letter grade computed from the numeric grade.
  - Attendance records for that enrollment.
- `GET /api/enrollments/by-course/{courseId}` – list enrollments for a course, optionally filtered by `status`, and enriched with student data from the Student Service.
- `POST /api/enrollments` – create a new enrollment.
- `GET /api/enrollments/{id}` / `PUT` / `DELETE` – standard CRUD operations for individual enrollments.

### 4.5 Enrollment Validation and Error Codes

When creating an enrollment:
- The service checks for required `student_id` and `course_id` and that both are numeric.
- It calls the Student Service and Course Service to verify that the referenced student and course exist.
- If the Student or Course Service responds with a `_service_error`:
  - `unavailable` → 503 `SERVICE_UNAVAILABLE`.
  - `timeout` → 504 `GATEWAY_TIMEOUT`.
  - `not_found` → 404 `STUDENT_NOT_FOUND` or `COURSE_NOT_FOUND`.
- It checks for an existing enrollment with the same student and course, returning 409 `DUPLICATE_ENROLLMENT` if found.

For status updates and related operations, the service ensures:
- Only allowed status values are accepted; invalid ones produce 400 `VALIDATION_ERROR`.
- Non‑existent enrollments return 404 `ENROLLMENT_NOT_FOUND`.

### 4.6 Grades and Attendance

For grades:
- The service validates that `enrollment_id` is valid and refers to an existing enrollment.
- It enforces a numeric range for `grade` (1.00–5.00). Values outside this range are rejected with 400 `VALIDATION_ERROR`.
- It calculates a human‑friendly letter remark using a helper (`getLetterGrade`).

For attendance:
- It checks for required fields like `course_id`, `date`, and at least one `records` entry.
- It validates that `date` matches `YYYY-MM-DD` using a regular expression.
- It enforces uniqueness of `(enrollment_id, date)` to avoid duplicate entries for the same day.

Any route that does not match falls back to a 404 `ROUTE_NOT_FOUND`, and uncaught errors are surfaced as 500 `INTERNAL_ERROR` with the standard JSON structure.

---

## 5. Standard JSON Error Response Format

Across all three microservices, I made sure errors follow a single pattern:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

In implementation terms, this means every early return (validation failure, resource not found, duplicate resource, service health issue) is paired with:
- A specific HTTP status code using `http_response_code(...)`.
- A `json_encode` of an array containing `error` and `message`.

This consistency makes it much easier to write clients or tests that react to errors.

---

## 6. Testing Methodology with curl

I used the terminal and `curl -i` to test all services. The testing commands are documented in `tests/curl-tests.md` and are grouped into logical sections. For each important scenario, I also saved the full `curl -i` output into text files under `docs/evidence` so that the exact request and response can be reviewed.

### 6.1 Basic Health and Happy‑Path Tests

For each microservice, I first verified that it was running:
- `curl -i http://localhost:8001/api/health` – Student Service
- `curl -i http://localhost:8002/api/health` – Course Service
- `curl -i http://localhost:8003/api/health` – Enrollment Service

Then I tested normal scenarios such as:
- Creating a student with valid data.
- Creating a course with a unique code.
- Creating an enrollment linking an existing student and course.
- Recording grades and attendance for that enrollment.

### 6.2 Edge‑Case Tests

`tests/curl-tests.md` includes concrete commands for each edge case. I used the following patterns, with corresponding evidence saved as numbered `.txt` files in `docs/evidence` (for example, `01-student-health.txt`, `02-student-create-201.txt`, `27-enrollment-503-unavailable.txt` and so on):

- **400 Validation Errors** – requests missing required fields or using invalid formats (e.g., empty JSON body for enrollment, invalid email, invalid date string).
- **404 Not Found** – requests using very large IDs that are unlikely to exist (e.g., `/api/students/9999`).
- **409 Conflicts** – repeating a valid create request that violates uniqueness constraints (duplicate email, duplicate code, duplicate enrollment).
- **503 Service Unavailable** – manually stopping the Student or Course Service, then creating an enrollment to see how the Enrollment Service reacts.
- **504 Gateway Timeout** – simulating slow dependencies and observing the `GATEWAY_TIMEOUT` response.

In each test, I checked two things:
1. The first line of the HTTP response (status code and phrase) printed by `curl -i`.
2. The JSON body, confirming that the `error` code and `message` matched the case being tested.

I also exercised the Laravel API gateway's `/api/health` endpoint. When the gateway was running but one or more microservices were stopped, it returned a JSON structure showing `"gateway": "running"` and `"status": "down"` for the affected services, including the underlying cURL error message. This helped confirm that the gateway correctly propagates dependency failures instead of hiding them.

---

## 7. Summary of Implementation Work

To complete Laboratory 2 on my own copy of the project, I:

1. Analyzed how the three microservices and the Laravel gateway are started and connected.
2. Strengthened the Student Service with validation rules, duplicate checks, and clear 400/404/409/500 responses.
3. Enhanced the Course Service to validate input, enforce unique codes, and expose prerequisite relationships.
4. Implemented robust inter‑service communication and error handling in the Enrollment Service, including 503 and 504 scenarios.
5. Standardized error responses across all services to use a common JSON structure.
6. Verified behaviour using a collection of `curl -i` commands that cover both normal operations and edge cases.

This methodology ensures that my version of the microservice system behaves predictably under both normal usage and failures, and that all relevant behaviours can be demonstrated and documented using simple command‑line tools.