<?php
/**
 * Part A - Monolithic Student Information System
 * Runs on port 8080
 * Single application with ONE database containing all tables
 *
 * Required Endpoints:
 * - POST /students         - Create a student
 * - GET  /courses          - List all courses
 * - POST /enrollments      - Create an enrollment
 * - GET  /enrollments/{id} - Get enrollment by ID
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection - ONE database for all tables
$dbPath = __DIR__ . '/../database/monolithic.sqlite';
$dbDir = dirname($dbPath);
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0777, true);
}

try {
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Auto-migrate: Create all tables in ONE database
$pdo->exec("CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_number VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    year_level INTEGER,
    program VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3,
    department VARCHAR(255),
    semester VARCHAR(50),
    max_students INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ENROLLED',
    grade VARCHAR(5),
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
)");

// Insert sample courses if none exist
$stmt = $pdo->query("SELECT COUNT(*) as count FROM courses");
if ($stmt->fetch()['count'] == 0) {
    $courses = [
        ['CS101', 'Introduction to Programming', 'Learn programming fundamentals', 3, 'Computer Science', 'Fall 2024'],
        ['CS102', 'Data Structures', 'Arrays, linked lists, trees, graphs', 3, 'Computer Science', 'Fall 2024'],
        ['CS201', 'Database Systems', 'Relational databases and SQL', 3, 'Computer Science', 'Spring 2025'],
        ['MATH101', 'Calculus I', 'Limits, derivatives, integrals', 4, 'Mathematics', 'Fall 2024'],
        ['ENG101', 'English Composition', 'Academic writing skills', 3, 'English', 'Fall 2024'],
    ];
    $stmt = $pdo->prepare("INSERT INTO courses (course_code, name, description, credits, department, semester) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($courses as $course) {
        $stmt->execute($course);
    }
}

// Simple router
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Parse JSON body
$body = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    // ============================================
    // STUDENTS ENDPOINTS
    // ============================================

    // GET /students - List all students
    if ($method === 'GET' && $uri === '/students') {
        $stmt = $pdo->query("SELECT * FROM students ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
        exit;
    }

    // POST /students - Create a student (REQUIRED)
    if ($method === 'POST' && $uri === '/students') {
        // Validation
        if (empty($body['name']) || empty($body['email'])) {
            http_response_code(422);
            echo json_encode(['error' => 'Name and email are required']);
            exit;
        }

        // Check unique email
        $stmt = $pdo->prepare("SELECT id FROM students WHERE email = ?");
        $stmt->execute([$body['email']]);
        if ($stmt->fetch()) {
            http_response_code(422);
            echo json_encode(['error' => 'Email already exists']);
            exit;
        }

        // Generate student number if not provided
        if (empty($body['student_number'])) {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
            $count = $stmt->fetch()['count'];
            $body['student_number'] = 'STU-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
        }

        $stmt = $pdo->prepare("INSERT INTO students (student_number, name, email, phone, address, date_of_birth, year_level, program, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $body['student_number'],
            $body['name'],
            $body['email'],
            $body['phone'] ?? null,
            $body['address'] ?? null,
            $body['date_of_birth'] ?? null,
            $body['year_level'] ?? null,
            $body['program'] ?? null,
            $body['status'] ?? 'ACTIVE',
        ]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
        $stmt->execute([$id]);

        http_response_code(201);
        echo json_encode($stmt->fetch());
        exit;
    }

    // GET /students/{id} - Get student by ID
    if (preg_match('#^/students/(\d+)$#', $uri, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$id]);
            $student = $stmt->fetch();

            if (!$student) {
                http_response_code(404);
                echo json_encode(['error' => 'Student not found']);
                exit;
            }

            echo json_encode($student);
            exit;
        }
    }

    // ============================================
    // COURSES ENDPOINTS
    // ============================================

    // GET /courses - List all courses (REQUIRED)
    if ($method === 'GET' && $uri === '/courses') {
        $stmt = $pdo->query("SELECT * FROM courses ORDER BY course_code ASC");
        echo json_encode($stmt->fetchAll());
        exit;
    }

    // POST /courses - Create a course
    if ($method === 'POST' && $uri === '/courses') {
        if (empty($body['course_code']) || empty($body['name'])) {
            http_response_code(422);
            echo json_encode(['error' => 'Course code and name are required']);
            exit;
        }

        // Check unique course_code
        $stmt = $pdo->prepare("SELECT id FROM courses WHERE course_code = ?");
        $stmt->execute([$body['course_code']]);
        if ($stmt->fetch()) {
            http_response_code(422);
            echo json_encode(['error' => 'Course code already exists']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO courses (course_code, name, description, credits, department, semester, max_students, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $body['course_code'],
            $body['name'],
            $body['description'] ?? null,
            $body['credits'] ?? 3,
            $body['department'] ?? null,
            $body['semester'] ?? null,
            $body['max_students'] ?? 30,
            $body['status'] ?? 'ACTIVE',
        ]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
        $stmt->execute([$id]);

        http_response_code(201);
        echo json_encode($stmt->fetch());
        exit;
    }

    // GET /courses/{id} - Get course by ID
    if (preg_match('#^/courses/(\d+)$#', $uri, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$id]);
            $course = $stmt->fetch();

            if (!$course) {
                http_response_code(404);
                echo json_encode(['error' => 'Course not found']);
                exit;
            }

            echo json_encode($course);
            exit;
        }
    }

    // ============================================
    // ENROLLMENTS ENDPOINTS
    // ============================================

    // GET /enrollments - List all enrollments
    if ($method === 'GET' && $uri === '/enrollments') {
        $stmt = $pdo->query("
            SELECT
                e.*,
                s.name as student_name,
                s.student_number,
                s.email as student_email,
                c.course_code,
                c.name as course_name
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN courses c ON e.course_id = c.id
            ORDER BY e.created_at DESC
        ");
        echo json_encode($stmt->fetchAll());
        exit;
    }

    // POST /enrollments - Create an enrollment (REQUIRED)
    if ($method === 'POST' && $uri === '/enrollments') {
        // Validation
        if (empty($body['student_id']) || empty($body['course_id'])) {
            http_response_code(422);
            echo json_encode(['error' => 'student_id and course_id are required']);
            exit;
        }

        // Verify student exists
        $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
        $stmt->execute([$body['student_id']]);
        $student = $stmt->fetch();
        if (!$student) {
            http_response_code(404);
            echo json_encode(['error' => 'Student not found']);
            exit;
        }

        // Verify course exists
        $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
        $stmt->execute([$body['course_id']]);
        $course = $stmt->fetch();
        if (!$course) {
            http_response_code(404);
            echo json_encode(['error' => 'Course not found']);
            exit;
        }

        // Check if already enrolled
        $stmt = $pdo->prepare("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?");
        $stmt->execute([$body['student_id'], $body['course_id']]);
        if ($stmt->fetch()) {
            http_response_code(422);
            echo json_encode(['error' => 'Student is already enrolled in this course']);
            exit;
        }

        // Create enrollment
        $stmt = $pdo->prepare("INSERT INTO enrollments (student_id, course_id, enrollment_date, status, remarks) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $body['student_id'],
            $body['course_id'],
            $body['enrollment_date'] ?? date('Y-m-d'),
            $body['status'] ?? 'ENROLLED',
            $body['remarks'] ?? null,
        ]);

        $id = $pdo->lastInsertId();

        // Return enrollment with student and course details
        $stmt = $pdo->prepare("
            SELECT
                e.*,
                s.name as student_name,
                s.student_number,
                s.email as student_email,
                c.course_code,
                c.name as course_name
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.id = ?
        ");
        $stmt->execute([$id]);

        http_response_code(201);
        echo json_encode($stmt->fetch());
        exit;
    }

    // GET /enrollments/{id} - Get enrollment by ID (REQUIRED)
    if (preg_match('#^/enrollments/(\d+)$#', $uri, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'GET') {
            $stmt = $pdo->prepare("
                SELECT
                    e.*,
                    s.name as student_name,
                    s.student_number,
                    s.email as student_email,
                    c.course_code,
                    c.name as course_name
                FROM enrollments e
                JOIN students s ON e.student_id = s.id
                JOIN courses c ON e.course_id = c.id
                WHERE e.id = ?
            ");
            $stmt->execute([$id]);
            $enrollment = $stmt->fetch();

            if (!$enrollment) {
                http_response_code(404);
                echo json_encode(['error' => 'Enrollment not found']);
                exit;
            }

            echo json_encode($enrollment);
            exit;
        }
    }

    // ============================================
    // HEALTH CHECK
    // ============================================
    if ($method === 'GET' && ($uri === '/health' || $uri === '/' || $uri === '')) {
        $studentCount = $pdo->query("SELECT COUNT(*) as count FROM students")->fetch()['count'];
        $courseCount = $pdo->query("SELECT COUNT(*) as count FROM courses")->fetch()['count'];
        $enrollmentCount = $pdo->query("SELECT COUNT(*) as count FROM enrollments")->fetch()['count'];

        echo json_encode([
            'service' => 'Monolithic Student Information System (Part A)',
            'status' => 'running',
            'port' => 8080,
            'database' => 'monolithic.sqlite (ONE database)',
            'statistics' => [
                'students' => $studentCount,
                'courses' => $courseCount,
                'enrollments' => $enrollmentCount,
            ],
            'endpoints' => [
                'POST /students' => 'Create a student',
                'GET /courses' => 'List all courses',
                'POST /enrollments' => 'Create an enrollment',
                'GET /enrollments/{id}' => 'Get enrollment by ID',
            ],
        ]);
        exit;
    }

    // 404 Not Found
    http_response_code(404);
    echo json_encode(['error' => 'Route not found', 'method' => $method, 'uri' => $uri]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
