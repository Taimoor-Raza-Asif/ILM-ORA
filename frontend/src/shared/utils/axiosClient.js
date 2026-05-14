// frontend/src/shared/utils/axiosClient.js
import axios from "axios";

// Vite provides import.meta.env typings by default; no need to redeclare them

/**
 * Prefer VITE_API_URL when set (any environment).
 * On production builds served from ilm-ora.tech, call the Render gateway directly so
 * requests skip the Vercel → Render rewrite (often surfaces as 502 on cold starts).
 */
function resolveApiBaseURL() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined" && import.meta.env.PROD) {
    const host = window.location.hostname;
    if (host === "ilm-ora.tech" || host === "www.ilm-ora.tech") {
      return "https://ilm-ora-gateway.onrender.com/api";
    }
  }

  return "/api";
}

export const axiosClient = axios.create({
  baseURL: resolveApiBaseURL(),
  headers: {
    "Content-Type": "application/json"
  },
  // Match gateway→service budget; Render free tier cold starts can exceed 30s.
  timeout: 120000
});

// Request interceptor
axiosClient.interceptors.request.use(config => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor
axiosClient.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    // Clear all frontend auth storage keys used by authStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("ilm_ora_token");
    localStorage.removeItem("ilm_ora_user");
    window.location.href = "/auth";
  }
  return Promise.reject(error);
});