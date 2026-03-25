# Architecture Comparison: Monolithic vs Microservices

This document provides a detailed comparison between the Monolithic Architecture (Part A) and Microservices Architecture (Part B) implemented in this laboratory exercise.

---

## 1. How does each system handle communication between components?

### Monolithic Architecture (Part A)

In the monolithic system, communication between components happens through **direct function calls** within the same process. Since all business logic resides in a single `index.php` file, components interact by calling functions or accessing shared variables directly.

```php
// Direct database query - no network call needed
$stmt = $pdo->prepare("
    SELECT e.*, s.name as student_name, c.course_code
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN courses c ON e.course_id = c.id
    WHERE e.id = ?
");
```

**Characteristics:**
- In-memory function calls (nanosecond latency)
- Shared database connection
- Direct access to all data through SQL JOINs
- No serialization/deserialization overhead
- Single transaction scope

### Microservices Architecture (Part B)

In the microservices system, components communicate through **HTTP REST API calls** over the network. Each service is a separate process running on its own port, requiring network communication for inter-service data exchange.

```php
// HTTP call to Student Service
$ch = curl_init("http://localhost:8001/api/students/{$studentId}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$student = json_decode($response, true);

// HTTP call to Course Service
$ch = curl_init("http://localhost:8002/api/courses/{$courseId}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$course = json_decode($response, true);
```

**Characteristics:**
- Network calls (millisecond latency)
- Independent database connections per service
- Data aggregation requires multiple HTTP requests
- JSON serialization/deserialization required
- Distributed transaction complexity

---

## 2. What are the advantages and disadvantages of each approach?

### Monolithic Architecture

| Advantages | Disadvantages |
|------------|---------------|
| **Simple Development**: Single codebase, easy to understand and navigate | **Scaling Limitations**: Must scale entire application even if only one component needs more resources |
| **Easy Debugging**: All code in one place, straightforward stack traces | **Deployment Risk**: Single deployment means any bug affects the entire system |
| **Fast Performance**: No network overhead for internal communication | **Technology Lock-in**: Entire application must use the same technology stack |
| **Simple Deployment**: One application to deploy and manage | **Code Maintainability**: Large codebase becomes difficult to maintain over time |
| **ACID Transactions**: Database transactions are straightforward | **Team Bottlenecks**: Multiple developers working on same codebase can cause conflicts |
| **Lower Operational Cost**: Single server, simpler infrastructure | **Long Build Times**: Any change requires rebuilding the entire application |
| **Easy Testing**: End-to-end testing is straightforward | **Limited Fault Isolation**: One component failure can crash the entire system |

### Microservices Architecture

| Advantages | Disadvantages |
|------------|---------------|
| **Independent Scaling**: Scale only the services that need more resources | **Increased Complexity**: More moving parts to manage and monitor |
| **Fault Isolation**: One service failure doesn't crash others | **Network Latency**: Inter-service communication adds latency |
| **Technology Flexibility**: Each service can use different technologies | **Data Consistency**: Distributed transactions are complex |
| **Independent Deployment**: Deploy services without affecting others | **Operational Overhead**: Multiple services require more infrastructure |
| **Team Autonomy**: Different teams can own different services | **Debugging Difficulty**: Distributed tracing required across services |
| **Easier Maintenance**: Smaller, focused codebases | **Testing Complexity**: Integration testing across services is challenging |
| **Continuous Delivery**: Faster, more frequent deployments per service | **Initial Development Cost**: More upfront effort to set up properly |

---

## 3. How does each system manage data consistency?

### Monolithic Architecture (Part A)

Data consistency is managed through **database-level constraints** and **ACID transactions**:

