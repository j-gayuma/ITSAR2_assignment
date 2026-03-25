<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;

// Redirect home to dashboard
Route::redirect('/', '/dashboard')->name('home');

// Dashboard (aggregates data from all microservices)
Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

// Student Management (proxied to Student Service @ port 8001)
Route::get('students', [StudentController::class, 'index'])->name('students.index');
Route::post('students', [StudentController::class, 'store'])->name('students.store');
Route::get('students/{id}', [StudentController::class, 'show'])->name('students.show');
Route::put('students/{id}', [StudentController::class, 'update'])->name('students.update');
Route::delete('students/{id}', [StudentController::class, 'destroy'])->name('students.destroy');
Route::get('students/{id}/transcript', [StudentController::class, 'transcript'])->name('students.transcript');

// Course Management (proxied to Course Service @ port 8002)
Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
Route::post('courses', [CourseController::class, 'store'])->name('courses.store');
Route::get('courses/{id}', [CourseController::class, 'show'])->name('courses.show');
Route::put('courses/{id}', [CourseController::class, 'update'])->name('courses.update');
Route::delete('courses/{id}', [CourseController::class, 'destroy'])->name('courses.destroy');

// Enrollment Management (proxied to Enrollment Service @ port 8003)
Route::get('enrollments', [EnrollmentController::class, 'index'])->name('enrollments.index');
Route::post('enrollments', [EnrollmentController::class, 'store'])->name('enrollments.store');
Route::get('enrollments/{id}', [EnrollmentController::class, 'show'])->name('enrollments.show');
Route::put('enrollments/{id}', [EnrollmentController::class, 'update'])->name('enrollments.update');
Route::delete('enrollments/{id}', [EnrollmentController::class, 'destroy'])->name('enrollments.destroy');

// Class Schedule (aggregates Student + Enrollment + Course services)
Route::get('schedule', [ScheduleController::class, 'index'])->name('schedule.index');
Route::get('schedule/{id}', [ScheduleController::class, 'show'])->name('schedule.show');

// Grade Management (proxied to Enrollment Service @ port 8003)
Route::get('grades', [GradeController::class, 'index'])->name('grades.index');
Route::post('grades', [GradeController::class, 'store'])->name('grades.store');

// Attendance Tracking (proxied to Enrollment Service @ port 8003)
Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
Route::get('attendance/enrollments/{courseId}', [AttendanceController::class, 'getEnrollments'])->name('attendance.enrollments');

// Service Health Check
Route::get('api/health', function () {
    $health = \App\Services\ServiceClient::healthCheck();
    return response()->json([
        'gateway' => 'running',
        'services' => $health,
    ]);
});

require __DIR__.'/settings.php';
