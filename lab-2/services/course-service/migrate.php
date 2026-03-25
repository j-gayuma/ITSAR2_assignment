<?php
/**
 * Course Service - Database Migration / Seeder
 * Run: php migrate.php
 */

$dbPath = __DIR__ . '/database/course_service.sqlite';
$dbDir = dirname($dbPath);

if (!is_dir($dbDir)) {
    mkdir($dbDir, 0777, true);
}

if (file_exists($dbPath)) {
    unlink($dbPath);
}

$pdo = new PDO("sqlite:$dbPath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Creating courses table...\n";
$pdo->exec("CREATE TABLE courses (
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

echo "Creating course_prerequisite table...\n";
$pdo->exec("CREATE TABLE course_prerequisite (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    prerequisite_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(course_id, prerequisite_id)
)");

echo "Course Service database migrated successfully!\n";
echo "Database: $dbPath\n";