```sql
-- Foreign key constraints ensure referential integrity
CREATE TABLE enrollments (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

```php
// Single transaction for multiple operations
$pdo->beginTransaction();
try {
    // Insert enrollment
    $stmt = $pdo->prepare("INSERT INTO enrollments ...");
    $stmt->execute([...]);

    // Update course enrollment count
    $stmt = $pdo->prepare("UPDATE courses SET enrolled = enrolled + 1 ...");
    $stmt->execute([...]);

    $pdo->commit();  // Both succeed or both fail
} catch (Exception $e) {
    $pdo->rollback();
}
```

**Consistency Mechanisms:**
- ACID transactions (Atomicity, Consistency, Isolation, Durability)
- Foreign key constraints
- Unique constraints
- Check constraints
- Single source of truth

### Microservices Architecture (Part B)

Data consistency is managed through **application-level validation** and **eventual consistency patterns**:

```php
// Enrollment Service validates via HTTP calls
function createEnrollment($studentId, $courseId) {
    // Validate student exists (HTTP call)
    $student = httpGet("http://localhost:8001/api/students/{$studentId}");
    if (!$student) {
        throw new Exception("Student not found");
    }

    // Validate course exists (HTTP call)
    $course = httpGet("http://localhost:8002/api/courses/{$courseId}");
    if (!$course) {
        throw new Exception("Course not found");
    }

    // Create enrollment in local database
    // Note: No foreign key - just stores IDs as references
    $stmt = $pdo->prepare("INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)");
    $stmt->execute([$studentId, $courseId]);
}
```

**Consistency Mechanisms:**
- API validation before operations
- Eventual consistency (data may be temporarily inconsistent)
- Saga pattern for distributed transactions (if needed)
- Compensating transactions for rollback
- Each service is the source of truth for its domain

**Trade-offs:**
| Aspect | Monolithic | Microservices |
|--------|------------|---------------|
| Consistency Model | Strong (ACID) | Eventual |
| Transaction Scope | Database-wide | Service-local |
| Referential Integrity | Database-enforced | Application-enforced |
| Data Duplication | None | May be necessary |
| Conflict Resolution | Automatic (DB locks) | Manual implementation |

---

## 4. What happens if one component fails in each architecture?

### Monolithic Architecture (Part A)

**Failure Scenario:** If any component fails (e.g., database error, unhandled exception), the entire application crashes.

```
┌─────────────────────────────────────────────┐
│           MONOLITHIC APPLICATION            │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │ Student │  │ Course  │  │ Enrollment  │ │
│  │ Handler │  │ Handler │  │  Handler    │ │
│  └────┬────┘  └────┬────┘  └──────┬──────┘ │
│       │            │              │        │
│       └────────────┼──────────────┘        │
│                    │                        │
│                    ▼                        │
│              ┌──────────┐                   │
│              │ Database │ ←── FAILURE!      │
│              └──────────┘                   │
│                    ║                        │
│                    ╚═══════════════════════╗│
│                                     ▼      ││
│            ╔════════════════════════════╗  ││
│            ║  ENTIRE APP CRASHES        ║  ││
│            ║  All features unavailable  ║◄═╝│
│            ╚════════════════════════════╝   │
└─────────────────────────────────────────────┘
```

**Impact:**
- All endpoints become unavailable
- All users affected simultaneously
- Complete service outage until fixed
- Single point of failure

### Microservices Architecture (Part B)

**Failure Scenario:** If one service fails, only that service's functionality is affected. Other services continue to operate.

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Student Service │   │ Course Service  │   │Enrollment Service│
│    Port 8001    │   │    Port 8002    │   │    Port 8003    │
│                 │   │                 │   │                 │
│  ┌───────────┐  │   │  ┌───────────┐  │   │  ┌───────────┐  │
│  │  ✓ ONLINE │  │   │  │ ✗ OFFLINE │  │   │  │  ✓ ONLINE │  │
│  └───────────┘  │   │  └───────────┘  │   │  └───────────┘  │
│                 │   │       ║         │   │                 │
│  Students can   │   │       ║         │   │  Enrollments    │
│  be managed     │   │  ╔════╩════╗    │   │  can be viewed  │
│                 │   │  ║ FAILURE ║    │   │  (with limits)  │
│                 │   │  ╚═════════╝    │   │                 │
└─────────────────┘   └─────────────────┘   └─────────────────┘
        │                     │                      │
        │                     │                      │
        ▼                     ▼                      ▼
   ✓ Working            ✗ Unavailable           ⚠ Degraded
   All student          Course listing         Create enrollment
   operations           and creation           fails (can't
   function             unavailable            validate course)
```

