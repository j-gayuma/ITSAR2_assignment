# Laboratory 2 - Report: Microservices Edge Case Handling

## Course Information
- **Subject**: Web Development / Microservices Architecture
- **Laboratory**: Laboratory 2 - Testing Edge Cases with curl
- **Date**: March 13, 2026

---

## 1. Objectives

The goal of this laboratory was to:
1. Test microservices using `curl` with the `-i` flag to inspect HTTP headers and status codes
2. Implement proper edge case handling across all three microservices
3. Ensure consistent JSON error response formatting
4. Handle inter-service communication failures (503, 504)

---

## 2. System Architecture

The application uses a microservices architecture with four components:

| Service | Port | Database | Description |
|---|---|---|---|
| API Gateway (Laravel) | 8000 | - | Routes requests to microservices |
| Student Service | 8001 | student_service.sqlite | Manages student records |
| Course Service | 8002 | course_service.sqlite | Manages course records and prerequisites |
| Enrollment Service | 8003 | enrollment_service.sqlite | Manages enrollments, grades, and attendance |

The Enrollment Service depends on both the Student Service and Course Service for data validation and enrichment.

---

## 3. Edge Cases Implemented

### 3.1 - 400 Bad Request (Invalid Input)

Applied to all three services when required fields are missing or data is invalid.

**Student Service:**
- Missing `name` or `email` returns 400 with `VALIDATION_ERROR`
- Invalid email format returns 400 with `VALIDATION_ERROR`

**Course Service:**
- Missing `name` or `code` returns 400 with `VALIDATION_ERROR`

**Enrollment Service:**
- Missing `student_id` or `course_id` returns 400 with `VALIDATION_ERROR`
- Non-numeric IDs return 400 with `VALIDATION_ERROR`
- Invalid enrollment status (not ENROLLED/DROPPED/COMPLETED) returns 400
- Missing grade fields or out-of-range grades (must be 1.00-5.00) return 400
- Missing attendance fields or invalid date format return 400

### 3.2 - 404 Not Found

Each service returns a specific error code when a resource is not found:
- `STUDENT_NOT_FOUND` - Student ID does not exist
- `COURSE_NOT_FOUND` - Course ID does not exist
- `ENROLLMENT_NOT_FOUND` - Enrollment ID does not exist
- `ROUTE_NOT_FOUND` - Requested API endpoint does not exist

All 404 errors include the resource ID in the message for easier debugging.

### 3.3 - 409 Conflict (Duplicate)

Prevents duplicate records:
- `DUPLICATE_EMAIL` - Student with the same email already exists
- `DUPLICATE_CODE` - Course with the same code already exists
- `DUPLICATE_ENROLLMENT` - Student is already enrolled in the course

### 3.4 - 503 Service Unavailable

The Enrollment Service detects when a dependency service is down:
- If the Student Service (port 8001) is unreachable, returns 503 with `SERVICE_UNAVAILABLE`
- If the Course Service (port 8002) is unreachable, returns 503 with `SERVICE_UNAVAILABLE`

This is implemented using a timeout-aware HTTP client that catches connection failures.

### 3.5 - 504 Gateway Timeout

When a dependency service takes too long to respond (exceeds the 5-second timeout):
- Returns 504 with `GATEWAY_TIMEOUT`
- The `httpGet()` function tracks elapsed time and identifies near-timeout responses

---

## 4. Consistent JSON Error Response Format

All errors follow a standard format:

```json
{
    "error": "ERROR_CODE",
    "message": "Human readable explanation"
}
```

**Error codes are uppercase with underscores** (e.g., `VALIDATION_ERROR`, `STUDENT_NOT_FOUND`).
**Messages are descriptive** and include context like resource IDs when applicable.

### Complete Error Code Reference

| HTTP Status | Error Code | Service(s) |
|---|---|---|
| 400 | `VALIDATION_ERROR` | All |
| 404 | `STUDENT_NOT_FOUND` | Student, Enrollment |
| 404 | `COURSE_NOT_FOUND` | Course, Enrollment |
| 404 | `ENROLLMENT_NOT_FOUND` | Enrollment |
| 404 | `ROUTE_NOT_FOUND` | All |
| 409 | `DUPLICATE_EMAIL` | Student |
| 409 | `DUPLICATE_CODE` | Course |
| 409 | `DUPLICATE_ENROLLMENT` | Enrollment |
| 500 | `DATABASE_ERROR` | All |
| 500 | `INTERNAL_ERROR` | All |
| 503 | `SERVICE_UNAVAILABLE` | Enrollment |
| 504 | `GATEWAY_TIMEOUT` | Enrollment |

---

## 5. Implementation Details

### HTTP Client for Inter-Service Communication

The Enrollment Service uses a custom `httpGet()` function that:
1. Sets a 5-second timeout for HTTP requests
2. Uses `ignore_errors: true` to capture error responses instead of throwing
3. Tracks elapsed time to detect near-timeout scenarios
4. Parses HTTP response headers to detect 404 status codes from upstream services
5. Returns a special `_service_error` flag when services are unavailable or timing out

### Health Check Endpoint

A `checkServiceHealth()` helper verifies service availability before performing operations, providing early failure detection with appropriate 503/504 responses.

---

## 6. Testing Methodology

All testing was done using `curl` with the `-i` flag:
- The `-i` flag includes HTTP response headers in the output
- This allows verification of exact HTTP status codes (400, 404, 409, 503, 504)
- JSON response bodies are verified for correct error codes and messages

The full list of curl test commands is documented in `tests/curl-tests.md`.

---

## 7. Reflections

### What I Learned
1. **HTTP status codes matter** - Using the correct status code (400 vs 422, 409 vs 400) makes APIs more predictable and easier to consume
2. **Consistent error formatting** - A standard JSON error response format makes it easier for clients to handle errors programmatically
3. **Inter-service failures are real** - In a microservices architecture, dependency services can fail, and the consuming service must handle 503 and 504 gracefully
4. **curl is a powerful testing tool** - The `-i` flag reveals HTTP headers that are invisible in browser-based testing

### Challenges Encountered
1. **Handling service unavailability** - Distinguishing between "service is down" (503) and "service is slow" (504) required careful timeout tracking in the HTTP client
2. **Consistent error codes across services** - Ensuring all three services follow the same error response pattern required coordinated updates
3. **Testing 503/504 scenarios** - These require manually stopping services, which cannot be easily automated in simple curl scripts

---

## 8. Files Modified

| File | Changes |
|---|---|
| `services/student-service/public/index.php` | Updated all error responses to consistent JSON format with proper HTTP status codes (400, 404, 409) |
| `services/course-service/public/index.php` | Updated all error responses to consistent JSON format with proper HTTP status codes (400, 404, 409) |
| `services/enrollment-service/public/index.php` | Updated all error responses, added 503/504 handling, added input validation, added grade range validation |
| `tests/curl-tests.md` | Created comprehensive curl test documentation |
| `docs/report.md` | This report |
| `docs/evidence/` | Curl output evidence files |
| `README.md` | Updated with setup and run instructions |
