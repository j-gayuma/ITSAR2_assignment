<?php

namespace App\Http\Controllers;

use App\Services\ServiceClient;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Attendance Controller - API Gateway
 * Proxies attendance requests to the Enrollment Microservice (port 8003)
 */
class AttendanceController extends Controller
{
    public function index()
    {
        $courses = ServiceClient::get('course', '/api/courses');
        $students = ServiceClient::get('student', '/api/students');
        $recentAttendance = ServiceClient::get('enrollment', '/api/attendance');

        // Filter active students
        $activeStudents = array_filter($students, fn($s) => ($s['status'] ?? '') === 'ACTIVE');

        return Inertia::render('attendance/index', [
            'courses' => is_array($courses) && !isset($courses['error']) ? $courses : [],
            'students' => array_values($activeStudents),
            'recentAttendance' => is_array($recentAttendance) && !isset($recentAttendance['error']) ? $recentAttendance : [],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|integer',
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.enrollment_id' => 'required|integer',
            'records.*.status' => 'required|in:PRESENT,ABSENT,LATE,EXCUSED',
            'records.*.remarks' => 'nullable|string',
        ]);

        $result = ServiceClient::post('enrollment', '/api/attendance', $validated);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['date' => $result['error']]);
        }

        return redirect()->back()->with('success', 'Attendance recorded successfully.');
    }

    public function getEnrollments($courseId)
    {
        $enrollments = ServiceClient::get('enrollment', "/api/enrollments/by-course/{$courseId}", ['status' => 'ENROLLED']);

        return response()->json(is_array($enrollments) && !isset($enrollments['error']) ? $enrollments : []);
    }
}
