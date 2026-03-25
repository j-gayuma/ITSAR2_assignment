# Laboratory 1 — Student Information System

This laboratory demonstrates two architectural approaches for building a Student Information System:
- **Part A**: Monolithic Architecture
- **Part B**: Microservices Architecture

---

## Part A — Monolithic System

A single application with ONE database containing all entities (students, courses, enrollments).

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              MONOLITHIC APPLICATION                          │
│                  Port 8080                                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   index.php                             │ │
│  │                                                         │ │
│  │  • POST /students         - Create a student            │ │
│  │  • GET  /courses          - List all courses            │ │
│  │  • POST /enrollments      - Create an enrollment        │ │
│  │  • GET  /enrollments/{id} - Get enrollment by ID        │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ONE SQLite Database                        │ │
│  │              monolithic.sqlite                          │ │
│  │                                                         │ │
│  │  Tables: students | courses | enrollments               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Required Endpoints (Part A)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/students` | Create a new student |
| GET | `/courses` | List all courses |
| POST | `/enrollments` | Create a new enrollment |
| GET | `/enrollments/{id}` | Get enrollment by ID |

### Running Part A

```bash
# Start the monolithic application
start-monolithic.bat

# Or manually:
php monolithic/migrate.php
php -S localhost:8080 -t monolithic/public
```

Access at: **http://localhost:8080**

### Testing Part A

```bash
# Health check
curl http://localhost:8080/health

# Create a student
curl -X POST http://localhost:8080/students \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}"

# List courses
curl http://localhost:8080/courses

# Create an enrollment
curl -X POST http://localhost:8080/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\":1,\"course_id\":1}"

# Get enrollment by ID
curl http://localhost:8080/enrollments/1
```

---

## Part B — Microservices System

The system is split into three independent services that communicate via HTTP requests. Each service has its own database.

### Architecture

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
│  • Serves the frontend (React + TypeScript)                  │
│  • Handles user authentication                               │
│  • Aggregates data from multiple services                    │
└────────┬──────────────────┬────────────────┬────────────────┘
         │                  │                │
    HTTP │             HTTP │           HTTP │
         │                  │                │
         ▼                  ▼                ▼
┌────────────────┐ ┌────────────────┐ ┌─────────────────────┐
│ STUDENT SERVICE│ │ COURSE SERVICE │ │ ENROLLMENT SERVICE  │
│   Port 8001    │ │   Port 8002    │ │     Port 8003       │
│                │ │                │ │                     │
│ • CRUD students│ │ • CRUD courses │ │ • CRUD enrollments  │
│                │ │                │ │ • Grade management  │
│                │ │                │ │                     │
│   Database:    │ │   Database:    │ │   Database:         │
│ student_service│ │ course_service │ │ enrollment_service  │
│   .sqlite      │ │   .sqlite      │ │   .sqlite           │
└────────────────┘ └────────────────┘ └─────────────────────┘
```

### Services

#### Student Service (Port 8001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create a student |
| GET | `/api/students/{id}` | Get student by ID |
| PUT | `/api/students/{id}` | Update a student |
| DELETE | `/api/students/{id}` | Delete a student |
| GET | `/api/health` | Health check |

#### Course Service (Port 8002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| POST | `/api/courses` | Create a course |
| GET | `/api/courses/{id}` | Get course by ID |
| PUT | `/api/courses/{id}` | Update a course |
| DELETE | `/api/courses/{id}` | Delete a course |
| GET | `/api/health` | Health check |

#### Enrollment Service (Port 8003)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/enrollments` | List all enrollments |
| POST | `/api/enrollments` | Create enrollment |
| GET | `/api/enrollments/{id}` | Get enrollment |
| PUT | `/api/enrollments/{id}` | Update enrollment |
| DELETE | `/api/enrollments/{id}` | Delete enrollment |
| GET | `/api/health` | Health check |

### Running Part B

**Step 1 — Start all microservices:**

```bash
start-services.bat
```

**Step 2 — Start the API Gateway:**

```bash
start-gateway.bat
```

Access at: **http://localhost:8000**

### Testing Part B

```bash
# Student Service
curl http://localhost:8001/api/health
curl http://localhost:8001/api/students
curl -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"test@test.com\"}"

# Course Service
curl http://localhost:8002/api/health
curl http://localhost:8002/api/courses

# Enrollment Service
curl http://localhost:8003/api/health
curl http://localhost:8003/api/enrollments

# API Gateway Health (shows all services)
curl http://localhost:8000/api/health
```

### Stopping Part B Services

```bash
stop-services.bat
```

---

## Project Structure

```
laboratory1-B-app/
├── monolithic/                    # PART A - Monolithic System
│   ├── database/
│   │   └── monolithic.sqlite      # ONE database for all tables
│   ├── public/
│   │   └── index.php              # Single entry point
│   └── migrate.php                # Database migration script
│
├── services/                      # PART B - Microservices
│   ├── student-service/           # Student microservice
│   │   ├── database/
│   │   │   └── student_service.sqlite
│   │   └── public/
│   │       └── index.php
│   ├── course-service/            # Course microservice
│   │   ├── database/
│   │   │   └── course_service.sqlite
│   │   └── public/
│   │       └── index.php
│   └── enrollment-service/        # Enrollment microservice
│       ├── database/
│       │   └── enrollment_service.sqlite
│       └── public/
│           └── index.php
│
├── app/                           # Laravel API Gateway (Part B)
│   ├── Http/Controllers/
│   ├── Models/
│   └── Services/
│       └── ServiceClient.php      # HTTP inter-service communication
│
├── resources/js/                  # React + TypeScript frontend
├── routes/                        # Laravel routes
├── database/                      # Gateway database
│
├── start-monolithic.bat           # Start Part A
├── start-services.bat             # Start Part B microservices
├── start-gateway.bat              # Start Part B API Gateway
└── stop-services.bat              # Stop Part B services
```

---

## Tech Stack

### Part A (Monolithic)

| Component | Technology |
|-----------|------------|
| Language | PHP 8.2 |
| Server | PHP built-in server |
| Database | SQLite |
| Port | 8080 |

### Part B (Microservices)

| Component | Technology |
|-----------|------------|
| API Gateway | Laravel 12 + Inertia.js |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Microservices | Plain PHP |
| Database | SQLite (one per service) |
| Ports | 8000, 8001, 8002, 8003 |

---

## Key Differences

| Aspect | Part A (Monolithic) | Part B (Microservices) |
|--------|-------------------|----------------------|
| Applications | 1 | 4 (Gateway + 3 services) |
| Databases | 1 | 4 (1 per service) |
| Communication | Direct function calls | HTTP REST API |
| Scaling | Scale entire app | Scale individual services |
| Deployment | Single deployment | Independent deployments |
| Complexity | Simple | More complex |

---

## Prerequisites

- PHP >= 8.2
- Composer (for Part B)
- Node.js >= 18 & npm (for Part B frontend)

---

## Installation

```bash
# Install PHP dependencies (for Part B)
composer install

# Install JS dependencies (for Part B)
npm install

# Build frontend assets (for Part B)
npm run build

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```
