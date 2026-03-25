<?php

namespace App\Http\Controllers;

use App\Services\ServiceClient;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Enrollment Controller - API Gateway
 * Proxies requests to the Enrollment Microservice (port 8003)
 * Also fetches student/course lists from their respective services
 */
class EnrollmentController extends Controller
{
    public function index()
    {
        $enrollments = ServiceClient::get('enrollment', '/api/enrollments');
        $students = ServiceClient::get('student', '/api/students');
        $courses = ServiceClient::get('course', '/api/courses');

        return Inertia::render('enrollments/index', [
            'enrollments' => is_array($enrollments) && !isset($enrollments['error']) ? $enrollments : [],
            'students' => is_array($students) && !isset($students['error']) ? $students : [],
            'courses' => is_array($courses) && !isset($courses['error']) ? $courses : [],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|integer',
            'course_id' => 'required|integer',
        ]);

        // Send to Enrollment Service via HTTP (it validates against Student & Course services)
        $result = ServiceClient::post('enrollment', '/api/enrollments', $validated);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['course_id' => $result['error']]);
        }

        return redirect()->back()->with('success', 'Enrollment created successfully.');
    }

    public function show($id)
    {
        $enrollment = ServiceClient::get('enrollment', "/api/enrollments/{$id}");

        if (isset($enrollment['error'])) {
            abort(404, 'Enrollment not found');
        }

        return Inertia::render('enrollments/show', [
            'enrollment' => $enrollment,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:ENROLLED,DROPPED,COMPLETED',
        ]);

        $result = ServiceClient::put('enrollment', "/api/enrollments/{$id}", $validated);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['status' => $result['error']]);
        }

        return redirect()->back()->with('success', 'Enrollment updated successfully.');
    }

    public function destroy($id)
    {
        ServiceClient::delete('enrollment', "/api/enrollments/{$id}");

        return redirect('/enrollments')->with('success', 'Enrollment deleted successfully.');
    }
}
