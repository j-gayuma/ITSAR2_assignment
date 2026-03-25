<?php

namespace App\Http\Controllers;

use App\Services\ServiceClient;
use Inertia\Inertia;

/**
 * Schedule Controller - API Gateway
 * Aggregates data from Student, Course, and Enrollment services
 */
class ScheduleController extends Controller
{
    public function index()
    {
        $students = ServiceClient::get('student', '/api/students');
        $activeStudents = array_filter($students, fn($s) => ($s['status'] ?? '') === 'ACTIVE');

        return Inertia::render('schedule/index', [
            'students' => array_values($activeStudents),
        ]);
    }

    public function show($id)
    {
        $student = ServiceClient::get('student', "/api/students/{$id}");

        if (isset($student['error'])) {
            abort(404, 'Student not found');
        }

        // Get enrolled enrollments from Enrollment Service
        $enrollments = ServiceClient::get('enrollment', "/api/enrollments/by-student/{$id}");

        $schedule = [];
        if (is_array($enrollments) && !isset($enrollments['error'])) {
            foreach ($enrollments as $enrollment) {
                // Only include active enrollments
                if (($enrollment['status'] ?? '') !== 'ENROLLED') {
                    continue;
                }

                $course = $enrollment['course'] ?? null;
                if ($course) {
                    $schedule[] = [
                        'id' => $enrollment['id'],
                        'course_code' => $course['code'] ?? '',
                        'course_name' => $course['name'] ?? '',
                        'day' => $course['schedule_day'] ?? '',
                        'time' => $course['schedule_time'] ?? '',
                        'room' => $course['room'] ?? '',
                        'units' => $course['units'] ?? 3,
                    ];
                }
            }
        }

        return Inertia::render('schedule/show', [
            'student' => $student,
            'schedule' => $schedule,
        ]);
    }
}
