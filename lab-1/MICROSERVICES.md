# Laboratory 1 - Part B: Microservices Architecture

> This document covers **Part B** only. For the complete documentation including Part A (Monolithic), see [README.md](README.md).

## Overview

This is the **Microservices Architecture** implementation of the Student Information System. The system is split into independent services that communicate via HTTP requests. Each service has its own database.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│                   http://localhost:8000                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY (Laravel + Inertia)                 │
│                   Port 8000                                  │
│                                                              │
│  • Routes HTTP requests to microservices                     │
│  • Serves the frontend (Vue.js / Inertia)                   │
│  • Handles user authentication                               │
│  • Aggregates data from multiple services                    │
│  • Uses ServiceClient for HTTP communication                 │
└────────┬──────────────────┬────────────────┬────────────────┘
         │                  │                │
    HTTP │ requests    HTTP │ requests  HTTP │ requests
         │                  │                │
         ▼                  ▼                ▼
┌────────────────┐ ┌────────────────┐ ┌─────────────────────┐
│ STUDENT SERVICE│ │ COURSE SERVICE │ │ ENROLLMENT SERVICE  │
│   Port 8001    │ │   Port 8002    │ │     Port 8003       │
│                │ │                │ │                     │
│ • CRUD students│ │ • CRUD courses │ │ • CRUD enrollments  │
│ • Student count│ │ • Prerequisites│ │ • Grade management  │
│ • Active count │ │ • Course count │ │ • Attendance tracking│
│                │ │                │ │ • GPA calculation   │
│   Database:    │ │   Database:    │ │   Database:         │
│ student_service│ │ course_service │ │ enrollment_service  │
│   .sqlite      │ │   .sqlite      │ │   .sqlite           │
└────────────────┘ └────────────────┘ └─────────────────────┘
                                             │
                                        HTTP │ calls to
                                        Student & Course
                                        services for
                                        data enrichment
```

## Services

### 1. Student Service (Port 8001)
- **Database:** `services/student-service/database/student_service.sqlite`
- **Endpoints:**
  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/students` | List all students |
  | POST | `/api/students` | Create a student |
  | GET | `/api/students/{id}` | Get student by ID |
  | PUT | `/api/students/{id}` | Update a student |
  | DELETE | `/api/students/{id}` | Delete a student |
  | GET | `/api/students/count` | Total student count |
  | GET | `/api/students/active/count` | Active student count |
  | GET | `/api/health` | Health check |

### 2. Course Service (Port 8002)
- **Database:** `services/course-service/database/course_service.sqlite`
- **Endpoints:**
  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/courses` | List all courses with prerequisites |
  | POST | `/api/courses` | Create a course |
  | GET | `/api/courses/{id}` | Get course with prerequisites |
  | PUT | `/api/courses/{id}` | Update a course |
  | DELETE | `/api/courses/{id}` | Delete a course |
  | GET | `/api/courses/count` | Total course count |
  | GET | `/api/health` | Health check |

### 3. Enrollment Service (Port 8003)
- **Database:** `services/enrollment-service/database/enrollment_service.sqlite`
- **Endpoints:**
  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/enrollments` | List all enrollments |
  | POST | `/api/enrollments` | Create enrollment (validates via Student/Course services) |
  | GET | `/api/enrollments/{id}` | Get enrollment |
  | PUT | `/api/enrollments/{id}` | Update enrollment status |
  | DELETE | `/api/enrollments/{id}` | Delete enrollment |
  | GET | `/api/enrollments/count` | Total enrollment count |
  | GET | `/api/enrollments/recent` | Recent enrollments |
  | GET | `/api/enrollments/by-student/{id}` | Enrollments for a student |
  | GET | `/api/enrollments/by-course/{id}` | Enrollments for a course |
  | GET | `/api/enrollments/course-counts` | Top courses by enrollment |
  | POST | `/api/grades` | Create/update a grade |
  | GET | `/api/grades` | List all grades |
  | GET | `/api/grades/stats` | Grade statistics |
  | GET | `/api/gpa/student/{id}` | Calculate student GPA |
  | POST | `/api/attendance` | Record attendance |
  | GET | `/api/attendance` | List attendance records |
  | GET | `/api/attendance/today` | Today's attendance summary |
  | GET | `/api/attendance/student/{id}` | Student attendance summary |
  | GET | `/api/health` | Health check |

### 4. API Gateway (Port 8000)
- The main Laravel application serving the frontend
- Uses `App\Services\ServiceClient` for HTTP communication
- Health check: `GET /api/health` (shows status of all services)

## How to Run

### Quick Start (Windows)
```bash
# 1. Start all microservices (runs migrations + starts servers)
start-services.bat

# 2. In a separate terminal, start the API Gateway
start-gateway.bat

# 3. Open browser: http://localhost:8000
```

### Manual Start

```bash
# Step 1: Migrate each service database
php services/student-service/migrate.php
php services/course-service/migrate.php
php services/enrollment-service/migrate.php

# Step 2: Start each service in separate terminals

# Terminal 1 - Student Service
cd services/student-service
php -S localhost:8001 -t public

# Terminal 2 - Course Service
cd services/course-service
php -S localhost:8002 -t public

# Terminal 3 - Enrollment Service
cd services/enrollment-service
php -S localhost:8003 -t public

# Terminal 4 - API Gateway
php artisan serve --port=8000
```

### Stop All Services
```bash
stop-services.bat
```

## Inter-Service Communication

Services communicate via **HTTP REST API calls**:

1. **API Gateway → Services:** The gateway's `ServiceClient` class makes HTTP requests to microservices to fetch/create/update/delete data.

2. **Enrollment Service → Student/Course Services:** When creating an enrollment, the Enrollment Service validates that the student and course exist by calling the Student Service and Course Service APIs.

3. **Data Enrichment:** When the Enrollment Service returns enrollment data, it enriches it with student names (from Student Service) and course details (from Course Service).

## Key Files

| File | Description |
|------|-------------|
| `app/Services/ServiceClient.php` | HTTP client for inter-service communication |
| `services/student-service/public/index.php` | Student Service API |
| `services/course-service/public/index.php` | Course Service API |
| `services/enrollment-service/public/index.php` | Enrollment Service API |
| `start-services.bat` | Start all microservices |
| `start-gateway.bat` | Start the API Gateway |
| `stop-services.bat` | Stop all services |

## Testing Individual Services

You can test each service independently using curl:

```bash
# Student Service
curl http://localhost:8001/api/health
curl http://localhost:8001/api/students
curl -X POST http://localhost:8001/api/students -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"email\":\"test@test.com\"}"

# Course Service
curl http://localhost:8002/api/health
curl http://localhost:8002/api/courses

# Enrollment Service
curl http://localhost:8003/api/health
curl http://localhost:8003/api/enrollments

# API Gateway Health Check (shows all services)
curl http://localhost:8000/api/health
```
