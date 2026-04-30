// Shared configuration for all k6 load tests

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Real university names/IDs seeded in the database (from /api/universities)
// These are used for endpoints that need a valid ID or name.
export const UNIVERSITY_IDS = [
  '692b197fc87adf65fd03b989', // Air University, Islamabad
  '692b197fc87adf65fd03b98c', // Allama Iqbal Open University
  '692b197fc87adf65fd03b98d', // Bahria University
  '692b197fc87adf65fd03b98e', // CUST
  '692b197fc87adf65fd03b98f', // COMSATS
  '692b1980c87adf65fd03b992', // Institute of Space Technology
];

export const UNIVERSITY_NAMES = [
  'Air University',
  'COMSATS',
  'Bahria University',
  'CUST',
  'Allama Iqbal Open University',
  'Foundation University Islamabad',
];

export const CAREER_CATEGORIES = [
  'Engineering',
  'Medicine',
  'Business',
  'Computer Science',
  'Arts',
];

// SLO thresholds applied to every scenario
// These say: 95% of requests must be under 2s, errors must be below 5%.
// Heavy ML endpoints get a relaxed threshold separately.
export const DEFAULT_THRESHOLDS = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  http_req_duration_ml: ['p(95)<30000'],
  checks: ['rate>0.95'],
};

// Generate a unique-ish test user per VU/iteration
export function makeTestUser(vu, iter) {
  const ts = Date.now();
  return {
    name: `LoadTest User ${vu}-${iter}`,
    email: `loadtest_${vu}_${iter}_${ts}@example.com`,
    password: 'LoadTest@2026',
  };
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
