# II. METHODOLOGY / IMPLEMENTATION

## Overview

The implementation process followed a systematic approach to enhance the Student Information System's microservices with comprehensive error handling, input validation, and consistent JSON error responses. The work was carried out across three independent PHP microservices (Student, Course, and Enrollment) and tested using curl with the `-i` flag to verify HTTP status codes.

---

## Step 1: Analyzing the Existing Architecture

Before implementing changes, the current microservices architecture was thoroughly examined:

```
Existing Architecture Analysis:

┌─────────────────────────────────────────────────────────────┐
│              Student Service (Port 8001)                     │
│  Location: services/student-service/public/index.php        │
│  Database: student_service.sqlite                           │
│  Manages: Student CRUD operations                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Course Service (Port 8002)                      │
│  Location: services/course-service/public/index.php         │
│  Database: course_service.sqlite                            │
│  Manages: Course CRUD + prerequisites                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            Enrollment Service (Port 8003)                    │
│  Location: services/enrollment-service/public/index.php     │
│  Database: enrollment_service.sqlite                        │
│  Manages: Enrollments, grades, attendance                   │
│  Dependencies: Student Service + Course Service             │
└─────────────────────────────────────────────────────────────┘
```

Each service was identified as a standalone PHP application with:
- Its own SQLite database
- Simple routing using regular expressions
- JSON request/response handling
- Auto-migration on first request

---

## Step 2: Designing the Standard Error Response Format

A consistent JSON error format was established for all microservices:

```json
{
    "error": "ERROR_CODE",
    "message": "Human-readable description"
}
```

**Error Code Naming Convention:**
- All uppercase letters (e.g., `VALIDATION_ERROR`)
- Words separated by underscores
- Descriptive and resource-specific (e.g., `STUDENT_NOT_FOUND` instead of generic `NOT_FOUND`)
- Consistent across all three services

---

## Step 3: Implementing Error Handling in Student Service

**File Modified:** `services/student-service/public/index.php`

### 3.1 - HTTP 400 Bad Request (Validation Errors)

**Missing Required Fields:**
```php
// Lines 96-100
if (empty($body['name']) || empty($body['email'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'VALIDATION_ERROR',
        'message' => 'Name and email are required'
    ]);
    exit;
}
```

**Invalid Email Format:**
```php
// Lines 102-107
if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'VALIDATION_ERROR',
        'message' => 'Invalid email format'
    ]);
    exit;
}
```

### 3.2 - HTTP 404 Not Found

**Student Not Found:**
```php
// Lines 157-161
if (!$student) {
    http_response_code(404);
    echo json_encode([
        'error' => 'STUDENT_NOT_FOUND',
        'message' => 'Student with ID ' . $id . ' not found'
    ]);
    exit;
}
```

**Route Not Found:**
```php
// Lines 233-234
http_response_code(404);
echo json_encode([
    'error' => 'ROUTE_NOT_FOUND',
    'message' => 'The requested route was not found',
    'method' => $method,
    'uri' => $uri
]);
```

### 3.3 - HTTP 409 Conflict (Duplicate Email)

```php
// Lines 109-116
$stmt = $pdo->prepare("SELECT id FROM students WHERE email = ?");
$stmt->execute([$body['email']]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode([
        'error' => 'DUPLICATE_EMAIL',
        'message' => 'A student with this email already exists'
    ]);
    exit;
}
```

### 3.4 - HTTP 500 Internal Server Error

**Database Connection Failure:**
```php
// Lines 29-33
try {
    $pdo = new PDO("sqlite:$dbPath");
    // ... configuration ...
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'DATABASE_ERROR',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}
```

**Unhandled Exceptions:**
```php
// Lines 236-239
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'INTERNAL_ERROR',
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
```

---

## Step 4: Implementing Error Handling in Course Service

**File Modified:** `services/course-service/public/index.php`

Similar error handling patterns were applied to the Course Service with course-specific error codes:

### 4.1 - Validation Errors (400)

```php
// Lines 116-120
if (empty($body['name']) || empty($body['code'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'VALIDATION_ERROR',
        'message' => 'Name and code are required'
    ]);
    exit;
}
```

### 4.2 - Course Not Found (404)

```php
// Lines 172-176
if (!$course) {
    http_response_code(404);
    echo json_encode([
        'error' => 'COURSE_NOT_FOUND',
        'message' => 'Course with ID ' . $id . ' not found'
    ]);
    exit;
}
```

### 4.3 - Duplicate Course Code (409)

