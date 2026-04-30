import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config.js';

// Registers a new user against the gateway and returns their JWT.
// Returns `null` on failure (so the VU can keep running rather than aborting).
export function registerAndLogin(user) {
  const payload = JSON.stringify(user);
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'auth_register' },
  };

  const res = http.post(`${BASE_URL}/api/auth/register`, payload, params);
  const ok = check(res, {
    'register: 201 or 200': (r) => r.status === 201 || r.status === 200,
    'register: has token': (r) => {
      try { return !!r.json('token'); } catch { return false; }
    },
  });

  if (!ok) return null;

  try {
    return {
      token: res.json('token'),
      user: res.json('user'),
    };
  } catch {
    return null;
  }
}

// Authenticated header helper
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
