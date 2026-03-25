<?php
/**
 * Enrollment Microservice
 * Runs on port 8003
 * Manages enrollments, grades, and attendance with its own SQLite database
 * Communicates with Student Service (8001) and Course Service (8002) via HTTP
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Service URLs
define('STUDENT_SERVICE_URL', 'http://localhost:8001');
define('COURSE_SERVICE_URL', 'http://localhost:8002');

// Database connection
$dbPath = __DIR__ . '/../database/enrollment_service.sqlite';
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
    echo json_encode(['error' => 'DATABASE_ERROR', 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Auto-migrate
$pdo->exec("CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'ENROLLED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL UNIQUE,
    grade DECIMAL(3,2),
    remarks VARCHAR(255),
    semester VARCHAR(20) DEFAULT '1st',
    academic_year VARCHAR(20) DEFAULT '2025-2026',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PRESENT',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    UNIQUE(enrollment_id, date)
)");

/**
 * HTTP Client helper - calls other microservices
 * Returns array with data on success, or array with '_service_error' key on failure
 */
function httpGet(string $url): ?array {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Accept: application/json\r\n",
            'timeout' => 5,
            'ignore_errors' => true,
        ]
    ]);

    $startTime = microtime(true);
    $response = @file_get_contents($url, false, $context);
    $elapsed = microtime(true) - $startTime;

    if ($response === false) {
        // Service is down or unreachable
        return ['_service_error' => 'unavailable', '_url' => $url];
    }

    // Check if it timed out (took nearly the full timeout period)
    if ($elapsed >= 4.5) {
        return ['_service_error' => 'timeout', '_url' => $url];
    }

    // Check HTTP status code from response headers
    if (isset($http_response_header)) {
        $statusLine = $http_response_header[0] ?? '';
        if (preg_match('/\s(\d{3})\s/', $statusLine, $m)) {
            $statusCode = (int)$m[1];
            if ($statusCode === 404) {
                return ['_service_error' => 'not_found', '_url' => $url];
            }
        }
    }

    return json_decode($response, true);
}

/**
 * Check if a dependency service is reachable, returns error response or null
 */
function checkServiceHealth(string $serviceName, string $serviceUrl): ?array {
    $result = httpGet($serviceUrl . '/api/health');
    if ($result === null || (isset($result['_service_error']) && $result['_service_error'] === 'unavailable')) {
        return ['code' => 503, 'error' => 'SERVICE_UNAVAILABLE', 'message' => $serviceName . ' is currently unavailable'];
    }
    if (isset($result['_service_error']) && $result['_service_error'] === 'timeout') {
        return ['code' => 504, 'error' => 'GATEWAY_TIMEOUT', 'message' => $serviceName . ' did not respond in time'];
    }
    return null;
}

/**
 * Enrich enrollment with student and course data from other services
 */
function enrichEnrollment(array $enrollment): array {
    $student = httpGet(STUDENT_SERVICE_URL . '/api/students/' . $enrollment['student_id']);
    $course = httpGet(COURSE_SERVICE_URL . '/api/courses/' . $enrollment['course_id']);

    $enrollment['student'] = $student;
    $enrollment['course'] = $course;

    return $enrollment;
}

/**
 * Get letter grade from numeric grade
 */
function getLetterGrade(?float $grade): string {
    if ($grade === null) return 'N/A';
    if ($grade >= 1.0 && $grade <= 1.25) return 'Excellent';
    if ($grade <= 1.50) return 'Very Good';
    if ($grade <= 1.75) return 'Good';
    if ($grade <= 2.00) return 'Very Satisfactory';
    if ($grade <= 2.25) return 'Satisfactory';
    if ($grade <= 2.50) return 'Fairly Satisfactory';
    if ($grade <= 2.75) return 'Fair';
    if ($grade <= 3.00) return 'Passed';
    return 'Failed';
}