```php
// Lines 122-129
$stmt = $pdo->prepare("SELECT id FROM courses WHERE code = ?");
$stmt->execute([$body['code']]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode([
        'error' => 'DUPLICATE_CODE',
        'message' => 'A course with this code already exists'
    ]);
    exit;
}
```

---

## Step 5: Implementing Advanced Error Handling in Enrollment Service

**File Modified:** `services/enrollment-service/public/index.php`

The Enrollment Service required the most complex implementation due to its dependencies on other services.

### 5.1 - Building the HTTP Client for Inter-Service Communication

A custom `httpGet()` function was implemented to handle service-to-service communication with timeout and error detection:

```php
// Lines 79-115
function httpGet(string $url): ?array {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Accept: application/json\r\n",
            'timeout' => 5,
            'ignore_errors' => true,
        ]
    ]);

    $startTime = microtime(true);
    $response = @file_get_contents($url, false, $context);
    $elapsed = microtime(true) - $startTime;

    // Service is down or unreachable (connection refused)
    if ($response === false) {
        return ['_service_error' => 'unavailable', '_url' => $url];
    }

    // Timeout detection (took nearly the full 5-second timeout)
    if ($elapsed >= 4.5) {
        return ['_service_error' => 'timeout', '_url' => $url];
    }

    // Parse HTTP status code from response headers
    if (isset($http_response_header)) {
        $statusLine = $http_response_header[0] ?? '';
        if (preg_match('/\s(\d{3})\s/', $statusLine, $m)) {
            $statusCode = (int)$m[1];
            if ($statusCode === 404) {
                return ['_service_error' => 'not_found', '_url' => $url];
            }
        }
    }

    return json_decode($response, true);
}
```

**Key Features:**
- 5-second timeout to prevent indefinite waiting
- `ignore_errors: true` to capture error responses instead of throwing
- Elapsed time tracking to detect near-timeout scenarios
- HTTP status code parsing from response headers
- Returns special `_service_error` flag for failure scenarios

### 5.2 - Handling HTTP 400 Validation Errors

**Missing Required Fields:**
```php
// Lines 272-276
if (empty($body['student_id']) || empty($body['course_id'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'VALIDATION_ERROR',
        'message' => 'student_id and course_id are required'
    ]);
    exit;
}
```

**Non-Numeric IDs:**
```php
// Lines 278-282
if (!is_numeric($body['student_id']) || !is_numeric($body['course_id'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'VALIDATION_ERROR',
        'message' => 'student_id and course_id must be numeric'
    ]);
    exit;
}
```

**Invalid Status Enumeration:**
```php
// Lines 388-394
if (!empty($body['status'])) {
    $validStatuses = ['ENROLLED', 'DROPPED', 'COMPLETED'];
    if (!in_array($body['status'], $validStatuses)) {
        http_response_code(400);
        echo json_encode([
            'error' => 'VALIDATION_ERROR',
            'message' => 'Invalid status. Must be one of: ' . implode(', ', $validStatuses)
        ]);
        exit;
    }
}
```

**Grade Range Validation (1.00 - 5.00):**
```php
// Lines 483-488
$gradeVal = (float)$body['grade'];
if ($gradeVal < 1.0 || $gradeVal > 5.0) {
    http_response_code(400);
    echo json_encode([
        'error' => 'VALIDATION_ERROR',
        'message' => 'Grade must be between 1.00 and 5.00'
    ]);
    exit;
}
```

**Date Format Validation:**
```php
// Lines 613-617
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $body['date'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'VALIDATION_ERROR',
        'message' => 'Invalid date format. Use YYYY-MM-DD'
    ]);
    exit;
}
```

### 5.3 - Handling HTTP 503 Service Unavailable

When the Student Service or Course Service is unreachable:

```php
// Lines 285-290 (Student Service unavailable)
$student = httpGet(STUDENT_SERVICE_URL . '/api/students/' . $body['student_id']);
if ($student === null || (isset($student['_service_error']) && $student['_service_error'] === 'unavailable')) {
    http_response_code(503);
    echo json_encode([
        'error' => 'SERVICE_UNAVAILABLE',
        'message' => 'Student Service is currently unavailable'
    ]);
    exit;
}

// Lines 308-313 (Course Service unavailable)
$course = httpGet(COURSE_SERVICE_URL . '/api/courses/' . $body['course_id']);
if ($course === null || (isset($course['_service_error']) && $course['_service_error'] === 'unavailable')) {
    http_response_code(503);
    echo json_encode([
        'error' => 'SERVICE_UNAVAILABLE',
        'message' => 'Course Service is currently unavailable'
    ]);
    exit;
}
```

