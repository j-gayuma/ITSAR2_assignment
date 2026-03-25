# Laboratory 2 — Microservices Edge Case Handling & Curl Testing

A Student Information System built with a **microservices architecture**, featuring an API Gateway that communicates with three independent backend services. **Laboratory 2** extends this with proper edge case handling, consistent JSON error responses, and comprehensive curl testing.

---

## Lab 2 Additions

- Consistent JSON error response format across all services: `{"error": "ERROR_CODE", "message": "..."}`
- Proper HTTP status codes: 400, 404, 409, 503, 504
- Input validation (email format, grade range, date format, status values)
- Inter-service failure detection (503 Service Unavailable, 504 Gateway Timeout)
- Curl test documentation with `-i` flag for header inspection
- Evidence files with actual curl output

### Deliverables

| File | Description |
|---|---|
| `tests/curl-tests.md` | Complete curl test commands for all endpoints and edge cases |
| `docs/report.md` | Lab report with implementation details and reflections |
| `docs/evidence/` | 27 curl output text files showing HTTP status codes and JSON responses |

---

## Tech Stack

### API Gateway (Main App)

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | PHP | ^8.2 |
| Framework | Laravel | ^12.0 |
| Authentication | Laravel Fortify | ^1.30 |
| SPA Bridge | Inertia.js (Laravel) | ^2.0 |
| Route Typing | Laravel Wayfinder | ^0.1.9 |

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Library | React | ^19.0 |
| Language | TypeScript | ^5.7 |
| Styling | Tailwind CSS | ^4.0 |
| Component Library | Radix UI | various |
| Icons | Lucide React | ^0.475 |
| Build Tool | Vite | ^7.0 |
| HTTP / SPA | Inertia.js (React) | ^2.3 |

### Microservices

| Service | Language | Runtime | Port |
|---------|----------|---------|------|
| Student Service | PHP (no framework) | PHP built-in server | 8001 |
| Course Service | PHP (no framework) | PHP built-in server | 8002 |
| Enrollment Service | PHP (no framework) | PHP built-in server | 8003 |

### Database

Each service has its **own isolated SQLite database**:

| Service | Database file |
|---------|-------------|
| Student Service | `services/student-service/database/student_service.sqlite` |
| Course Service | `services/course-service/database/course_service.sqlite` |
| Enrollment Service | `services/enrollment-service/database/enrollment_service.sqlite` |
| API Gateway | `database/database.sqlite` |

---

## Architecture

```
CLIENT (Browser) → http://localhost:8000
        │
        ▼
API GATEWAY (Laravel + Inertia)  :8000
        │
        ├──► Student Service    :8001   (SQLite)
        ├──► Course Service     :8002   (SQLite)
        └──► Enrollment Service :8003   (SQLite)
```

Services communicate over plain HTTP using the `ServiceClient` class (`app/Services/ServiceClient.php`).

---

## Getting Started

### Prerequisites

- PHP >= 8.2
- Composer
- Node.js >= 18 & npm

### Installation

```bash
# Install PHP dependencies
composer install

# Install JS dependencies
npm install

# Build frontend assets
npm run build

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### Running the App

**Step 1 — Start all microservices (opens separate terminal windows):**

```bat
start-services.bat
```

**Step 2 — Start the API Gateway:**

```bat
start-gateway.bat
```

Or manually:

```bash
php artisan serve --port=8000
```

The app is now accessible at **http://localhost:8000**.

### Stopping Services

```bat
stop-services.bat
```

---

## Edge Case Handling

### Error Response Format

All services return errors in a consistent JSON format:
```json
{
    "error": "ERROR_CODE",
    "message": "Human readable explanation"
}
```

### Supported HTTP Error Codes

| Status | Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid input |
| 404 | `STUDENT_NOT_FOUND` | Student does not exist |
| 404 | `COURSE_NOT_FOUND` | Course does not exist |
| 404 | `ENROLLMENT_NOT_FOUND` | Enrollment does not exist |
| 404 | `ROUTE_NOT_FOUND` | API route does not exist |
| 409 | `DUPLICATE_EMAIL` | Student email already taken |
| 409 | `DUPLICATE_CODE` | Course code already taken |
| 409 | `DUPLICATE_ENROLLMENT` | Already enrolled |
| 500 | `DATABASE_ERROR` | Database connection failure |
| 500 | `INTERNAL_ERROR` | Unhandled server error |
| 503 | `SERVICE_UNAVAILABLE` | Dependency service is down |
| 504 | `GATEWAY_TIMEOUT` | Dependency service timed out |

---

## Testing with Curl

See `tests/curl-tests.md` for the complete list of curl commands. Example:

```bash
# Test 400 - Missing required fields
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{}'

# Test 404 - Resource not found
curl -i http://localhost:8001/api/students/9999

# Test 409 - Duplicate email
curl -i -X POST http://localhost:8001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Dup", "email": "existing@example.com"}'

# Test 503 - Service unavailable (stop Student Service first)
curl -i -X POST http://localhost:8003/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "course_id": 1}'
```

---

## Project Structure

```
laboratory2-app/
├── app/                  # Laravel application (API Gateway)
│   ├── Http/Controllers/ # Request handlers
│   ├── Models/           # Eloquent models
│   └── Services/         # ServiceClient (HTTP inter-service calls)
├── resources/js/         # React + TypeScript frontend
├── routes/               # Laravel routes
├── services/
│   ├── student-service/  # Student microservice (plain PHP)
│   ├── course-service/   # Course microservice (plain PHP)
│   └── enrollment-service/ # Enrollment microservice (plain PHP)
├── tests/
│   └── curl-tests.md     # Curl test commands documentation
├── docs/
│   ├── report.md         # Lab report
│   └── evidence/         # Curl output evidence files
└── database/             # Gateway migrations & seeders
```

---

## Running Tests

```bash
php artisan test
# or
./vendor/bin/pest
```
