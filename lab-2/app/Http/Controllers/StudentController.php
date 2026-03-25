<?php

namespace App\Http\Controllers;

use App\Services\ServiceClient;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Student Controller - API Gateway
 * Proxies requests to the Student Microservice (port 8001)
 */
class StudentController extends Controller
{
    public function index()
    {
        $students = ServiceClient::get('student', '/api/students');

        // Enrich with enrollment counts from Enrollment Service
        foreach ($students as &$student) {
            if (isset($student['id'])) {
                $enrollments = ServiceClient::get('enrollment', '/api/enrollments/by-student/' . $student['id']);
                $student['enrollments_count'] = is_array($enrollments) && !isset($enrollments['error']) ? count($enrollments) : 0;
            }
        }

        return Inertia::render('students/index', [
            'students' => $students,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'student_number' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'year_level' => 'nullable|integer|min:1|max:6',
            'program' => 'nullable|string|max:255',
        ]);

        // Send to Student Service via HTTP
        $result = ServiceClient::post('student', '/api/students', $validated);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['email' => $result['error']]);
        }

        return redirect()->back()->with('success', 'Student created successfully.');
    }

    public function show($id)
    {
        // Get student from Student Service
        $student = ServiceClient::get('student', "/api/students/{$id}");

        if (isset($student['error'])) {
            abort(404, 'Student not found');
        }

        // Get enrollments from Enrollment Service (includes course, grade, attendance data)
        $enrollments = ServiceClient::get('enrollment', "/api/enrollments/by-student/{$id}");
        $student['enrollments'] = is_array($enrollments) && !isset($enrollments['error']) ? $enrollments : [];

        // Get GPA from Enrollment Service
        $gpaData = ServiceClient::get('enrollment', "/api/gpa/student/{$id}");
        $gpa = $gpaData['gpa'] ?? null;

        // Get attendance summary from Enrollment Service
        $attendanceSummary = ServiceClient::get('enrollment', "/api/attendance/student/{$id}");
        if (isset($attendanceSummary['error'])) {
            $attendanceSummary = ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0, 'rate' => 0];
        }

        return Inertia::render('students/show', [
            'student' => $student,
            'gpa' => $gpa,
            'attendanceSummary' => $attendanceSummary,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'year_level' => 'nullable|integer|min:1|max:6',
            'program' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:ACTIVE,INACTIVE,GRADUATED,DROPPED',
        ]);

        // Send to Student Service via HTTP
        $result = ServiceClient::put('student', "/api/students/{$id}", $validated);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['email' => $result['error']]);
        }

        return redirect()->back()->with('success', 'Student updated successfully.');
    }

    public function transcript($id)
    {
        $student = ServiceClient::get('student', "/api/students/{$id}");

        if (isset($student['error'])) {
            abort(404, 'Student not found');
        }

        $enrollments = ServiceClient::get('enrollment', "/api/enrollments/by-student/{$id}");
        $student['enrollments'] = is_array($enrollments) && !isset($enrollments['error']) ? $enrollments : [];

        $gpaData = ServiceClient::get('enrollment', "/api/gpa/student/{$id}");

        return Inertia::render('students/transcript', [
            'student' => $student,
            'gpa' => $gpaData['gpa'] ?? null,
        ]);
    }

    public function destroy($id)
    {
        // First delete enrollments from Enrollment Service
        $enrollments = ServiceClient::get('enrollment', "/api/enrollments/by-student/{$id}");
        if (is_array($enrollments) && !isset($enrollments['error'])) {
            foreach ($enrollments as $enrollment) {
                if (isset($enrollment['id'])) {
                    ServiceClient::delete('enrollment', '/api/enrollments/' . $enrollment['id']);
                }
            }
        }

        // Then delete student from Student Service
        ServiceClient::delete('student', "/api/students/{$id}");

        return redirect('/students')->with('success', 'Student deleted successfully.');
    }
}
