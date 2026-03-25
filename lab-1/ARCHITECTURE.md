# System Architecture Documentation

## Overview

This document describes the architectural design of the Student Information System implemented using two distinct approaches: **Monolithic Architecture** (Part A) and **Microservices Architecture** (Part B).

---

## Part A — Monolithic Architecture

### Definition

Monolithic architecture is a traditional software design pattern where all components of an application are tightly integrated into a single, unified codebase. The entire application is built, deployed, and scaled as one unit.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MONOLITHIC APPLICATION                               │
│                            Port 8080                                         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         PRESENTATION LAYER                               ││
│  │                     (JSON API Responses)                                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         BUSINESS LOGIC LAYER                             ││
│  │                                                                          ││
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐         ││
│  │   │   Student   │    │   Course    │    │    Enrollment       │         ││
│  │   │   Handler   │    │   Handler   │    │    Handler          │         ││
│  │   └─────────────┘    └─────────────┘    └─────────────────────┘         ││
│  │                                                                          ││
│  │   • POST /students           • GET /courses       • POST /enrollments   ││
│  │   • GET /students            • POST /courses      • GET /enrollments/{id}│
│  │   • GET /students/{id}       • GET /courses/{id}  • GET /enrollments    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         DATA ACCESS LAYER                                ││
│  │                          (PDO / SQLite)                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         SINGLE DATABASE                                  ││
│  │                       monolithic.sqlite                                  ││
│  │                                                                          ││
│  │   ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐           ││
│  │   │   students    │  │    courses    │  │   enrollments     │           ││
│  │   │               │◄─┼───────────────┼──┤                   │           ││
│  │   │  id (PK)      │  │  id (PK)      │  │  id (PK)          │           ││
│  │   │  student_no   │  │  course_code  │  │  student_id (FK)  │           ││
│  │   │  name         │  │  name         │  │  course_id (FK)   │           ││
│  │   │  email        │  │  credits      │  │  status           │           ││
│  │   │  ...          │  │  ...          │  │  grade            │           ││
│  │   └───────────────┘  └───────────────┘  └───────────────────┘           ││
│  │                                                                          ││
│  │              Foreign Key Relationships Enforced                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Description |
|-----------|-------------|
| **index.php** | Single entry point handling all HTTP requests and routing |
| **monolithic.sqlite** | Unified database containing all tables |
| **migrate.php** | Database schema creation and seeding script |

### Data Flow

```
Client Request
      │
      ▼
┌─────────────┐
│  index.php  │ ─── Parse URL & Method
└─────────────┘
      │
      ▼
┌─────────────┐
│   Router    │ ─── Match route pattern
└─────────────┘
      │
      ▼
┌─────────────┐
│  Handler    │ ─── Execute business logic
└─────────────┘
      │
      ▼
┌─────────────┐
│  Database   │ ─── Query/Insert/Update
└─────────────┘
      │
      ▼
┌─────────────┐
│  Response   │ ─── Return JSON
└─────────────┘
```

### Characteristics

- **Single Codebase**: All code in one `index.php` file
- **Shared Database**: One SQLite database with foreign key constraints
- **Direct Function Calls**: No network overhead between components
- **Single Deployment**: Deploy entire application at once
- **Unified Logging**: All logs in one location

---

## Part B — Microservices Architecture

### Definition

