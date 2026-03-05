import http from 'k6/http';
import { check, sleep } from 'k6';

// Sprint 10: Platform Load Testing & Performance Benchmark Profile
export const options = {
    stages: [
        { duration: '30s', target: 200 },  // Ramp up to 200 users over 30 seconds
        { duration: '1m', target: 1000 },  // Spike to 1000 users for 1 minute
        { duration: '30s', target: 0 },    // Ramp down to 0 users
    ],
    thresholds: {
        // 95% of requests must complete inside 200ms
        http_req_duration: ['p(95)<200'],
        // Error rate must be < 1%
        http_req_failed: ['rate<0.01'],
    },
};

export default function () {
    // Hit health check to measure bare-metal Node.js routing latency
    const res = http.get('http://localhost:3000/api/health');

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
