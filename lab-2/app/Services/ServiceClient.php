<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

/**
 * ServiceClient - HTTP client for inter-service communication
 *
 * This client is used by the API Gateway (main Laravel app) to communicate
 * with the microservices via HTTP requests.
 *
 * Services:
 *  - Student Service:    http://localhost:8001
 *  - Course Service:     http://localhost:8002
 *  - Enrollment Service: http://localhost:8003
 */
class ServiceClient
{
    protected static array $serviceUrls = [
        'student' => 'http://localhost:8001',
        'course' => 'http://localhost:8002',
        'enrollment' => 'http://localhost:8003',
    ];

    /**
     * Get the base URL for a service
     */
    public static function getServiceUrl(string $service): string
    {
        return self::$serviceUrls[$service] ?? throw new \InvalidArgumentException("Unknown service: $service");
    }

    /**
     * Make a GET request to a service
     */
    public static function get(string $service, string $path, array $query = []): array
    {
        try {
            $url = self::getServiceUrl($service) . $path;
            $response = Http::timeout(10)->acceptJson()->get($url, $query);
            return $response->json() ?? [];
        } catch (\Exception $e) {
            \Log::error("ServiceClient GET failed: {$service}{$path}", ['error' => $e->getMessage()]);
            return ['error' => "Service '{$service}' is unavailable: " . $e->getMessage()];
        }
    }

    /**
     * Make a POST request to a service
     */
    public static function post(string $service, string $path, array $data = []): array
    {
        try {
            $url = self::getServiceUrl($service) . $path;
            $response = Http::timeout(10)->acceptJson()->post($url, $data);
            return $response->json() ?? [];
        } catch (\Exception $e) {
            \Log::error("ServiceClient POST failed: {$service}{$path}", ['error' => $e->getMessage()]);
            return ['error' => "Service '{$service}' is unavailable: " . $e->getMessage()];
        }
    }

    /**
     * Make a PUT request to a service
     */
    public static function put(string $service, string $path, array $data = []): array
    {
        try {
            $url = self::getServiceUrl($service) . $path;
            $response = Http::timeout(10)->acceptJson()->put($url, $data);
            return $response->json() ?? [];
        } catch (\Exception $e) {
            \Log::error("ServiceClient PUT failed: {$service}{$path}", ['error' => $e->getMessage()]);
            return ['error' => "Service '{$service}' is unavailable: " . $e->getMessage()];
        }
    }

    /**
     * Make a DELETE request to a service
     */
    public static function delete(string $service, string $path): array
    {
        try {
            $url = self::getServiceUrl($service) . $path;
            $response = Http::timeout(10)->acceptJson()->delete($url);
            return $response->json() ?? [];
        } catch (\Exception $e) {
            \Log::error("ServiceClient DELETE failed: {$service}{$path}", ['error' => $e->getMessage()]);
            return ['error' => "Service '{$service}' is unavailable: " . $e->getMessage()];
        }
    }

    /**
     * Check health of all services
     */
    public static function healthCheck(): array
    {
        $results = [];
        foreach (self::$serviceUrls as $name => $url) {
            try {
                $response = Http::timeout(3)->get($url . '/api/health');
                $results[$name] = [
                    'status' => $response->successful() ? 'healthy' : 'unhealthy',
                    'url' => $url,
                    'response' => $response->json(),
                ];
            } catch (\Exception $e) {
                $results[$name] = [
                    'status' => 'down',
                    'url' => $url,
                    'error' => $e->getMessage(),
                ];
            }
        }
        return $results;
    }
}
