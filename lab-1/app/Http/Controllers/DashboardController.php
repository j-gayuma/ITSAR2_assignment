<?php

namespace App\Http\Controllers;

use App\Services\ServiceClient;
use Inertia\Inertia;

/**
 * Dashboard Controller - API Gateway
 * Aggregates data from all microservices to display dashboard
 */
class DashboardController extends Controller
{
    public function index()
    {
        // Get counts from each service
        $studentCount = ServiceClient::get('student', '/api/students/count');
        $courseCount = ServiceClient::get('course', '/api/courses/count');
        $enrollmentCount = ServiceClient::get('enrollment', '/api/enrollments/count');
        $activeStudentCount = ServiceClient::get('student', '/api/students/active/count');

        // Recent enrollments from Enrollment Service
        $recentEnrollments = ServiceClient::get('enrollment', '/api/enrollments/recent', ['limit' => 5]);

        // Today's attendance from Enrollment Service
        $todayAttendance = ServiceClient::get('enrollment', '/api/attendance/today');

        // Grade stats from Enrollment Service
        $gradeStats = ServiceClient::get('enrollment', '/api/grades/stats');

        // Enrollment by course (top 5) from Enrollment Service
        $courseEnrollments = ServiceClient::get('enrollment', '/api/enrollments/course-counts');
        $courseEnrollmentsMapped = [];
        if (is_array($courseEnrollments) && !isset($courseEnrollments['error'])) {
            foreach ($courseEnrollments as $ce) {
                $courseEnrollmentsMapped[] = [
                    'name' => $ce['course_code'] ?? 'N/A',
                    'count' => $ce['enrollment_count'] ?? 0,
                ];
            }
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'totalStudents' => $studentCount['count'] ?? 0,
                'totalCourses' => $courseCount['count'] ?? 0,
                'totalEnrollments' => $enrollmentCount['count'] ?? 0,
                'activeStudents' => $activeStudentCount['count'] ?? 0,
                'presentToday' => $todayAttendance['present'] ?? 0,
                'absentToday' => $todayAttendance['absent'] ?? 0,
                'lateToday' => $todayAttendance['late'] ?? 0,
                'averageGpa' => $gradeStats['averageGpa'] ?? null,
                'passedCount' => $gradeStats['passedCount'] ?? 0,
                'failedCount' => $gradeStats['failedCount'] ?? 0,
            ],
            'recentEnrollments' => is_array($recentEnrollments) && !isset($recentEnrollments['error']) ? $recentEnrollments : [],
            'courseEnrollments' => $courseEnrollmentsMapped,
        ]);
    }
}
