// AVERAGE LOAD TEST
// Simulates normal/expected traffic: ramp up → steady state → ramp down.
// Purpose: establish a baseline for response times and error rates.
//
//   k6 run load-tests/avg-load.js
//
// Shape:
//   0-2m   : ramp 0 -> 50 VUs
//   2-18m  : steady at 50 VUs (16 minutes)
//   18-20m : ramp 50 -> 0 VUs
// Total duration: 20 minutes.

import { fullJourney } from './helpers/journey.js';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '16m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2500', 'p(99)<6000'],
    checks: ['rate>0.95'],
    // Separate SLO for the slow ML-heavy endpoints.
    'http_req_duration{ml:true}': ['p(95)<30000'],
  },
  tags: { testType: 'avg-load' },
};

export default function () {
  fullJourney();
}