Microservices architecture structures an application as a collection of loosely coupled, independently deployable services. Each service is responsible for a specific business domain and communicates with others through well-defined APIs.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│                           http://localhost:8000                              │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Laravel + Inertia)                       │
│                               Port 8000                                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          ServiceClient.php                              │ │
│  │                                                                         │ │
│  │  • Routes requests to appropriate microservices                         │ │
│  │  • Aggregates responses from multiple services                          │ │
│  │  • Handles user authentication                                          │ │
│  │  • Serves React + TypeScript frontend                                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└───────────┬─────────────────────────┬─────────────────────────┬─────────────┘
            │                         │                         │
       HTTP │ REST                HTTP │ REST               HTTP │ REST
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────────────┐
│  STUDENT SERVICE  │   │  COURSE SERVICE   │   │   ENROLLMENT SERVICE      │
│     Port 8001     │   │     Port 8002     │   │       Port 8003           │
│                   │   │                   │   │                           │
│ ┌───────────────┐ │   │ ┌───────────────┐ │   │ ┌───────────────────────┐ │
│ │   index.php   │ │   │ │   index.php   │ │   │ │      index.php        │ │
│ └───────────────┘ │   │ └───────────────┘ │   │ └───────────────────────┘ │
│                   │   │                   │   │             │             │
│ Endpoints:        │   │ Endpoints:        │   │ Endpoints:  │             │
│ • GET /students   │   │ • GET /courses    │   │ • GET /enrollments        │
│ • POST /students  │   │ • POST /courses   │   │ • POST /enrollments       │
│ • GET /students/id│   │ • GET /courses/id │   │ • GET /enrollments/id     │
│ • PUT /students/id│   │ • PUT /courses/id │   │ • PUT /enrollments/id     │
│ • DELETE          │   │ • DELETE          │   │ • DELETE    │             │
│                   │   │                   │   │             │             │
│ ┌───────────────┐ │   │ ┌───────────────┐ │   │             ▼             │
│ │   Database    │ │   │ │   Database    │ │   │   ┌─────────────────┐     │
│ │   student_    │ │   │ │   course_     │ │   │   │  Validates via  │     │
│ │   service.    │ │   │ │   service.    │ │   │   │  HTTP calls to  │     │
│ │   sqlite      │ │   │ │   sqlite      │ │   │   │  Student/Course │     │
│ └───────────────┘ │   │ └───────────────┘ │   │   │  Services       │     │
└───────────────────┘   └───────────────────┘   │   └─────────────────┘     │
                                                │             │             │
                                                │             ▼             │
                                                │   ┌─────────────────────┐ │
                                                │   │      Database       │ │
                                                │   │   enrollment_       │ │
                                                │   │   service.sqlite    │ │
                                                │   └─────────────────────┘ │
                                                └───────────────────────────┘
```

### Service Decomposition

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOMAIN BOUNDARIES                                  │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│   STUDENT DOMAIN    │   COURSE DOMAIN     │      ENROLLMENT DOMAIN          │
│                     │                     │                                 │
│   Responsibilities: │   Responsibilities: │   Responsibilities:             │
│   • Student CRUD    │   • Course CRUD     │   • Enrollment CRUD             │
│   • Student search  │   • Course catalog  │   • Grade management            │
│   • Profile mgmt    │   • Prerequisites   │   • Student-Course linking      │
│                     │                     │   • Enrollment validation       │
│   Data Owned:       │   Data Owned:       │   Data Owned:                   │
│   • student_number  │   • course_code     │   • enrollment_date             │
│   • name, email     │   • name, credits   │   • status, grade               │
│   • phone, address  │   • department      │   • student_id (ref)            │
│   • year_level      │   • semester        │   • course_id (ref)             │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
```

### Inter-Service Communication

```
                    ENROLLMENT CREATION FLOW

Client                Gateway              Enrollment           Student            Course
  │                     │                   Service             Service           Service
  │                     │                      │                   │                 │
  │  POST /enrollments  │                      │                   │                 │
  │────────────────────►│                      │                   │                 │
  │                     │  POST /enrollments   │                   │                 │
  │                     │─────────────────────►│                   │                 │
  │                     │                      │                   │                 │
  │                     │                      │ GET /students/{id}│                 │
  │                     │                      │──────────────────►│                 │
  │                     │                      │                   │                 │
  │                     │                      │   Student Data    │                 │
  │                     │                      │◄──────────────────│                 │
  │                     │                      │                   │                 │
  │                     │                      │ GET /courses/{id} │                 │
  │                     │                      │──────────────────────────────────►│
  │                     │                      │                   │                 │
  │                     │                      │    Course Data    │                 │
  │                     │                      │◄──────────────────────────────────│
  │                     │                      │                   │                 │
  │                     │                      │ Create Enrollment │                 │
  │                     │                      │ (Local DB)        │                 │
  │                     │                      │                   │                 │
  │                     │  Enrollment Created  │                   │                 │
  │                     │◄─────────────────────│                   │                 │
  │  201 Created        │                      │                   │                 │
  │◄────────────────────│                      │                   │                 │
```

