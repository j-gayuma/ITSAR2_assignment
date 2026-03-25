<?php

namespace App\Http\Controllers;

use App\Services\ServiceClient;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Grade Controller - API Gateway
 * Proxies grade requests to the Enrollment Microservice (port 8003)
 */
class GradeController extends Controller
{
    public function index()
    {
        $enrollments = ServiceClient::get('enrollment', '/api/grades');
        $students = ServiceClient::get('student', '/api/students');

        // Filter to active students only
        $activeStudents = array_filter($students, fn($s) => ($s['status'] ?? '') === 'ACTIVE');

        return Inertia::render('grades/index', [
            'enrollments' => is_array($enrollments) && !isset($enrollments['error']) ? $enrollments : [],
            'students' => array_values($activeStudents),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|integer',
            'grade' => 'required|numeric|min:1.00|max:5.00',
            'remarks' => 'nullable|string|max:255',
            'semester' => 'required|string',
            'academic_year' => 'required|string',
        ]);

        $result = ServiceClient::post('enrollment', '/api/grades', $validated);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['grade' => $result['error']]);
        }

        return redirect()->back()->with('success', 'Grade saved successfully.');
    }
}
