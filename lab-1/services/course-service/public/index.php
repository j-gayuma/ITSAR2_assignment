<?php
/**
 * Course Microservice
 * Runs on port 8002
 * Manages course records and prerequisites with its own SQLite database
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
$dbPath = __DIR__ . '/../database/course_service.sqlite';
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
$pdo->exec("CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    units INTEGER DEFAULT 3,
    schedule_day VARCHAR(20),
    schedule_time VARCHAR(50),
    room VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS course_prerequisite (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    prerequisite_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(course_id, prerequisite_id)
)");

// Simple router
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');
$body = json_decode(file_get_contents('php://input'), true) ?? [];

/**
 * Helper: Get prerequisites for a course
 */
function getPrerequisites(PDO $pdo, int $courseId): array {
    $stmt = $pdo->prepare("
        SELECT c.* FROM courses c
        JOIN course_prerequisite cp ON cp.prerequisite_id = c.id
        WHERE cp.course_id = ?
    ");
    $stmt->execute([$courseId]);
    return $stmt->fetchAll();
}

/**
 * Helper: Get courses that require this course
 */
function getRequiredBy(PDO $pdo, int $courseId): array {
    $stmt = $pdo->prepare("
        SELECT c.* FROM courses c
        JOIN course_prerequisite cp ON cp.course_id = c.id
        WHERE cp.prerequisite_id = ?
    ");
    $stmt->execute([$courseId]);
    return $stmt->fetchAll();
}

try {
    // GET /api/courses/count
    if ($method === 'GET' && $uri === '/api/courses/count') {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM courses");
        echo json_encode($stmt->fetch());
        exit;
    }

    // GET /api/courses
    if ($method === 'GET' && $uri === '/api/courses') {
        $stmt = $pdo->query("SELECT * FROM courses ORDER BY created_at DESC");
        $courses = $stmt->fetchAll();

        // Attach prerequisites to each course
        foreach ($courses as &$course) {
            $course['prerequisites'] = getPrerequisites($pdo, $course['id']);
        }

        echo json_encode($courses);
        exit;
    }

    // POST /api/courses
    if ($method === 'POST' && $uri === '/api/courses') {
        if (empty($body['name']) || empty($body['code'])) {
            http_response_code(422);
            echo json_encode(['error' => 'Name and code are required']);
            exit;
        }

        // Check unique code
        $stmt = $pdo->prepare("SELECT id FROM courses WHERE code = ?");
        $stmt->execute([$body['code']]);
        if ($stmt->fetch()) {
            http_response_code(422);
            echo json_encode(['error' => 'Course code already exists']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO courses (name, code, description, units, schedule_day, schedule_time, room) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $body['name'],
            $body['code'],
            $body['description'] ?? null,
            $body['units'] ?? 3,
            $body['schedule_day'] ?? null,
            $body['schedule_time'] ?? null,
            $body['room'] ?? null,
        ]);

        $id = $pdo->lastInsertId();

        // Attach prerequisites
        if (!empty($body['prerequisite_ids'])) {
            $prereqStmt = $pdo->prepare("INSERT INTO course_prerequisite (course_id, prerequisite_id) VALUES (?, ?)");
            foreach ($body['prerequisite_ids'] as $prereqId) {
                $prereqStmt->execute([$id, $prereqId]);
            }
        }

        $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
        $stmt->execute([$id]);
        $course = $stmt->fetch();
        $course['prerequisites'] = getPrerequisites($pdo, $id);

        http_response_code(201);
        echo json_encode($course);
        exit;
    }

    // Match /api/courses/{id}
    if (preg_match('#^/api/courses/(\d+)$#', $uri, $matches)) {
        $id = (int) $matches[1];

        // GET /api/courses/{id}
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$id]);
            $course = $stmt->fetch();

            if (!$course) {
                http_response_code(404);
                echo json_encode(['error' => 'Course not found']);
                exit;
            }

            $course['prerequisites'] = getPrerequisites($pdo, $id);
            $course['required_by'] = getRequiredBy($pdo, $id);

            echo json_encode($course);
            exit;
        }

        // PUT /api/courses/{id}
        if ($method === 'PUT') {
            $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Course not found']);
                exit;
            }

            $fields = [];
            $values = [];
            $allowed = ['name', 'code', 'description', 'units', 'schedule_day', 'schedule_time', 'room'];

            foreach ($allowed as $field) {
                if (array_key_exists($field, $body)) {
                    $fields[] = "$field = ?";
                    $values[] = $body[$field];
                }
            }

            if (!empty($fields)) {
                $fields[] = "updated_at = CURRENT_TIMESTAMP";
                $values[] = $id;
                $sql = "UPDATE courses SET " . implode(', ', $fields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($values);
            }

            // Sync prerequisites
            if (array_key_exists('prerequisite_ids', $body)) {
                $pdo->prepare("DELETE FROM course_prerequisite WHERE course_id = ?")->execute([$id]);
                if (!empty($body['prerequisite_ids'])) {
                    $prereqStmt = $pdo->prepare("INSERT INTO course_prerequisite (course_id, prerequisite_id) VALUES (?, ?)");
                    foreach ($body['prerequisite_ids'] as $prereqId) {
                        $prereqStmt->execute([$id, $prereqId]);
                    }
                }
            }

            $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$id]);
            $course = $stmt->fetch();
            $course['prerequisites'] = getPrerequisites($pdo, $id);

            echo json_encode($course);
            exit;
        }

        // DELETE /api/courses/{id}
        if ($method === 'DELETE') {
            $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Course not found']);
                exit;
            }

            $pdo->prepare("DELETE FROM course_prerequisite WHERE course_id = ? OR prerequisite_id = ?")->execute([$id, $id]);
            $pdo->prepare("DELETE FROM courses WHERE id = ?")->execute([$id]);

            echo json_encode(['message' => 'Course deleted successfully']);
            exit;
        }
    }

    // Health check
    if ($method === 'GET' && ($uri === '/api/health' || $uri === '')) {
        echo json_encode([
            'service' => 'Course Service',
            'status' => 'running',
            'port' => 8002,
            'database' => 'course_service.sqlite',
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
