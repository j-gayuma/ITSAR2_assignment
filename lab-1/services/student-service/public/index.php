<?php
/**
 * Student Microservice
 * Runs on port 8001
 * Manages student records with its own SQLite database
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
$dbPath = __DIR__ . '/../database/student_service.sqlite';
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

// Auto-migrate on first run
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

// Simple router
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Parse JSON body
$body = json_decode(file_get_contents('php://input'), true) ?? [];

/**
 * Routes:
 * GET    /api/students          - List all students
 * GET    /api/students/count    - Count students
 * GET    /api/students/active/count - Count active students
 * POST   /api/students          - Create student
 * GET    /api/students/{id}     - Get student by ID
 * PUT    /api/students/{id}     - Update student
 * DELETE /api/students/{id}     - Delete student
 */

try {
    // GET /api/students/count
    if ($method === 'GET' && $uri === '/api/students/count') {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
        echo json_encode($stmt->fetch());
        exit;
    }

    // GET /api/students/active/count
    if ($method === 'GET' && $uri === '/api/students/active/count') {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM students WHERE status = ?");
        $stmt->execute(['ACTIVE']);
        echo json_encode($stmt->fetch());
        exit;
    }

    // GET /api/students
    if ($method === 'GET' && $uri === '/api/students') {
        $stmt = $pdo->query("SELECT * FROM students ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
        exit;
    }

    // POST /api/students
    if ($method === 'POST' && $uri === '/api/students') {
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

    // Match /api/students/{id}
    if (preg_match('#^/api/students/(\d+)$#', $uri, $matches)) {
        $id = (int) $matches[1];

        // GET /api/students/{id}
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

        // PUT /api/students/{id}
        if ($method === 'PUT') {
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$id]);
            $student = $stmt->fetch();

            if (!$student) {
                http_response_code(404);
                echo json_encode(['error' => 'Student not found']);
                exit;
            }

            $fields = [];
            $values = [];
            $allowed = ['name', 'email', 'phone', 'address', 'date_of_birth', 'year_level', 'program', 'status', 'student_number'];

            foreach ($allowed as $field) {
                if (array_key_exists($field, $body)) {
                    $fields[] = "$field = ?";
                    $values[] = $body[$field];
                }
            }

            if (!empty($fields)) {
                $fields[] = "updated_at = CURRENT_TIMESTAMP";
                $values[] = $id;
                $sql = "UPDATE students SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($values);
            }

            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
            exit;
        }

        // DELETE /api/students/{id}
        if ($method === 'DELETE') {
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Student not found']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['message' => 'Student deleted successfully']);
            exit;
        }
    }

    // Health check
    if ($method === 'GET' && ($uri === '/api/health' || $uri === '')) {
        echo json_encode([
            'service' => 'Student Service',
            'status' => 'running',
            'port' => 8001,
            'database' => 'student_service.sqlite',
        ]);
        exit;
    }

    // 404
    http_response_code(404);
    echo json_encode(['error' => 'Route not found', 'method' => $method, 'uri' => $uri]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
