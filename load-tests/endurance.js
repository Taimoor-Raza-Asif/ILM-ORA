// ENDURANCE (SOAK) TEST
// Sustains moderate load for an extended period to surface problems that only
// appear over time: memory leaks, DB connection-pool exhaustion, event-loop
// stalls, disk space growth, JWT/refresh-token bugs, etc.
//
//   k6 run load-tests/endurance.js
//
// Shape:
//   0-3m   : ramp 0 -> 30 VUs
//   3-28m  : steady at 30 VUs (25 minutes)
//   28-30m : ramp down to 0 VUs
// Total duration: ~30 minutes (per your selection).
//
// While this runs, watch memory/CPU of each backend service in Task Manager
// or via `Get-Process node, python | Select Name, WS, CPU` in PowerShell.
// If RSS grows linearly over the steady phase, you likely have a leak.

import { fullJourney } from './helpers/journey.js';

export const options = {
  stages: [
    { duration: '3m', target: 30 },
    { duration: '25m', target: 30 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000', 'p(99)<6000'],
    checks: ['rate>0.95'],
    'http_req_duration{ml:true}': ['p(95)<30000'],
  },
  tags: { testType: 'endurance' },
};

export default function () {
  fullJourney();
}