**Impact:**
- Only affected service's features unavailable
- Other services continue working
- Graceful degradation possible
- Partial functionality maintained

**Graceful Degradation Example:**
```php
// Enrollment Service with fallback handling
function getEnrollmentWithDetails($id) {
    $enrollment = getEnrollment($id);

    // Try to enrich with student data
    try {
        $student = httpGet("http://localhost:8001/api/students/{$enrollment['student_id']}");
        $enrollment['student_name'] = $student['name'];
    } catch (Exception $e) {
        $enrollment['student_name'] = 'Student #' . $enrollment['student_id'];
        $enrollment['_warning'] = 'Student service unavailable';
    }

    // Try to enrich with course data
    try {
        $course = httpGet("http://localhost:8002/api/courses/{$enrollment['course_id']}");
        $enrollment['course_name'] = $course['name'];
    } catch (Exception $e) {
        $enrollment['course_name'] = 'Course #' . $enrollment['course_id'];
        $enrollment['_warning'] = 'Course service unavailable';
    }

    return $enrollment;  // Returns degraded but usable data
}
```

---

## 5. How would each architecture scale to handle increased load?

### Monolithic Architecture (Part A)

**Scaling Strategy: Vertical Scaling (Scale Up) + Horizontal with Load Balancer**

```
                         VERTICAL SCALING
                    (Upgrade Server Resources)

Before:                              After:
┌──────────────────┐                ┌──────────────────────────┐
│  2 CPU | 4GB RAM │    ───►        │  8 CPU | 32GB RAM        │
│                  │                │                          │
│  Monolithic App  │                │    Monolithic App        │
│                  │                │                          │
│  Database        │                │    Database              │
└──────────────────┘                └──────────────────────────┘


                      HORIZONTAL SCALING
                    (Multiple App Instances)

                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ App Copy 1  │   │ App Copy 2  │   │ App Copy 3  │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Shared Database │ ◄── Bottleneck!
                    └─────────────────┘
```

**Limitations:**
- Must scale entire application even if only one component is under load
- Database becomes bottleneck
- All instances share same database connection pool
- Resource waste if only one feature needs scaling

### Microservices Architecture (Part B)

**Scaling Strategy: Independent Service Scaling**

```
                    SELECTIVE HORIZONTAL SCALING
            (Scale only services that need more capacity)

Scenario: High enrollment period - only Enrollment Service needs scaling

                         ┌─────────────────┐
                         │   API Gateway   │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│Student Service│         │Course Service │         │ Load Balancer │
│  (1 instance) │         │ (1 instance)  │         │               │
│               │         │               │         └───────┬───────┘
│   Low Load    │         │   Low Load    │                 │
└───────────────┘         └───────────────┘     ┌───────────┼───────────┐
                                                │           │           │
                                                ▼           ▼           ▼
                                         ┌──────────┐┌──────────┐┌──────────┐
                                         │Enrollment││Enrollment││Enrollment│
                                         │Service 1 ││Service 2 ││Service 3 │
                                         │          ││          ││          │
                                         │ HIGH     ││ HIGH     ││ HIGH     │
                                         │ LOAD     ││ LOAD     ││ LOAD     │
                                         └────┬─────┘└────┬─────┘└────┬─────┘
                                              │           │           │
                                              ▼           ▼           ▼
                                         ┌──────────┐┌──────────┐┌──────────┐
                                         │Database 1││Database 2││Database 3│
                                         │ (or      ││ (replica)││ (replica)│
                                         │ shared)  ││          ││          │
                                         └──────────┘└──────────┘└──────────┘
```

**Benefits:**
- Scale only what needs scaling (cost-effective)
- Each service can have different scaling policies
- Database scaling per service
- Auto-scaling based on individual service metrics
- No resource waste on low-traffic services

**Scaling Comparison:**

