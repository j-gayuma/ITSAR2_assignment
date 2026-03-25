## Abstract

This laboratory evaluated three Laravel-based microservices — Student Service (port 8001), Course Service (port 8002), and Enrollment Service (port 8003) — using a sequential curl test suite that exercised HTTP status codes 200, 201, 400, 404, 409, 503, and 504. Every request was executed with `curl -i` so that both headers and JSON bodies were visible in a fixed order, and each step depended on data created in earlier steps. The most important observation is that only the Enrollment Service ever returns 503 and 504 responses, because it is the only service that performs outbound HTTP calls to the other two services. All 27 test steps produced the expected status codes and ERROR_CODE values, confirming that the microservices handle both normal and edge-case scenarios consistently.

---

## I. INTRODUCTION

Edge case testing focuses on what happens when inputs or external conditions are abnormal. It is not enough to show that an API works for ideal “happy path” cases; a production-ready system must also respond correctly when requests are malformed, when resources are missing, or when dependencies fail. In a microservice environment, these situations are common and must be mapped to clear HTTP status codes and machine-readable error messages.

HTTP status codes communicate the outcome of every API call. Successful operations use 2xx codes (for example, 200 OK for reads and updates, and 201 Created for new records). Client-side problems use 4xx codes: 400 Bad Request for invalid or incomplete input, 404 Not Found for missing resources, and 409 Conflict when a request would create a duplicate. Server-side failures use 5xx codes, such as 503 Service Unavailable when a dependency is offline and 504 Gateway Timeout when a dependency is too slow. These last two codes appear naturally in microservice architectures because services call each other over HTTP; in a monolith, there is no external HTTP dependency, so 503 and 504 do not occur in the same way.

For this laboratory I designed a 27-step test flow where each step depends on the previous ones. A fresh database state with seeded students and courses is created before every full run so that IDs are predictable. This deterministic ordering ensures that failures point to real issues in the code or configuration, not to missing test data.

---

## II. METHODOLOGY / IMPLEMENTATION

All three microservices were started in separate terminal windows before any curl commands were executed. Because the Enrollment Service calls both the Student and Course services to validate `student_id` and `course_id`, all three must be running together to get meaningful results. A fourth terminal was reserved purely for curl so that the requests and responses were easy to capture and review.

The 27-step test suite covers:

- Basic CRUD for students, courses, and enrollments
- Validation failures and missing fields
- Not-found scenarios for each service
- Duplicate detection for unique fields and relationships
- Cross-service not-found cases
- Dependency down and dependency timeout situations
- Cleanup of the records created during the run

### A. Reset and Seed

Before each full run, the databases of the three Laravel microservices are reset and seeded to a known baseline using their artisan commands. This guarantees that there are three initial students and three initial courses, while the enrollment table starts empty. Having a clean and predictable starting point prevents false negatives where tests fail only because expected records were not present.

### B. Start Services

Each microservice runs as its own Laravel application on a dedicated port:

- Terminal 1: Student Service on port 8001
- Terminal 2: Course Service on port 8002
- Terminal 3: Enrollment Service on port 8003

The main Laravel gateway on port 8000 can also be started, but the core of this lab is the direct curl interaction with each microservice API.

### C. Sequential Test Flow

All curl commands are executed in order from Terminal 4. Selected examples from the 27 steps are:

- Steps 1–2: `GET /api/students` and `GET /api/courses` verify that both services return 200 OK with the seeded data.
- Steps 3–8: `POST`, `GET`, and `PUT` calls create and update a new student and course, expecting 201 for creation and 200 for retrieval and updates.
- Steps 9–11: Enrollment creation and retrieval confirm that the Enrollment Service can link the new student and course, returning enriched details and 200/201 statuses as appropriate.
- Steps 12–14: Invalid student and enrollment payloads are sent to trigger 400 VALIDATION_ERROR responses.
- Steps 15–17: Requests for obviously nonexistent IDs (such as 9999) confirm 404 behaviour for each service.
- Steps 18–19: Repeating valid create requests triggers 409 Conflict responses for duplicate email and duplicate enrollment combinations.
- Steps 20–21: Enrollment attempts referencing nonexistent student or course IDs verify cross-service 404 handling.
- Steps 22–23: Stopping or slowing the Student Service manually produces 503 SERVICE_UNAVAILABLE and 504 GATEWAY_TIMEOUT responses from the Enrollment Service.
- Steps 24–27: Deleting the created enrollment, student, and course, then confirming that follow-up GET requests return 404, completes the cleanup.

Each command uses `curl -i` so the HTTP status line, headers, and JSON body are all visible together.

---

## III. EXPERIMENTAL FINDINGS / OBSERVATIONS

