# Laboratory 2 - Curl Tests

All curl commands use the `-i` flag to display HTTP response headers and status codes.

## Table of Contents
1. [Student Service (Port 8001)](#student-service-port-8001)
2. [Course Service (Port 8002)](#course-service-port-8002)
3. [Enrollment Service (Port 8003)](#enrollment-service-port-8003)
4. [Edge Case Tests](#edge-case-tests)

---

## Student Service (Port 8001)

### Health Check
```bash
curl -i http://localhost:8001/api/health
```

### List All Students
```bash
curl -i http://localhost:8001/api/students
```

### Get Student Count
```bash
curl -i http://localhost:8001/api/students/count
```

### Get Active Student Count
```bash
curl -i http://localhost:8001/api/students/active/count
```

### Create a Student (201 Created)
```bash
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Juan Dela Cruz", "email": "juan@example.com", "phone": "09171234567", "year_level": 2, "program": "BSCS"}'
```

### Get Student by ID (200 OK)
```bash
curl -i http://localhost:8001/api/students/1
```

### Update a Student (200 OK)
```bash
curl -i -X PUT http://localhost:8001/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Juan Dela Cruz Jr.", "year_level": 3}'
```

### Delete a Student (200 OK)
```bash
curl -i -X DELETE http://localhost:8001/api/students/1
```

### Student - 400 Bad Request (Missing Required Fields)
```bash
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Student - 400 Bad Request (Invalid Email Format)
```bash
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Student", "email": "not-an-email"}'
```

### Student - 404 Not Found
```bash
curl -i http://localhost:8001/api/students/9999
```

### Student - 409 Duplicate Email
```bash
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Duplicate Student", "email": "juan@example.com"}'
```

---

## Course Service (Port 8002)

### Health Check
```bash
curl -i http://localhost:8002/api/health
```

### List All Courses
```bash
curl -i http://localhost:8002/api/courses
```

### Get Course Count
```bash
curl -i http://localhost:8002/api/courses/count
```

### Create a Course (201 Created)
```bash
curl -i -X POST http://localhost:8002/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Introduction to Computing", "code": "CS101", "description": "Basic computing concepts", "units": 3, "schedule_day": "MWF", "schedule_time": "9:00-10:00", "room": "Room 301"}'
```

### Get Course by ID (200 OK)
```bash
curl -i http://localhost:8002/api/courses/1
```

### Update a Course (200 OK)
```bash
curl -i -X PUT http://localhost:8002/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Introduction to Computing (Updated)", "units": 4}'
```

### Delete a Course (200 OK)
```bash
curl -i -X DELETE http://localhost:8002/api/courses/1
```

### Course - 400 Bad Request (Missing Required Fields)
```bash
curl -i -X POST http://localhost:8002/api/courses \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Course - 404 Not Found
```bash
curl -i http://localhost:8002/api/courses/9999
```

### Course - 409 Duplicate Code
```bash
curl -i -X POST http://localhost:8002/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Duplicate Course", "code": "CS101"}'
```

---

## Enrollment Service (Port 8003)

### Health Check
```bash
curl -i http://localhost:8003/api/health
```

### List All Enrollments
```bash
curl -i http://localhost:8003/api/enrollments
```

### Get Enrollment Count
```bash
curl -i http://localhost:8003/api/enrollments/count
```

### Create an Enrollment (201 Created)
```bash
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "course_id": 1}'
```

### Get Enrollment by ID (200 OK)
```bash
curl -i http://localhost:8003/api/enrollments/1
```

### Update Enrollment Status (200 OK)
```bash
curl -i -X PUT http://localhost:8003/api/enrollments/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

### Delete an Enrollment (200 OK)
```bash
curl -i -X DELETE http://localhost:8003/api/enrollments/1
```

### Get Enrollments by Student
```bash
curl -i http://localhost:8003/api/enrollments/by-student/1
```

### Get Enrollments by Course
```bash
curl -i http://localhost:8003/api/enrollments/by-course/1
```

### Get Recent Enrollments
```bash
curl -i http://localhost:8003/api/enrollments/recent
```

### Submit a Grade (200 OK)
```bash
curl -i -X POST http://localhost:8003/api/grades \
  -H "Content-Type: application/json" \
  -d '{"enrollment_id": 1, "grade": 1.50, "remarks": "Very Good", "semester": "1st", "academic_year": "2025-2026"}'
```

### Get All Grades
```bash
curl -i http://localhost:8003/api/grades
```

### Get Grade Stats
```bash
curl -i http://localhost:8003/api/grades/stats
```

### Get Student GPA
```bash
curl -i http://localhost:8003/api/gpa/student/1
```

### Record Attendance (200 OK)
```bash
curl -i -X POST http://localhost:8003/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"course_id": 1, "date": "2026-03-13", "records": [{"enrollment_id": 1, "status": "PRESENT"}]}'
```

### Get Attendance Records
```bash
curl -i http://localhost:8003/api/attendance
```

### Get Today's Attendance Summary
```bash
curl -i http://localhost:8003/api/attendance/today
```

### Get Student Attendance Summary
```bash
curl -i http://localhost:8003/api/attendance/student/1
```

### Get Course Enrollment Counts
```bash
curl -i http://localhost:8003/api/enrollments/course-counts
```

---

## Edge Case Tests

### 400 - Bad Request (Missing Fields)

#### Enrollment - Missing student_id and course_id
```bash
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Enrollment - Non-numeric IDs
```bash
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": "abc", "course_id": "xyz"}'
```

#### Enrollment - Invalid Status on Update
```bash
curl -i -X PUT http://localhost:8003/api/enrollments/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "INVALID_STATUS"}'
```

#### Grade - Missing Required Fields
```bash
curl -i -X POST http://localhost:8003/api/grades \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Grade - Invalid Grade Value (Out of Range)
```bash
curl -i -X POST http://localhost:8003/api/grades \
  -H "Content-Type: application/json" \
  -d '{"enrollment_id": 1, "grade": 6.00}'
```

#### Attendance - Missing Required Fields
```bash
curl -i -X POST http://localhost:8003/api/attendance \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Attendance - Invalid Date Format
```bash
curl -i -X POST http://localhost:8003/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"course_id": 1, "date": "not-a-date", "records": [{"enrollment_id": 1, "status": "PRESENT"}]}'
```

### 404 - Not Found

#### Student Not Found
```bash
curl -i http://localhost:8001/api/students/9999
```

#### Course Not Found
```bash
curl -i http://localhost:8002/api/courses/9999
```

#### Enrollment Not Found
```bash
curl -i http://localhost:8003/api/enrollments/9999
```

#### Enroll with Non-existent Student
```bash
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": 9999, "course_id": 1}'
```

#### Enroll with Non-existent Course
```bash
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "course_id": 9999}'
```

#### Grade for Non-existent Enrollment
```bash
curl -i -X POST http://localhost:8003/api/grades \
  -H "Content-Type: application/json" \
  -d '{"enrollment_id": 9999, "grade": 1.50}'
```

#### Route Not Found
```bash
curl -i http://localhost:8001/api/nonexistent
curl -i http://localhost:8002/api/nonexistent
curl -i http://localhost:8003/api/nonexistent
```

### 409 - Conflict (Duplicate)

#### Duplicate Student Email
```bash
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Duplicate", "email": "existing@example.com"}'
```

#### Duplicate Course Code
```bash
curl -i -X POST http://localhost:8002/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "Duplicate", "code": "EXISTING_CODE"}'
```

#### Duplicate Enrollment
```bash
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "course_id": 1}'
```

### 503 - Service Unavailable

To test this scenario, stop a dependency service and make requests that depend on it:

#### Stop Student Service, then try to enroll
```bash
# First, stop the Student Service (port 8001)
# Then run:
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "course_id": 1}'
```
Expected: `503 Service Unavailable` with `SERVICE_UNAVAILABLE` error code.

#### Stop Course Service, then try to enroll
```bash
# First, stop the Course Service (port 8002)
# Then run:
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "course_id": 1}'
```
Expected: `503 Service Unavailable` with `SERVICE_UNAVAILABLE` error code.

### 504 - Gateway Timeout

This occurs when a dependency service takes too long to respond:
```bash
# If a service is experiencing extreme load or slow responses:
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "course_id": 1}'
```
Expected: `504 Gateway Timeout` with `GATEWAY_TIMEOUT` error code when the upstream service exceeds the 5-second timeout.

---

## Expected JSON Error Response Format

All error responses follow this consistent format:
```json
{
    "error": "ERROR_CODE",
    "message": "Human readable explanation"
}
```

### Error Codes Reference
| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid input data |
| 404 | `STUDENT_NOT_FOUND` | Student ID does not exist |
| 404 | `COURSE_NOT_FOUND` | Course ID does not exist |
| 404 | `ENROLLMENT_NOT_FOUND` | Enrollment ID does not exist |
| 404 | `ROUTE_NOT_FOUND` | Requested API route does not exist |
| 409 | `DUPLICATE_EMAIL` | Student email already exists |
| 409 | `DUPLICATE_CODE` | Course code already exists |
| 409 | `DUPLICATE_ENROLLMENT` | Student already enrolled in course |
| 500 | `DATABASE_ERROR` | Database connection failure |
| 500 | `INTERNAL_ERROR` | Unhandled server error |
| 503 | `SERVICE_UNAVAILABLE` | Dependency service is down |
| 504 | `GATEWAY_TIMEOUT` | Dependency service timed out |