| Aspect | Monolithic | Microservices |
|--------|------------|---------------|
| Scaling Unit | Entire application | Individual service |
| Resource Efficiency | Low (waste on unused parts) | High (scale only needed parts) |
| Database Scaling | Single DB bottleneck | Per-service DB scaling |
| Cost | Higher (over-provisioning) | Lower (precise scaling) |
| Complexity | Simple | More complex |
| Auto-scaling | All or nothing | Per-service policies |

---

## Detailed Criteria Comparison

### 1. Ease of Development

| Aspect | Monolithic (Part A) | Microservices (Part B) |
|--------|---------------------|------------------------|
| **How it works** | All code resides in a single codebase (`index.php`). Developers work on one unified project with shared models, functions, and database access. Changes to any feature are made in the same repository. | Code is distributed across multiple independent services. Each service (Student, Course, Enrollment) has its own codebase, requiring developers to work across multiple projects. |
| **Learning Curve** | Low - Simple structure, easy to understand the entire system | High - Must understand service boundaries, APIs, and communication patterns |
| **Code Navigation** | Easy - All related code is in one place, use simple search | Difficult - Must switch between multiple service codebases |
| **Debugging** | Simple - Single process, linear stack traces, easy breakpoints | Complex - Distributed tracing needed, logs across multiple services |
| **Testing** | Straightforward - Unit tests and integration tests in one project | Complex - Requires mocking external services, contract testing between services |
| **Setup Time** | Fast - One project setup, one database configuration | Slow - Multiple projects, multiple databases, service discovery setup |
| **Rating** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐ Difficult |

**Monolithic Example:**
```php
// Everything in one file - easy to follow
function createEnrollment($studentId, $courseId) {
    // Direct database check - no external calls
    $student = $pdo->query("SELECT * FROM students WHERE id = $studentId");
    $course = $pdo->query("SELECT * FROM courses WHERE id = $courseId");
    // Create enrollment in same database
    $pdo->exec("INSERT INTO enrollments...");
}
```

**Microservices Example:**
```php
// Must coordinate across 3 different services
function createEnrollment($studentId, $courseId) {
    // HTTP call to Student Service (different codebase)
    $student = httpGet("http://localhost:8001/api/students/$studentId");
    // HTTP call to Course Service (different codebase)
    $course = httpGet("http://localhost:8002/api/courses/$courseId");
    // Local database insert
    $pdo->exec("INSERT INTO enrollments...");
}
```

---

### 2. Deployment Difficulty

| Aspect | Monolithic (Part A) | Microservices (Part B) |
|--------|---------------------|------------------------|
| **How it works** | The entire application is packaged and deployed as a single unit. One build, one artifact, one deployment process. All features go live together. | Each service is built and deployed independently. Requires coordinating multiple deployments, managing service versions, and ensuring compatibility. |
| **Deployment Process** | Single command: `php -S localhost:8080 -t public` | Multiple commands: Start 4 separate processes on different ports |
| **Build Complexity** | One build pipeline | Multiple build pipelines (one per service) |
| **Release Coordination** | Simple - Deploy everything at once | Complex - Must ensure service compatibility, API versioning |
| **Rollback** | Easy - Rollback entire application | Complex - Must identify which service caused the issue |
| **Infrastructure** | Single server or container | Multiple servers/containers, load balancers, service mesh |
| **Configuration** | One `.env` file | Multiple configuration files per service |
| **Rating** |  Easy |  Difficult |

**Monolithic Deployment:**
```bash
# One simple command
php -S localhost:8080 -t monolithic/public

# Or with production server
deploy-to-server.sh --app=monolithic
```

**Microservices Deployment:**
```bash
# Must start each service separately
php -S localhost:8001 -t services/student-service/public &
php -S localhost:8002 -t services/course-service/public &
php -S localhost:8003 -t services/enrollment-service/public &
php artisan serve --port=8000

# Production requires orchestration (Docker Compose, Kubernetes)
docker-compose up -d  # Manages 4+ containers
```

---

### 3. Scalability