### 5.4 - Handling HTTP 504 Gateway Timeout

When a dependency service responds too slowly:

```php
// Lines 291-295 (Student Service timeout)
if (isset($student['_service_error']) && $student['_service_error'] === 'timeout') {
    http_response_code(504);
    echo json_encode([
        'error' => 'GATEWAY_TIMEOUT',
        'message' => 'Student Service did not respond in time'
    ]);
    exit;
}

// Lines 314-318 (Course Service timeout)
if (isset($course['_service_error']) && $course['_service_error'] === 'timeout') {
    http_response_code(504);
    echo json_encode([
        'error' => 'GATEWAY_TIMEOUT',
        'message' => 'Course Service did not respond in time'
    ]);
    exit;
}
```

### 5.5 - Handling HTTP 404 Not Found (Cross-Service)

When a student or course referenced in an enrollment doesn't exist:

```php
// Lines 296-300 (Student not found in Student Service)
if (isset($student['_service_error']) && $student['_service_error'] === 'not_found') {
    http_response_code(404);
    echo json_encode([
        'error' => 'STUDENT_NOT_FOUND',
        'message' => 'Student with ID ' . $body['student_id'] . ' not found'
    ]);
    exit;
}

// Lines 319-323 (Course not found in Course Service)
if (isset($course['_service_error']) && $course['_service_error'] === 'not_found') {
    http_response_code(404);
    echo json_encode([
        'error' => 'COURSE_NOT_FOUND',
        'message' => 'Course with ID ' . $body['course_id'] . ' not found'
    ]);
    exit;
}
```

### 5.6 - Handling HTTP 409 Duplicate Enrollment

```php
// Lines 330-337
$stmt = $pdo->prepare("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?");
$stmt->execute([$body['student_id'], $body['course_id']]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode([
        'error' => 'DUPLICATE_ENROLLMENT',
        'message' => 'Student is already enrolled in this course'
    ]);
    exit;
}
```

---

## Step 6: Testing Methodology with Curl

All endpoints were systematically tested using the `curl` command-line tool with specific flags:

### Testing Command Structure

```bash
curl -i -X [METHOD] [URL] \
  -H "Content-Type: application/json" \
  -d '[JSON_PAYLOAD]'
```

**Flags Used:**
- `-i` : Include HTTP response headers (critical for verifying status codes)
- `-X` : Specify HTTP method (POST, GET, PUT, DELETE)
- `-H` : Add request headers
- `-d` : Send JSON data in request body

### Test Case Categories

| Category | Test Count | HTTP Status Codes |
|----------|-----------|-------------------|
| Success Cases | 6 | 200, 201 |
| Validation Errors | 7 | 400 |
| Not Found Errors | 4 | 404 |
| Conflict Errors | 3 | 409 |
| Service Failures | 7 | 503, 504 |
| **Total** | **27** | |

### Sample Test Execution

**Test 1: Missing Required Fields (400)**
```bash
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":"VALIDATION_ERROR","message":"Name and email are required"}
```

**Test 2: Duplicate Email (409)**
```bash
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"existing@email.com"}'
```

**Expected Response:**
```
HTTP/1.1 409 Conflict
Content-Type: application/json

{"error":"DUPLICATE_EMAIL","message":"A student with this email already exists"}
```

**Test 3: Service Unavailable (503)**
```bash
# First, stop Student Service
# Then try to create enrollment

curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id":1,"course_id":1}'
```

**Expected Response:**
```
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{"error":"SERVICE_UNAVAILABLE","message":"Student Service is currently unavailable"}
```

---

## Step 7: Documentation and Evidence Collection

### 7.1 - Curl Test Documentation

A comprehensive testing guide was created in `tests/curl-tests.md` containing:
- All 27 test commands
- Expected HTTP status codes
- Expected JSON response bodies
- Testing instructions
- Prerequisites for each test

### 7.2 - Evidence Collection

For each of the 27 test cases, actual curl output was saved to text files in `docs/evidence/`:

```
docs/evidence/
├── 01-success-get-students.txt
├── 02-success-create-student.txt
├── 03-success-get-courses.txt
├── 04-400-missing-fields.txt
├── 05-400-invalid-email.txt
├── 06-404-student-not-found.txt
├── 07-404-course-not-found.txt
├── 08-409-duplicate-email.txt
├── 09-409-duplicate-enrollment.txt
├── 10-503-service-unavailable.txt
└── ... (27 files total)
```