### Database Per Service Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE ISOLATION                                    │
│                                                                              │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│   │ student_service │  │ course_service  │  │   enrollment_service        │ │
│   │    .sqlite      │  │    .sqlite      │  │       .sqlite               │ │
│   │                 │  │                 │  │                             │ │
│   │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────────────────┐  │ │
│   │  │ students  │  │  │  │  courses  │  │  │  │     enrollments       │  │ │
│   │  │           │  │  │  │           │  │  │  │                       │  │ │
│   │  │ id        │  │  │  │ id        │  │  │  │ id                    │  │ │
│   │  │ name      │  │  │  │ code      │  │  │  │ student_id (no FK)    │  │ │
│   │  │ email     │  │  │  │ name      │  │  │  │ course_id (no FK)     │  │ │
│   │  │ ...       │  │  │  │ ...       │  │  │  │ status                │  │ │
│   │  └───────────┘  │  │  └───────────┘  │  │  └───────────────────────┘  │ │
│   │                 │  │                 │  │                             │ │
│   │  No foreign     │  │  No foreign     │  │  References validated       │ │
│   │  keys to other  │  │  keys to other  │  │  via HTTP API calls         │ │
│   │  services       │  │  services       │  │                             │ │
│   └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                              │
│   Benefits:                                                                  │
│   • Independent schema evolution                                             │
│   • Service-specific optimization                                            │
│   • Fault isolation                                                          │
│   • Independent backup/restore                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TECHNOLOGY STACK                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         API GATEWAY                                      ││
│  │  • Laravel 12 (PHP Framework)                                            ││
│  │  • Inertia.js (SPA Bridge)                                               ││
│  │  • React 19 + TypeScript (Frontend)                                      ││
│  │  • Tailwind CSS 4 (Styling)                                              ││
│  │  • ServiceClient.php (HTTP Client)                                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         MICROSERVICES                                    ││
│  │  • Plain PHP 8.2 (Lightweight, no framework)                             ││
│  │  • PDO (Database abstraction)                                            ││
│  │  • SQLite (File-based database)                                          ││
│  │  • PHP Built-in Server (Development)                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         COMMUNICATION                                    ││
│  │  • HTTP/REST (Synchronous)                                               ││
│  │  • JSON (Data format)                                                    ││
│  │  • cURL / Laravel HTTP Client                                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
lab-1/
│
├── monolithic/                          # PART A
│   ├── database/
│   │   └── monolithic.sqlite            # Single unified database
│   ├── public/
│   │   └── index.php                    # All routes & logic
│   └── migrate.php                      # Schema + seeds
│
├── services/                            # PART B
│   ├── student-service/
│   │   ├── database/
│   │   │   └── student_service.sqlite
│   │   ├── public/
│   │   │   └── index.php
│   │   └── migrate.php
│   │
│   ├── course-service/
│   │   ├── database/
│   │   │   └── course_service.sqlite
│   │   ├── public/
│   │   │   └── index.php
│   │   └── migrate.php
│   │
│   └── enrollment-service/
│       ├── database/
│       │   └── enrollment_service.sqlite
│       ├── public/
│       │   └── index.php
│       └── migrate.php
│
├── app/                                 # Laravel Gateway
│   ├── Http/Controllers/
│   └── Services/
│       └── ServiceClient.php            # HTTP client for services
│
├── resources/js/                        # React Frontend
│
├── start-monolithic.bat                 # Run Part A
├── start-services.bat                   # Run Part B services
├── start-gateway.bat                    # Run Part B gateway
└── stop-services.bat                    # Stop all services
```

---

## Conclusion

Both architectures serve the same functional requirements but differ significantly in their structural approach:

- **Monolithic**: Best for smaller teams, simpler domains, and rapid development
- **Microservices**: Best for larger teams, complex domains, and independent scalability

The choice between them should be based on project requirements, team size, and operational capabilities.
