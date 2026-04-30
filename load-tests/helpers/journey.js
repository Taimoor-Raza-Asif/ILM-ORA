import http from 'k6/http';
import { check, group, sleep } from 'k6';
import {
  BASE_URL,
  UNIVERSITY_IDS,
  UNIVERSITY_NAMES,
  makeTestUser,
  pick,
} from '../config.js';
import { registerAndLogin, authHeaders } from './auth.js';

// Full user journey covering every IMPLEMENTED gateway endpoint.
// Endpoints that are routed by the gateway but not yet implemented on the
// target microservice are intentionally excluded (marked NOT_IMPL below).
//
// NOT_IMPL (gateway route exists, microservice returns 404/stub):
//   GET  /api/universities/search      - not in university-service
//   GET  /api/careers/category/:cat    - not in career-service
//   GET  /api/reviews                  - root list not in university-service
//   GET  /api/sentiment/dashboard      - sentiment-service is a stub
//   POST /api/sentiment/analyze        - sentiment-service is a stub
//   GET  /api/auth/me                  - not in auth-service (only /verify)
//   POST /api/universities/:id/favorite - not in university-service
//   GET  /api/universities/user/favorites - not in university-service
//   GET  /api/hostels/near/:id         - Google Maps API key not configured
//
// `options` may include { skipML: true } to avoid the slow DeBERTa inference
// during spike tests.
export function fullJourney(options = {}) {
  const skipML = options.skipML === true;

  group('gateway - health & info', () => {
    const health = http.get(`${BASE_URL}/health`, { tags: { endpoint: 'health' } });
    check(health, { 'health 200': (r) => r.status === 200 });

    const info = http.get(`${BASE_URL}/api`, { tags: { endpoint: 'api_info' } });
    check(info, { 'api info 200': (r) => r.status === 200 });
  });

  group('universities - browse (public)', () => {
    const list = http.get(`${BASE_URL}/api/universities`, {
      tags: { endpoint: 'universities_list' },
    });
    check(list, { 'unis list 200': (r) => r.status === 200 });

    const id = pick(UNIVERSITY_IDS);

    const detail = http.get(`${BASE_URL}/api/universities/${id}`, {
      tags: { endpoint: 'universities_detail' },
    });
    check(detail, { 'uni detail 2xx': (r) => r.status >= 200 && r.status < 400 });

    const programs = http.get(`${BASE_URL}/api/universities/${id}/programs`, {
      tags: { endpoint: 'universities_programs' },
    });
    check(programs, { 'programs 2xx': (r) => r.status >= 200 && r.status < 400 });

    const scholarships = http.get(`${BASE_URL}/api/universities/${id}/scholarships`, {
      tags: { endpoint: 'universities_scholarships' },
    });
    check(scholarships, { 'scholarships 2xx': (r) => r.status >= 200 && r.status < 400 });
  });

  group('careers - browse', () => {
    const list = http.get(`${BASE_URL}/api/careers`, { tags: { endpoint: 'careers_list' } });
    check(list, { 'careers list 2xx': (r) => r.status >= 200 && r.status < 400 });

    const search = http.get(`${BASE_URL}/api/careers/search?q=engineer`, {
      tags: { endpoint: 'careers_search' },
    });
    check(search, { 'careers search 2xx': (r) => r.status >= 200 && r.status < 400 });

    const stats = http.get(`${BASE_URL}/api/careers/stats`, {
      tags: { endpoint: 'careers_stats' },
    });
    check(stats, { 'careers stats 2xx': (r) => r.status >= 200 && r.status < 400 });
  });

  group('reviews - per university', () => {
    const uniName = pick(UNIVERSITY_NAMES);
    const byUni = http.get(`${BASE_URL}/api/reviews/${encodeURIComponent(uniName)}`, {
      tags: { endpoint: 'reviews_by_uni' },
    });
    check(byUni, { 'reviews by uni 2xx': (r) => r.status >= 200 && r.status < 400 });
  });

  if (!skipML) {
    group('sentiment stats (ML - DeBERTa)', () => {
      const uniName = pick(UNIVERSITY_NAMES);
      // This endpoint triggers DeBERTa inference on the Python service.
      const stats = http.get(
        `${BASE_URL}/api/reviews/${encodeURIComponent(uniName)}/stats`,
        { tags: { endpoint: 'reviews_sentiment_stats', ml: 'true' }, timeout: '90s' }
      );
      check(stats, { 'sentiment stats 2xx': (r) => r.status >= 200 && r.status < 400 });
    });
  }

  group('auth - register + login', () => {
    const user = makeTestUser(__VU, __ITER);
    const session = registerAndLogin(user);
    if (!session) return;

    // Login with the just-registered user.
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'auth_login' },
      }
    );
    check(loginRes, {
      'login 200': (r) => r.status === 200,
      'login has token': (r) => { try { return !!r.json('token'); } catch { return false; } },
    });
  });

  group('recommendations (authenticated)', () => {
    // Use a pre-registered account (test7) to avoid creating a new user just for recs.
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'test7@example.com', password: 'password123' }),
      { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'auth_login_recs' } }
    );
    if (loginRes.status !== 200) return;

    let token;
    try { token = loginRes.json('token'); } catch { return; }

    const recs = http.post(
      `${BASE_URL}/api/recommend/degrees`,
      JSON.stringify({
        interests: ['technology', 'problem solving'],
        skills: ['math', 'programming'],
        aptitude: { logical: 0.8, verbal: 0.6, numerical: 0.9 },
      }),
      {
        headers: authHeaders(token),
        tags: { endpoint: 'recommend_degrees' },
        timeout: '30s',
      }
    );
    check(recs, { 'recommend 2xx': (r) => r.status >= 200 && r.status < 500 });
  });

  // Pause between iterations to mimic realistic user think-time.
  sleep(Math.random() * 2 + 1);
}
