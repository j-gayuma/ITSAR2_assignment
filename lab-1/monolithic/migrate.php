<?php
/**
 * Part A - Monolithic Database Migration
 * Creates ONE database with all tables: students, courses, enrollments
 */

echo "=== Part A - Monolithic Database Migration ===\n\n";

$dbPath = __DIR__ . '/database/monolithic.sqlite';
$dbDir = dirname($dbPath);

if (!is_dir($dbDir)) {
    mkdir($dbDir, 0777, true);
    echo "Created database directory: $dbDir\n";
}

try {
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected to database: $dbPath\n\n";

    // Drop existing tables
    echo "Dropping existing tables...\n";
    $pdo->exec("DROP TABLE IF EXISTS enrollments");
    $pdo->exec("DROP TABLE IF EXISTS courses");
    $pdo->exec("DROP TABLE IF EXISTS students");

    // Create students table
    echo "Creating students table...\n";
    $pdo->exec("CREATE TABLE students (
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

    // Create courses table
    echo "Creating courses table...\n";
    $pdo->exec("CREATE TABLE courses (
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

    // Create enrollments table
    echo "Creating enrollments table...\n";
    $pdo->exec("CREATE TABLE enrollments (
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

    // Seed sample data
    echo "\nSeeding sample data...\n";

    // Sample courses
    $courses = [
        ['CS101', 'Introduction to Programming', 'Learn programming fundamentals with Python', 3, 'Computer Science', 'Fall 2024'],
        ['CS102', 'Data Structures', 'Arrays, linked lists, trees, graphs', 3, 'Computer Science', 'Fall 2024'],
        ['CS201', 'Database Systems', 'Relational databases and SQL', 3, 'Computer Science', 'Spring 2025'],
        ['CS301', 'Web Development', 'Full-stack web development', 3, 'Computer Science', 'Spring 2025'],
        ['MATH101', 'Calculus I', 'Limits, derivatives, integrals', 4, 'Mathematics', 'Fall 2024'],
        ['MATH201', 'Linear Algebra', 'Vectors, matrices, linear transformations', 3, 'Mathematics', 'Spring 2025'],
        ['ENG101', 'English Composition', 'Academic writing skills', 3, 'English', 'Fall 2024'],
        ['PHYS101', 'Physics I', 'Mechanics and thermodynamics', 4, 'Physics', 'Fall 2024'],
    ];

    $stmt = $pdo->prepare("INSERT INTO courses (course_code, name, description, credits, department, semester) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($courses as $course) {
        $stmt->execute($course);
    }
    echo "  - Inserted " . count($courses) . " courses\n";

    // Sample students
    $students = [
        ['STU-00001', 'Juan Dela Cruz', 'juan.delacruz@email.com', '09171234567', 'Manila, Philippines', '2000-05-15', 2, 'BS Computer Science'],
        ['STU-00002', 'Maria Santos', 'maria.santos@email.com', '09182345678', 'Quezon City, Philippines', '2001-03-22', 1, 'BS Information Technology'],
        ['STU-00003', 'Jose Rizal', 'jose.rizal@email.com', '09193456789', 'Calamba, Laguna', '1999-06-19', 3, 'BS Computer Science'],
        ['STU-00004', 'Ana Reyes', 'ana.reyes@email.com', '09204567890', 'Cebu City, Philippines', '2000-11-08', 2, 'BS Computer Science'],
        ['STU-00005', 'Pedro Garcia', 'pedro.garcia@email.com', '09215678901', 'Davao City, Philippines', '2001-07-30', 1, 'BS Information Technology'],
    ];

    $stmt = $pdo->prepare("INSERT INTO students (student_number, name, email, phone, address, date_of_birth, year_level, program) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($students as $student) {
        $stmt->execute($student);
    }
    echo "  - Inserted " . count($students) . " students\n";

    // Sample enrollments
    $enrollments = [
        [1, 1, '2024-08-15', 'ENROLLED'],
        [1, 2, '2024-08-15', 'ENROLLED'],
        [1, 7, '2024-08-15', 'ENROLLED'],
        [2, 1, '2024-08-15', 'ENROLLED'],
        [2, 5, '2024-08-15', 'ENROLLED'],
        [3, 3, '2024-08-15', 'ENROLLED'],
        [3, 4, '2024-08-15', 'ENROLLED'],
        [4, 1, '2024-08-15', 'ENROLLED'],
        [4, 2, '2024-08-15', 'ENROLLED'],
        [5, 1, '2024-08-15', 'ENROLLED'],
    ];

    $stmt = $pdo->prepare("INSERT INTO enrollments (student_id, course_id, enrollment_date, status) VALUES (?, ?, ?, ?)");
    foreach ($enrollments as $enrollment) {
        $stmt->execute($enrollment);
    }
    echo "  - Inserted " . count($enrollments) . " enrollments\n";

    echo "\n=== Migration Complete ===\n";
    echo "Database: $dbPath\n";
    echo "Tables: students, courses, enrollments\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
