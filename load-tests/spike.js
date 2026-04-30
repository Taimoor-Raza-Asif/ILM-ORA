// SPIKE TEST
// Tests sudden, extreme bursts of traffic (e.g., viral social post, flash-sale,
// DDoS-like behavior). The goal is to see HOW the system degrades, not IF.
//
//   k6 run load-tests/spike.js
//
// Shape:
//   0-1m   : warm-up at 5 VUs
//   1-1m10s: SPIKE to 200 VUs (10s ramp)
//   1m10s-4m10s: hold 200 VUs (3 minutes of pain)
//   4m10s-5m : ramp down to 5 VUs
//   5m-6m  : recovery observation at 5 VUs (does p95 return to normal?)
// Total duration: ~6 minutes.
//
// We skip the DeBERTa ML endpoints during the spike because they are
// intentionally slow and would dominate the latency metrics. If you *want*
// to stress the ML path specifically, delete the `{ skipML: true }` below.

import { fullJourney } from './helpers/journey.js';

export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '10s', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '50s', target: 5 },
    { duration: '1m', target: 5 },
  ],
  thresholds: {
    // Spike tests often cross these; thresholds are informational here.
    http_req_failed: ['rate<0.20'],
    http_req_duration: ['p(95)<8000'],
    checks: ['rate>0.80'],
  },
  tags: { testType: 'spike' },
};

export default function () {
  fullJourney({ skipML: true });
}
