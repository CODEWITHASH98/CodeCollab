/**
 * k6 Load Test Script
 * 
 * Tests:
 * - API endpoints under load
 * - WebSocket connections
 * - Concurrent users simulation
 * 
 * Run: k6 run load-test.js
 * Install: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const wsLatency = new Trend('ws_latency');
const wsErrors = new Counter('ws_errors');
const codeExecutions = new Counter('code_executions');
const executionSuccess = new Rate('execution_success');

// Test configuration
export const options = {
    stages: [
        { duration: '30s', target: 50 },   // Ramp up to 50 users
        { duration: '1m', target: 100 },   // Ramp up to 100 users
        { duration: '2m', target: 200 },   // Ramp up to 200 users
        { duration: '1m', target: 500 },   // Stress test: 500 users
        { duration: '30s', target: 1000 }, // Peak: 1000 users
        { duration: '1m', target: 500 },   // Scale down
        { duration: '30s', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],     // 95% requests under 500ms
        http_req_failed: ['rate<0.05'],        // Less than 5% failure rate
        ws_latency: ['p(95)<100'],             // WebSocket 95th percentile under 100ms
        execution_success: ['rate>0.90'],      // 90% code executions succeed
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3001';

// Test data
const testCodes = {
    javascript: 'console.log("Hello from k6 test!");',
    python: 'print("Hello from k6 test!")',
    java: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from k6 test!");
    }
}`,
};

/**
 * Setup: Create test user and get token
 */
export function setup() {
    const loginRes = http.post(`${BASE_URL}/api/auth/guest`, JSON.stringify({
        userName: `LoadTestUser_${Date.now()}`,
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
        'login successful': (r) => r.status === 200 || r.status === 201,
    });

    const data = JSON.parse(loginRes.body);
    return {
        token: data.data?.token || '',
        userId: data.data?.user?.userId || '',
    };
}

/**
 * Main test scenario
 */
export default function (data) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`,
    };

    // Test groups
    group('Health Check', () => {
        const health = http.get(`${BASE_URL}/health`);
        check(health, {
            'health status 200': (r) => r.status === 200,
            'health response time OK': (r) => r.timings.duration < 100,
        });
    });

    group('API Endpoints', () => {
        // Get supported languages
        const languages = http.get(`${BASE_URL}/api/execute/languages`, { headers });
        check(languages, {
            'languages returned': (r) => r.status === 200,
        });

        // Create room
        const roomRes = http.post(`${BASE_URL}/api/rooms`, null, { headers });
        check(roomRes, {
            'room created': (r) => r.status === 200 || r.status === 201,
        });

        if (roomRes.status === 200 || roomRes.status === 201) {
            const roomData = JSON.parse(roomRes.body);
            const roomId = roomData.data?.roomId;

            // Execute code
            if (roomId) {
                const execRes = http.post(`${BASE_URL}/api/execute`, JSON.stringify({
                    code: testCodes.javascript,
                    language: 'javascript',
                    roomId: roomId,
                }), { headers });

                codeExecutions.add(1);
                const success = execRes.status === 200 || execRes.status === 202;
                executionSuccess.add(success ? 1 : 0);

                check(execRes, {
                    'code execution submitted': (r) => r.status === 200 || r.status === 202,
                });
            }
        }
    });

    group('WebSocket Connection', () => {
        const wsUrl = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;
        const startTime = Date.now();

        const res = ws.connect(wsUrl, {}, function (socket) {
            socket.on('open', () => {
                const latency = Date.now() - startTime;
                wsLatency.add(latency);

                // Send ping
                socket.send(JSON.stringify({
                    type: 'ping',
                    timestamp: Date.now(),
                }));

                // Close after brief interaction
                socket.setTimeout(() => {
                    socket.close();
                }, 1000);
            });

            socket.on('error', (e) => {
                wsErrors.add(1);
            });

            socket.on('message', (msg) => {
                // Process message
            });
        });

        check(res, {
            'WebSocket connected': (r) => r && r.status === 101,
        });
    });

    // Think time between iterations
    sleep(Math.random() * 2 + 1);
}

/**
 * Teardown: Cleanup
 */
export function teardown(data) {
    console.log('Load test completed');
}