// Simple router
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');
$body = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    // ===================== ENROLLMENT ROUTES =====================

    // GET /api/enrollments/count
    if ($method === 'GET' && $uri === '/api/enrollments/count') {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM enrollments");
        echo json_encode($stmt->fetch());
        exit;
    }

    // GET /api/enrollments/recent
    if ($method === 'GET' && $uri === '/api/enrollments/recent') {
        $limit = $_GET['limit'] ?? 5;
        $stmt = $pdo->prepare("SELECT * FROM enrollments ORDER BY created_at DESC LIMIT ?");
        $stmt->execute([(int)$limit]);
        $enrollments = $stmt->fetchAll();

        foreach ($enrollments as &$enrollment) {
            $enrollment = enrichEnrollment($enrollment);
        }

        echo json_encode($enrollments);
        exit;
    }

    // GET /api/enrollments/by-student/{studentId}
    if (preg_match('#^/api/enrollments/by-student/(\d+)$#', $uri, $matches)) {
        $studentId = (int) $matches[1];

        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT e.*, g.grade, g.remarks as grade_remarks, g.semester, g.academic_year
                FROM enrollments e
                LEFT JOIN grades g ON g.enrollment_id = e.id
                WHERE e.student_id = ?
                ORDER BY e.created_at DESC");
            $stmt->execute([$studentId]);
            $enrollments = $stmt->fetchAll();

            foreach ($enrollments as &$enrollment) {
                // Get course data from Course Service
                $course = httpGet(COURSE_SERVICE_URL . '/api/courses/' . $enrollment['course_id']);
                $enrollment['course'] = $course;

                // Get grade for this enrollment
                $gradeStmt = $pdo->prepare("SELECT * FROM grades WHERE enrollment_id = ?");
                $gradeStmt->execute([$enrollment['id']]);
                $grade = $gradeStmt->fetch();
                if ($grade) {
                    $grade['letter_grade'] = getLetterGrade($grade['grade'] !== null ? (float)$grade['grade'] : null);
                }
                $enrollment['grade'] = $grade;

                // Get attendances for this enrollment
                $attStmt = $pdo->prepare("SELECT * FROM attendances WHERE enrollment_id = ? ORDER BY date DESC");
                $attStmt->execute([$enrollment['id']]);
                $enrollment['attendances'] = $attStmt->fetchAll();
            }

            echo json_encode($enrollments);
            exit;
        }
    }

    // GET /api/enrollments/by-course/{courseId}
    if (preg_match('#^/api/enrollments/by-course/(\d+)$#', $uri, $matches)) {
        $courseId = (int) $matches[1];

        if ($method === 'GET') {
            $status = $_GET['status'] ?? null;
            $sql = "SELECT * FROM enrollments WHERE course_id = ?";
            $params = [$courseId];

            if ($status) {
                $sql .= " AND status = ?";
                $params[] = $status;
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $enrollments = $stmt->fetchAll();

            foreach ($enrollments as &$enrollment) {
                $student = httpGet(STUDENT_SERVICE_URL . '/api/students/' . $enrollment['student_id']);
                $enrollment['student'] = $student;
            }

            echo json_encode($enrollments);
            exit;
        }
    }

    // GET /api/enrollments
    if ($method === 'GET' && $uri === '/api/enrollments') {
        $stmt = $pdo->query("SELECT * FROM enrollments ORDER BY created_at DESC");
        $enrollments = $stmt->fetchAll();

        foreach ($enrollments as &$enrollment) {
            $enrollment = enrichEnrollment($enrollment);
        }

        echo json_encode($enrollments);
        exit;
    }

    // POST /api/enrollments
    if ($method === 'POST' && $uri === '/api/enrollments') {
        if (empty($body['student_id']) || empty($body['course_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'student_id and course_id are required']);
            exit;
        }

        if (!is_numeric($body['student_id']) || !is_numeric($body['course_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'student_id and course_id must be numeric']);
            exit;
        }

        // Verify student exists via Student Service (handles 503/504)
        $student = httpGet(STUDENT_SERVICE_URL . '/api/students/' . $body['student_id']);
        if ($student === null || (isset($student['_service_error']) && $student['_service_error'] === 'unavailable')) {
            http_response_code(503);
            echo json_encode(['error' => 'SERVICE_UNAVAILABLE', 'message' => 'Student Service is currently unavailable']);
            exit;
        }
        if (isset($student['_service_error']) && $student['_service_error'] === 'timeout') {
            http_response_code(504);
            echo json_encode(['error' => 'GATEWAY_TIMEOUT', 'message' => 'Student Service did not respond in time']);
            exit;
        }
        if (isset($student['_service_error']) && $student['_service_error'] === 'not_found') {
            http_response_code(404);
            echo json_encode(['error' => 'STUDENT_NOT_FOUND', 'message' => 'Student with ID ' . $body['student_id'] . ' not found']);
            exit;
        }
        if (isset($student['error'])) {
            http_response_code(404);
            echo json_encode(['error' => 'STUDENT_NOT_FOUND', 'message' => 'Student not found in Student Service']);
            exit;
        }

        // Verify course exists via Course Service (handles 503/504)
        $course = httpGet(COURSE_SERVICE_URL . '/api/courses/' . $body['course_id']);
        if ($course === null || (isset($course['_service_error']) && $course['_service_error'] === 'unavailable')) {
            http_response_code(503);
            echo json_encode(['error' => 'SERVICE_UNAVAILABLE', 'message' => 'Course Service is currently unavailable']);
            exit;
        }
        if (isset($course['_service_error']) && $course['_service_error'] === 'timeout') {
            http_response_code(504);
            echo json_encode(['error' => 'GATEWAY_TIMEOUT', 'message' => 'Course Service did not respond in time']);
            exit;
        }
        if (isset($course['_service_error']) && $course['_service_error'] === 'not_found') {
            http_response_code(404);
            echo json_encode(['error' => 'COURSE_NOT_FOUND', 'message' => 'Course with ID ' . $body['course_id'] . ' not found']);
            exit;
        }
        if (isset($course['error'])) {
            http_response_code(404);
            echo json_encode(['error' => 'COURSE_NOT_FOUND', 'message' => 'Course not found in Course Service']);
            exit;
        }

        // Check duplicate enrollment - 409 Conflict
        $stmt = $pdo->prepare("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?");
        $stmt->execute([$body['student_id'], $body['course_id']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'DUPLICATE_ENROLLMENT', 'message' => 'Student is already enrolled in this course']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, ?)");
        $stmt->execute([
            $body['student_id'],
            $body['course_id'],
            $body['status'] ?? 'ENROLLED',
        ]);

        $id = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM enrollments WHERE id = ?");
        $stmt->execute([$id]);
        $enrollment = $stmt->fetch();
        $enrollment = enrichEnrollment($enrollment);

        http_response_code(201);
        echo json_encode($enrollment);
        exit;
    }

    // Match /api/enrollments/{id}
    if (preg_match('#^/api/enrollments/(\d+)$#', $uri, $matches)) {
        $id = (int) $matches[1];

        // GET /api/enrollments/{id}
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM enrollments WHERE id = ?");
            $stmt->execute([$id]);
            $enrollment = $stmt->fetch();

            if (!$enrollment) {
                http_response_code(404);
                echo json_encode(['error' => 'ENROLLMENT_NOT_FOUND', 'message' => 'Enrollment with ID ' . $id . ' not found']);
                exit;
            }

            $enrollment = enrichEnrollment($enrollment);
            echo json_encode($enrollment);
            exit;
        }

        // PUT /api/enrollments/{id}
        if ($method === 'PUT') {
            $stmt = $pdo->prepare("SELECT * FROM enrollments WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'ENROLLMENT_NOT_FOUND', 'message' => 'Enrollment with ID ' . $id . ' not found']);
                exit;
            }

            if (!empty($body['status'])) {
                $validStatuses = ['ENROLLED', 'DROPPED', 'COMPLETED'];
                if (!in_array($body['status'], $validStatuses)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'Invalid status. Must be one of: ' . implode(', ', $validStatuses)]);
                    exit;
                }
                $stmt = $pdo->prepare("UPDATE enrollments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmt->execute([$body['status'], $id]);
            }

            $stmt = $pdo->prepare("SELECT * FROM enrollments WHERE id = ?");
            $stmt->execute([$id]);
            $enrollment = $stmt->fetch();
            $enrollment = enrichEnrollment($enrollment);

            echo json_encode($enrollment);
            exit;
        }

        // DELETE /api/enrollments/{id}
        if ($method === 'DELETE') {
            $stmt = $pdo->prepare("SELECT * FROM enrollments WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'ENROLLMENT_NOT_FOUND', 'message' => 'Enrollment with ID ' . $id . ' not found']);
                exit;
            }

            $pdo->prepare("DELETE FROM attendances WHERE enrollment_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM grades WHERE enrollment_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM enrollments WHERE id = ?")->execute([$id]);

            echo json_encode(['message' => 'Enrollment deleted successfully']);
            exit;
        }
    }

    // ===================== GRADE ROUTES =====================

    // GET /api/grades
    if ($method === 'GET' && $uri === '/api/grades') {
        $stmt = $pdo->query("SELECT e.*, g.id as grade_id, g.grade, g.remarks as grade_remarks, g.semester, g.academic_year
            FROM enrollments e
            LEFT JOIN grades g ON g.enrollment_id = e.id
            ORDER BY e.created_at DESC");
        $enrollments = $stmt->fetchAll();

        foreach ($enrollments as &$enrollment) {
            $enrollment = enrichEnrollment($enrollment);
            if ($enrollment['grade'] !== null) {
                $enrollment['letter_grade'] = getLetterGrade((float)$enrollment['grade']);
            }
        }

        echo json_encode($enrollments);
        exit;
    }

    // GET /api/grades/stats
    if ($method === 'GET' && $uri === '/api/grades/stats') {
        $stmt = $pdo->query("SELECT grade FROM grades WHERE grade IS NOT NULL");
        $grades = $stmt->fetchAll();

        $total = count($grades);
        $avg = 0;
        $passed = 0;
        $failed = 0;

        if ($total > 0) {
            $sum = array_sum(array_column($grades, 'grade'));
            $avg = round($sum / $total, 2);
            $passed = count(array_filter($grades, fn($g) => (float)$g['grade'] <= 3.00));
            $failed = count(array_filter($grades, fn($g) => (float)$g['grade'] > 3.00));
        }

        echo json_encode([
            'averageGpa' => $total > 0 ? $avg : null,
            'passedCount' => $passed,
            'failedCount' => $failed,
            'totalGraded' => $total,
        ]);
        exit;
    }

    // POST /api/grades
    if ($method === 'POST' && $uri === '/api/grades') {
        if (empty($body['enrollment_id']) || !isset($body['grade'])) {
            http_response_code(400);
            echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'enrollment_id and grade are required']);
            exit;
        }

        // Validate grade range (Philippine grading: 1.00 to 5.00)
        $gradeVal = (float)$body['grade'];
        if ($gradeVal < 1.0 || $gradeVal > 5.0) {
            http_response_code(400);
            echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'Grade must be between 1.00 and 5.00']);
            exit;
        }

        // Check enrollment exists
        $stmt = $pdo->prepare("SELECT id FROM enrollments WHERE id = ?");
        $stmt->execute([$body['enrollment_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'ENROLLMENT_NOT_FOUND', 'message' => 'Enrollment with ID ' . $body['enrollment_id'] . ' not found']);
            exit;
        }

        // Upsert grade
        $stmt = $pdo->prepare("SELECT id FROM grades WHERE enrollment_id = ?");
        $stmt->execute([$body['enrollment_id']]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE grades SET grade = ?, remarks = ?, semester = ?, academic_year = ?, updated_at = CURRENT_TIMESTAMP WHERE enrollment_id = ?");
            $stmt->execute([
                $body['grade'],
                $body['remarks'] ?? null,
                $body['semester'] ?? '1st',
                $body['academic_year'] ?? '2025-2026',
                $body['enrollment_id'],
            ]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO grades (enrollment_id, grade, remarks, semester, academic_year) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $body['enrollment_id'],
                $body['grade'],
                $body['remarks'] ?? null,
                $body['semester'] ?? '1st',
                $body['academic_year'] ?? '2025-2026',
            ]);
        }

        echo json_encode(['message' => 'Grade saved successfully']);
        exit;
    }

    // ===================== ATTENDANCE ROUTES =====================

    // GET /api/attendance
    if ($method === 'GET' && $uri === '/api/attendance') {
        $limit = $_GET['limit'] ?? 50;
        $stmt = $pdo->prepare("SELECT a.*, e.student_id, e.course_id
            FROM attendances a
            JOIN enrollments e ON e.id = a.enrollment_id
            ORDER BY a.created_at DESC
            LIMIT ?");
        $stmt->execute([(int)$limit]);
        $records = $stmt->fetchAll();

        foreach ($records as &$record) {
            $record['student'] = httpGet(STUDENT_SERVICE_URL . '/api/students/' . $record['student_id']);
            $record['course'] = httpGet(COURSE_SERVICE_URL . '/api/courses/' . $record['course_id']);
        }

        echo json_encode($records);
        exit;
    }

    // GET /api/attendance/today
    if ($method === 'GET' && $uri === '/api/attendance/today') {
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM attendances WHERE date = ? GROUP BY status");
        $stmt->execute([$today]);
        $results = $stmt->fetchAll();

        $summary = ['present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0];
        foreach ($results as $row) {
            $summary[strtolower($row['status'])] = (int) $row['count'];
        }

        echo json_encode($summary);
        exit;
    }

    // GET /api/attendance/student/{studentId}
    if (preg_match('#^/api/attendance/student/(\d+)$#', $uri, $matches)) {
        $studentId = (int) $matches[1];

        if ($method === 'GET') {
            $stmt = $pdo->prepare("
                SELECT a.status, COUNT(*) as count
                FROM attendances a
                JOIN enrollments e ON e.id = a.enrollment_id
                WHERE e.student_id = ?
                GROUP BY a.status
            ");
            $stmt->execute([$studentId]);
            $results = $stmt->fetchAll();

            $totalStmt = $pdo->prepare("
                SELECT COUNT(*) as total
                FROM attendances a
                JOIN enrollments e ON e.id = a.enrollment_id
                WHERE e.student_id = ?
            ");
            $totalStmt->execute([$studentId]);
            $total = (int) $totalStmt->fetch()['total'];

            $summary = ['total' => $total, 'present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0, 'rate' => 0];
            foreach ($results as $row) {
                $summary[strtolower($row['status'])] = (int) $row['count'];
            }

            if ($total > 0) {
                $summary['rate'] = round(($summary['present'] + $summary['late']) / $total * 100, 1);
            }

            echo json_encode($summary);
            exit;
        }
    }

    // POST /api/attendance
    if ($method === 'POST' && $uri === '/api/attendance') {
        if (empty($body['course_id']) || empty($body['date']) || empty($body['records'])) {
            http_response_code(400);
            echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'course_id, date, and records are required']);
            exit;
        }

        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $body['date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'Invalid date format. Use YYYY-MM-DD']);
            exit;
        }

        // Validate records is an array
        if (!is_array($body['records'])) {
            http_response_code(400);
            echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'records must be an array']);
            exit;
        }

        foreach ($body['records'] as $record) {
            $stmt = $pdo->prepare("INSERT INTO attendances (enrollment_id, date, status, remarks)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (enrollment_id, date) DO UPDATE SET
                    status = excluded.status,
                    remarks = excluded.remarks,
                    updated_at = CURRENT_TIMESTAMP");
            $stmt->execute([
                $record['enrollment_id'],
                $body['date'],
                $record['status'],
                $record['remarks'] ?? null,
            ]);
        }

        echo json_encode(['message' => 'Attendance recorded successfully']);
        exit;
    }

    // ===================== GPA ROUTE =====================

    // GET /api/gpa/student/{studentId}
    if (preg_match('#^/api/gpa/student/(\d+)$#', $uri, $matches)) {
        $studentId = (int) $matches[1];

        if ($method === 'GET') {
            $stmt = $pdo->prepare("
                SELECT g.grade, e.course_id
                FROM grades g
                JOIN enrollments e ON e.id = g.enrollment_id
                WHERE e.student_id = ? AND g.grade IS NOT NULL
            ");
            $stmt->execute([$studentId]);
            $grades = $stmt->fetchAll();

            if (empty($grades)) {
                echo json_encode(['gpa' => null]);
                exit;
            }

            $totalPoints = 0;
            $totalUnits = 0;
            foreach ($grades as $gradeRow) {
                $course = httpGet(COURSE_SERVICE_URL . '/api/courses/' . $gradeRow['course_id']);
                $units = $course['units'] ?? 3;
                $totalPoints += (float)$gradeRow['grade'] * $units;
                $totalUnits += $units;
            }

            $gpa = $totalUnits > 0 ? round($totalPoints / $totalUnits, 2) : null;
            echo json_encode(['gpa' => $gpa]);
            exit;
        }
    }

    // ===================== COURSE ENROLLMENT COUNT =====================

    // GET /api/enrollments/course-counts
    if ($method === 'GET' && $uri === '/api/enrollments/course-counts') {
        $stmt = $pdo->query("SELECT course_id, COUNT(*) as enrollment_count FROM enrollments GROUP BY course_id ORDER BY enrollment_count DESC LIMIT 5");
        $counts = $stmt->fetchAll();

        foreach ($counts as &$count) {
            $course = httpGet(COURSE_SERVICE_URL . '/api/courses/' . $count['course_id']);
            $count['course_code'] = $course['code'] ?? 'N/A';
            $count['course_name'] = $course['name'] ?? 'N/A';
        }

        echo json_encode($counts);
        exit;
    }

    // Health check
    if ($method === 'GET' && ($uri === '/api/health' || $uri === '')) {
        echo json_encode([
            'service' => 'Enrollment Service',
            'status' => 'running',
            'port' => 8003,
            'database' => 'enrollment_service.sqlite',
            'depends_on' => [
                'Student Service' => STUDENT_SERVICE_URL,
                'Course Service' => COURSE_SERVICE_URL,
            ],
        ]);
        exit;
    }

    // 404
    http_response_code(404);
    echo json_encode(['error' => 'ROUTE_NOT_FOUND', 'message' => 'The requested route was not found', 'method' => $method, 'uri' => $uri]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'INTERNAL_ERROR', 'message' => 'Internal server error: ' . $e->getMessage()]);
}