| Aspect | Monolithic (Part A) | Microservices (Part B) |
|--------|---------------------|------------------------|
| **How it works** | The entire application scales as one unit. To handle more load, you either upgrade the server (vertical) or run multiple copies of the entire app behind a load balancer (horizontal). | Each service scales independently based on its own load. High-traffic services get more instances while low-traffic services remain minimal. |
| **Scaling Strategy** | Vertical (bigger server) or Horizontal (clone entire app) | Horizontal per-service (scale only what's needed) |
| **Resource Efficiency** | Low - Must scale entire app even if only one feature is busy | High - Scale only the busy service |
| **Database Scaling** | Bottleneck - Single database serves all features | Distributed - Each service has its own database |
| **Cost Efficiency** | Higher cost - Over-provisioning required | Lower cost - Pay only for what you need |
| **Example Scenario** | During enrollment period: Must scale entire system even though only enrollment feature is busy | During enrollment period: Scale only Enrollment Service from 1 to 10 instances |
| **Rating** | ⭐⭐ Limited | ⭐⭐⭐⭐⭐ Excellent |

**Monolithic Scaling:**
```
Before: 1 server running entire app
After:  3 servers running entire app (wasteful - Student/Course features don't need scaling)

┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Full App    │   │ Full App    │   │ Full App    │
│ (Copy 1)    │   │ (Copy 2)    │   │ (Copy 3)    │
│             │   │             │   │             │
│ - Students  │   │ - Students  │   │ - Students  │  ← Not needed
│ - Courses   │   │ - Courses   │   │ - Courses   │  ← Not needed
│ - Enroll    │   │ - Enroll    │   │ - Enroll    │  ← Only this needs scaling
└─────────────┘   └─────────────┘   └─────────────┘
```

**Microservices Scaling:**
```
Scale only what's needed:

┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Student Svc  │   │ Course Svc   │   │ Enrollment   │ x5 instances
│ (1 instance) │   │ (1 instance) │   │ Service      │
└──────────────┘   └──────────────┘   └──────────────┘
                                      └──────────────┘
                                      └──────────────┘
                                      └──────────────┘
                                      └──────────────┘
        ↑                 ↑                   ↑
    No scaling        No scaling         SCALED (5x)
```

---

### 4. Failure Impact

| Aspect | Monolithic (Part A) | Microservices (Part B) |
|--------|---------------------|------------------------|
| **How it works** | A failure in any component crashes the entire application. All features become unavailable. Users cannot access any functionality until the issue is resolved. | A failure in one service affects only that service's functionality. Other services continue operating normally. Users can still access unaffected features. |
| **Failure Scope** | Total system outage | Partial degradation |
| **Blast Radius** | 100% - All features down | ~33% - Only affected service down |
| **User Impact** | All users affected, no functionality available | Some users affected, most features still work |
| **Recovery** | Must fix and redeploy entire application | Fix and redeploy only the failed service |
| **Fault Isolation** | None - Single point of failure | Strong - Services are isolated |
| **Rating** | ⭐ High Risk | ⭐⭐⭐⭐⭐ Low Risk |

**Monolithic Failure Scenario:**
```
Bug in Course module causes crash:

┌─────────────────────────────────────────┐
│         MONOLITHIC APPLICATION          │
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Student │  │ Course  │  │ Enroll  │ │
│  │   ❌    │  │   💥    │  │   ❌    │ │
│  │  DOWN   │  │ CRASHED │  │  DOWN   │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│        ⚠️ ENTIRE SYSTEM DOWN ⚠️         │
│     All 3 features unavailable          │
└─────────────────────────────────────────┘
```

**Microservices Failure Scenario:**
```
Bug in Course Service causes crash:

┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Student Svc │   │ Course Svc  │   │ Enroll Svc  │
│             │   │             │   │             │
│    ✅       │   │    💥      │   │    ✅       │
│  RUNNING    │   │  CRASHED   │   │  RUNNING    │
│             │   │             │   │             │
│ Students    │   │ Courses     │   │ Enrollments │
│ work fine   │   │ unavailable │   │ work fine   │
└─────────────┘   └─────────────┘   └─────────────┘
       ↑                ↑                  ↑
   AVAILABLE       UNAVAILABLE        AVAILABLE

Result: Only course listing is down. Students can still
        view their enrollments and update profiles.
```

---

### 5. Performance

| Aspect | Monolithic (Part A) | Microservices (Part B) |
|--------|---------------------|------------------------|
| **How it works** | All operations happen in-memory within a single process. Database queries use efficient JOINs. No network overhead for internal communication. | Operations require network calls between services. Data aggregation needs multiple HTTP requests. JSON serialization/deserialization adds overhead. |
| **Internal Communication** | In-memory function calls (nanoseconds) | HTTP network calls (milliseconds) |
| **Data Retrieval** | Single SQL JOIN query | Multiple HTTP requests + local queries |
| **Latency** | Very Low (~5-10ms per request) | Higher (~50-200ms per request) |
| **Network Overhead** | None | Significant (serialization, HTTP, deserialization) |
| **Database Queries** | Optimized JOINs across tables | Cannot JOIN across service databases |
| **Rating** | ⭐⭐⭐⭐⭐ Fast | ⭐⭐⭐ Slower |

**Monolithic Performance (Get Enrollment with Details):**
```php
// Single query with JOINs - Very Fast (~5ms)
$sql = "SELECT e.*, s.name as student_name, c.course_code
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.id = ?";

// Timeline:
// [====] 5ms - Single DB query
// Total: ~5ms
```

**Microservices Performance (Get Enrollment with Details):**
```php
// Multiple HTTP calls - Slower (~150ms)

// 1. Get enrollment from Enrollment Service
$enrollment = httpGet("http://localhost:8003/api/enrollments/1");  // ~30ms

// 2. Get student details from Student Service
$student = httpGet("http://localhost:8001/api/students/{$enrollment['student_id']}"); // ~30ms

// 3. Get course details from Course Service
$course = httpGet("http://localhost:8002/api/courses/{$enrollment['course_id']}");   // ~30ms

// 4. Combine data
$result = array_merge($enrollment, ['student' => $student, 'course' => $course]);

// Timeline:
// [====] 30ms - Enrollment Service
// [====] 30ms - Student Service (sequential)
// [====] 30ms - Course Service (sequential)
// [==]   10ms - Data aggregation
// Total: ~100-150ms (or ~70ms if parallel)
```

---

## Summary Comparison Table

| Criteria | Monolithic (Part A) | Microservices (Part B) |
|----------|---------------------|------------------------|
| **Ease of Development** | ⭐⭐⭐⭐⭐ **Easy** - Single codebase, simple debugging, straightforward testing | ⭐⭐ **Difficult** - Multiple codebases, distributed debugging, complex testing |
| **Deployment Difficulty** | ⭐⭐⭐⭐⭐ **Easy** - Single deployment unit, one command to deploy | ⭐⭐ **Difficult** - Multiple services to deploy, requires orchestration |
| **Scalability** | ⭐⭐ **Limited** - Must scale entire app, resource wasteful | ⭐⭐⭐⭐⭐ **Excellent** - Scale individual services, cost-efficient |
| **Failure Impact** | ⭐ **High Risk** - One bug crashes entire system, total outage | ⭐⭐⭐⭐⭐ **Low Risk** - Isolated failures, graceful degradation |
| **Performance** | ⭐⭐⭐⭐⭐ **Fast** - In-memory calls, SQL JOINs, no network overhead | ⭐⭐⭐ **Slower** - Network latency, multiple HTTP calls, serialization overhead |

---

## When to Choose Each Architecture

| Choose Monolithic When... | Choose Microservices When... |
|---------------------------|------------------------------|
| Small team (< 5 developers) | Large team (15+ developers) |
| Simple domain | Complex domain with clear boundaries |
| Fast time-to-market needed | Long-term maintainability priority |
| Limited DevOps expertise | Strong DevOps/infrastructure team |
| Tight budget | Budget for infrastructure complexity |
| Performance is critical | Scalability is critical |
| Starting a new project | Evolving a mature system |
