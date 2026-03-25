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
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
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

    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        return null;
    }
    return json_decode($response, true);
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
            http_response_code(422);
            echo json_encode(['error' => 'student_id and course_id are required']);
            exit;
        }

        // Verify student exists via Student Service
        $student = httpGet(STUDENT_SERVICE_URL . '/api/students/' . $body['student_id']);
        if (!$student || isset($student['error'])) {
            http_response_code(422);
            echo json_encode(['error' => 'Student not found in Student Service']);
            exit;
        }

        // Verify course exists via Course Service
        $course = httpGet(COURSE_SERVICE_URL . '/api/courses/' . $body['course_id']);
        if (!$course || isset($course['error'])) {
            http_response_code(422);
            echo json_encode(['error' => 'Course not found in Course Service']);
            exit;
        }

        // Check duplicate enrollment
        $stmt = $pdo->prepare("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?");
        $stmt->execute([$body['student_id'], $body['course_id']]);
        if ($stmt->fetch()) {
            http_response_code(422);
            echo json_encode(['error' => 'Student is already enrolled in this course']);
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
                echo json_encode(['error' => 'Enrollment not found']);
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
                echo json_encode(['error' => 'Enrollment not found']);
                exit;
            }

            if (!empty($body['status'])) {
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
                echo json_encode(['error' => 'Enrollment not found']);
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
            http_response_code(422);
            echo json_encode(['error' => 'enrollment_id and grade are required']);
            exit;
        }

        // Check enrollment exists
        $stmt = $pdo->prepare("SELECT id FROM enrollments WHERE id = ?");
        $stmt->execute([$body['enrollment_id']]);
        if (!$stmt->fetch()) {
            http_response_code(422);
            echo json_encode(['error' => 'Enrollment not found']);
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
            http_response_code(422);
            echo json_encode(['error' => 'course_id, date, and records are required']);
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
    echo json_encode(['error' => 'Route not found', 'method' => $method, 'uri' => $uri]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
