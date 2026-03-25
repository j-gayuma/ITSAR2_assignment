<?php
/**
 * Student Service - Database Migration / Seeder
 * Run: php migrate.php
 */

$dbPath = __DIR__ . '/database/student_service.sqlite';
$dbDir = dirname($dbPath);

if (!is_dir($dbDir)) {
    mkdir($dbDir, 0777, true);
}

// Create or recreate the database
if (file_exists($dbPath)) {
    unlink($dbPath);
}

$pdo = new PDO("sqlite:$dbPath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

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

echo "Student Service database migrated successfully!\n";
echo "Database: $dbPath\n";
