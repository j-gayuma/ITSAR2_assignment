<?php

namespace App\Http\Controllers;

use App\Services\ServiceClient;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Course Controller - API Gateway
 * Proxies requests to the Course Microservice (port 8002)
 */
class CourseController extends Controller
{
    public function index()
    {
        $courses = ServiceClient::get('course', '/api/courses');

        // Enrich with enrollment counts from Enrollment Service
        foreach ($courses as &$course) {
            if (isset($course['id'])) {
                $enrollments = ServiceClient::get('enrollment', '/api/enrollments/by-course/' . $course['id']);
                $course['enrollments_count'] = is_array($enrollments) && !isset($enrollments['error']) ? count($enrollments) : 0;
            }
        }

        // Get all courses for prerequisite dropdown
        $allCourses = array_map(fn($c) => [
            'id' => $c['id'],
            'name' => $c['name'],
            'code' => $c['code'],
        ], $courses);

        return Inertia::render('courses/index', [
            'courses' => $courses,
            'allCourses' => $allCourses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'description' => 'nullable|string',
            'units' => 'required|integer|min:1|max:10',
            'schedule_day' => 'nullable|string',
            'schedule_time' => 'nullable|string',
            'room' => 'nullable|string|max:50',
            'prerequisite_ids' => 'nullable|array',
            'prerequisite_ids.*' => 'integer',
        ]);

        // Send to Course Service via HTTP
        $result = ServiceClient::post('course', '/api/courses', $validated);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['code' => $result['error']]);
        }

        return redirect()->back()->with('success', 'Course created successfully.');
    }

    public function show($id)
    {
        $course = ServiceClient::get('course', "/api/courses/{$id}");

        if (isset($course['error'])) {
            abort(404, 'Course not found');
        }

        // Get enrolled students from Enrollment Service
        $enrolledStudents = ServiceClient::get('enrollment', "/api/enrollments/by-course/{$id}");
        if (isset($enrolledStudents['error'])) {
            $enrolledStudents = [];
        }

        return Inertia::render('courses/show', [
            'course' => $course,
            'enrolledStudents' => $enrolledStudents,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'description' => 'nullable|string',
            'units' => 'required|integer|min:1|max:10',
            'schedule_day' => 'nullable|string',
            'schedule_time' => 'nullable|string',
            'room' => 'nullable|string|max:50',
            'prerequisite_ids' => 'nullable|array',
            'prerequisite_ids.*' => 'integer',
        ]);

        // Send to Course Service via HTTP
        $result = ServiceClient::put('course', "/api/courses/{$id}", $validated);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['code' => $result['error']]);
        }

        return redirect()->back()->with('success', 'Course updated successfully.');
    }

    public function destroy($id)
    {
        // Delete enrollments for this course from Enrollment Service
        $enrollments = ServiceClient::get('enrollment', "/api/enrollments/by-course/{$id}");
        if (is_array($enrollments) && !isset($enrollments['error'])) {
            foreach ($enrollments as $enrollment) {
                if (isset($enrollment['id'])) {
                    ServiceClient::delete('enrollment', '/api/enrollments/' . $enrollment['id']);
                }
            }
        }

        // Delete course from Course Service
        ServiceClient::delete('course', "/api/courses/{$id}");

        return redirect('/courses')->with('success', 'Course deleted successfully.');
    }
}
