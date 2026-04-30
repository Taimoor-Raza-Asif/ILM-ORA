// SMOKE TEST
// Quick 1-minute sanity check with a single virtual user.
// Run this BEFORE any bigger test to confirm the stack is up and the scripts work.
//
//   k6 run load-tests/smoke.js
//
// Expected: 0% errors, everything under a couple of seconds.

import { fullJourney } from './helpers/journey.js';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
    checks: ['rate>0.90'],
  },
  tags: { testType: 'smoke' },
};

export default function () {
  fullJourney();
}