Running the full 27-step sequence confirmed that the three microservices behave correctly for both normal and edge-case requests. Steps 1–11 showed that standard CRUD operations work as expected: creating and reading students, courses, and enrollments returns 201 or 200, and the Enrollment Service can enrich enrollment responses with related student and course information.

Steps 12–14 verified that validation is enforced consistently. Missing required fields or invalid formats in the Student and Enrollment services produced HTTP 400 responses with `VALIDATION_ERROR` and clear messages identifying the problem fields. Steps 15–17 demonstrated proper not-found handling, with HTTP 404 responses when requesting student, course, or enrollment IDs that do not exist.

Duplicate handling was confirmed in Steps 18 and 19. Submitting an already-registered email to the Student Service produced a 409 response with a duplicate-email error code, while repeating the same student–course pair in the Enrollment Service triggered a 409 duplicate-enrollment error. Steps 20 and 21 validated cross-service not-found cases: when the Enrollment Service attempted to create enrollments using nonexistent student or course IDs, it mapped the upstream 404 responses from the dependent services into its own `STUDENT_NOT_FOUND` and `COURSE_NOT_FOUND` error codes.

The most interesting behaviour came from Steps 22 and 23. In Step 22, stopping the Student Service and then attempting to create an enrollment caused the Enrollment Service to catch a connection failure and return HTTP 503 with `SERVICE_UNAVAILABLE`. In Step 23, artificially slowing the Student Service beyond the configured timeout caused the HTTP client to throw a timeout exception, which the Enrollment Service translated into HTTP 504 with `GATEWAY_TIMEOUT`. Finally, Steps 24–27 confirmed that the delete operations for enrollment, student, and course all succeed, and that subsequent GET requests for those IDs correctly return 404.

---

## IV. LAB DISCUSSIONS / COMPUTATIONS

A key design decision in this lab is the use of consistent `ERROR_CODE` strings across all three services. Every JSON error follows the pattern `{ "error": "...", "message": "..." }`, and the codes themselves are shared: `VALIDATION_ERROR`, `DUPLICATE_EMAIL`, `DUPLICATE_ENROLLMENT`, `STUDENT_NOT_FOUND`, `COURSE_NOT_FOUND`, `SERVICE_UNAVAILABLE`, `GATEWAY_TIMEOUT`, and so on. Because of this consistency, a single error-handling function on the frontend (or in another consuming service) can inspect the `error` field and decide what to do, without worrying about which microservice produced the response.

Only the Enrollment Service can legitimately return 503 and 504 responses. The Student and Course services interact only with their own local databases; they never call out to other HTTP services, so dependency failures and timeouts do not apply to them. In contrast, the Enrollment Service must call both of the other services whenever it validates or enriches enrollments. This makes it the natural place to implement resilience logic and to surface 503 and 504 errors.

The HTTP client used by the Enrollment Service is configured with a timeout (for example, 5 seconds). When a dependency is unreachable, the client throws a connection-related exception; when a dependency responds too slowly, it throws a timeout-related exception. By inspecting the exception message or type, the Enrollment Service can distinguish between these two cases and set the status code accordingly. While this string-based inspection is sufficient for the lab, a production system would likely use more robust techniques such as circuit breakers, dedicated health-check endpoints, and structured error types.

Using `curl -i` rather than plain `curl` was also essential. Without `-i`, only the body of the response is visible, which makes it easy to overlook incorrect status codes. With `-i`, the HTTP status line (for example, `HTTP/1.1 404 Not Found` or `HTTP/1.1 503 Service Unavailable`) appears together with the JSON body, so each step can be verified quickly and accurately. The strictly sequential ordering of the 27 steps ensured that each test ran with the correct prerequisites in place, such as relying on IDs created earlier in the flow.

---

## V. CONCLUSIONS

In this laboratory I verified, step by step, that the Student, Course, and Enrollment microservices respond correctly to both normal operations and a wide range of edge cases. The 27 curl commands covered successful CRUD operations, validation errors, not-found scenarios, duplicate detection, dependency failures, and cleanup. Every step produced the expected HTTP status code and a structured JSON error body when appropriate.

From an architectural perspective, the experiment highlights how microservices introduce failure modes that do not exist in a monolith. Because the Enrollment Service depends on other services over HTTP, it must deal with offline dependencies and slow responses, and it is the only service that returns 503 and 504 status codes. Strengthening error handling and standardizing error formats made the overall system more predictable and easier to test.

If this work were extended toward production, the next logical improvements would include automated tests that run the curl scenarios, circuit breakers and retry policies around outbound HTTP calls, and dedicated `/health` endpoints for each microservice. Even within the scope of this lab, however, the system now behaves much more like a real-world microservice application that is prepared for invalid input, missing data, and dependency failures.