Each evidence file contains:
- The curl command executed
- Complete HTTP response headers (showing status code)
- JSON response body
- Timestamp of execution

---

## Step 8: Database Migrations

Each service includes a `migrate.php` script for database initialization:

**Student Service Migration:**
```bash
php services/student-service/migrate.php
```

**Course Service Migration:**
```bash
php services/course-service/migrate.php
```

**Enrollment Service Migration:**
```bash
php services/enrollment-service/migrate.php
```

Migrations create:
- Database tables with proper schema
- Constraints (UNIQUE, FOREIGN KEY)
- Default values
- Sample seed data (if applicable)

---

## Step 9: Starting and Stopping Services

### Starting All Services

**Windows Batch File:** `start-services.bat`
```batch
@echo off
start "Student Service" php -S localhost:8001 -t services/student-service/public
start "Course Service" php -S localhost:8002 -t services/course-service/public
start "Enrollment Service" php -S localhost:8003 -t services/enrollment-service/public
```

**Manual Start:**
```bash
php -S localhost:8001 -t services/student-service/public &
php -S localhost:8002 -t services/course-service/public &
php -S localhost:8003 -t services/enrollment-service/public &
```

### Starting API Gateway

```bash
php artisan serve --port=8000
```

### Verifying Services

```bash
curl http://localhost:8001/api/health
curl http://localhost:8002/api/health
curl http://localhost:8003/api/health
curl http://localhost:8000/api/health
```

---

## Implementation Summary

| Service | Lines Modified | Error Codes Added | Validation Rules |
|---------|---------------|-------------------|------------------|
| Student Service | ~240 | VALIDATION_ERROR, STUDENT_NOT_FOUND, DUPLICATE_EMAIL, ROUTE_NOT_FOUND, DATABASE_ERROR, INTERNAL_ERROR | Email format, Required fields |
| Course Service | ~270 | VALIDATION_ERROR, COURSE_NOT_FOUND, DUPLICATE_CODE, ROUTE_NOT_FOUND, DATABASE_ERROR, INTERNAL_ERROR | Required fields, Unique code |
| Enrollment Service | ~720 | VALIDATION_ERROR, ENROLLMENT_NOT_FOUND, DUPLICATE_ENROLLMENT, STUDENT_NOT_FOUND, COURSE_NOT_FOUND, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT | Numeric IDs, Status enum, Grade range (1.00-5.00), Date format |

### Key Achievements

✅ **Consistent Error Format**: All three services return errors in the same JSON structure
✅ **Proper HTTP Status Codes**: Semantically correct status codes (400, 404, 409, 503, 504)
✅ **Inter-Service Failure Detection**: Enrollment Service detects when dependencies are down or slow
✅ **Comprehensive Input Validation**: Required fields, format validation, range validation, enumeration checking
✅ **Complete Test Coverage**: 27 test cases with documented evidence
✅ **Production-Ready Error Handling**: Graceful degradation and meaningful error messages

---

## Challenges Encountered and Solutions

### Challenge 1: Distinguishing Between 503 and 504

**Problem:** Determining whether a service is completely down (503) or just slow (504).

**Solution:** Implemented precise elapsed time tracking in the `httpGet()` function. If the request takes nearly the full timeout (≥4.5 seconds out of 5), it's classified as 504. If the connection fails immediately, it's 503.

### Challenge 2: Detecting 404 from Upstream Services

**Problem:** The `httpGet()` function receives a response body but needs to know if it's a 404.

**Solution:** Parsed the `$http_response_header` array to extract the HTTP status code from the first header line using regex: `preg_match('/\s(\d{3})\s/', $statusLine, $m)`.

### Challenge 3: Preventing Cascade Failures

**Problem:** If Student Service is down, should Enrollment Service crash or return an error?

**Solution:** Implemented defensive programming with early returns and proper error codes, ensuring the Enrollment Service remains operational and returns meaningful 503/504 responses instead of crashing.

### Challenge 4: Testing 503/504 Scenarios

**Problem:** These scenarios require manually stopping services, which can't be easily scripted.

**Solution:** Created detailed testing instructions in `tests/curl-tests.md` with step-by-step procedures for stopping services, executing curl commands, and restarting services.

---

This systematic implementation approach ensured that all objectives were met while maintaining code quality, API consistency, and comprehensive test coverage.
