import axios from 'axios';
import { serviceRegistry } from './serviceRegistry.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Render cold starts often return 502/503 until the container is ready. */
function isRetriableUpstreamError(error) {
  if (error.response) {
    const s = error.response.status;
    return s === 502 || s === 503 || s === 504;
  }
  if (error.request) return true;
  const code = error.code;
  return code === 'ECONNABORTED' || code === 'ECONNRESET' || code === 'ETIMEDOUT';
}

/**
 * HTTP Client for inter-service communication
 * Provides methods for making requests to other microservices
 */
class ServiceClient {
  constructor() {
    // Render free tier cold starts can exceed 30s; gateway → service calls need a longer budget.
    this.timeout = 120000; // 120 seconds
    this.maxRetries = 3;
  }

  /**
   * Make a request to a specific service
   */
  async request(serviceKey, options) {
    const service = serviceRegistry.getService(serviceKey);
    
    if (!service) {
      throw new Error(`Service '${serviceKey}' not found in registry`);
    }

    const { method = 'GET', path = '', data, headers = {}, params, timeout } = options;
    const url = `${service.url}${path}`;

    // Use custom timeout if provided, otherwise use default
    const requestTimeout = timeout !== undefined ? timeout : this.timeout;

    const axiosConfig = {
      method,
      url,
      data,
      params,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: requestTimeout
    };

    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios(axiosConfig);
        return response.data;
      } catch (error) {
        lastError = error;
        const retriable = isRetriableUpstreamError(error);
        if (!retriable || attempt === this.maxRetries) {
          break;
        }
        const waitMs = 1500 * (attempt + 1);
        console.warn(
          `[gateway→${serviceKey}] transient error (${error.message}), attempt ${attempt + 2}/${this.maxRetries + 1} after ${waitMs}ms`
        );
        await sleep(waitMs);
      }
    }

    const error = lastError;
    console.error(`Service communication error [${serviceKey}]:`, error.message);

    if (error.response) {
      const d = error.response.data;
      let fallback = 'Service error';
      if (typeof d === 'string' && d.trim()) {
        fallback = d.length > 200 ? `${d.slice(0, 200)}…` : d;
      } else if (d && typeof d === 'object') {
        fallback = d.message || d.error || fallback;
      }
      throw {
        status: error.response.status,
        message: (typeof d === 'object' && d !== null)
          ? (d.message || d.error || fallback)
          : fallback,
        service: serviceKey,
        data: d
      };
    }
    if (error.request) {
      throw {
        status: 503,
        message: `Service '${serviceKey}' is unavailable`,
        service: serviceKey
      };
    }
    throw {
      status: 500,
      message: error.message,
      service: serviceKey
    };
  }

  /**
   * GET request to a service
   */
  async get(serviceKey, path, params = {}, headers = {}) {
    return this.request(serviceKey, { method: 'GET', path, params, headers });
  }

  /**
   * POST request to a service
   */
  async post(serviceKey, path, data, headers = {}) {
    return this.request(serviceKey, { method: 'POST', path, data, headers });
  }

  /**
   * PUT request to a service
   */
  async put(serviceKey, path, data, headers = {}) {
    return this.request(serviceKey, { method: 'PUT', path, data, headers });
  }

  /**
   * DELETE request to a service
   */
  async delete(serviceKey, path, headers = {}) {
    return this.request(serviceKey, { method: 'DELETE', path, headers });
  }

  /**
   * PATCH request to a service
   */
  async patch(serviceKey, path, data, headers = {}) {
    return this.request(serviceKey, { method: 'PATCH', path, data, headers });
  }

  /**
   * Check service health
   */
  async checkHealth(serviceKey) {
    const service = serviceRegistry.getService(serviceKey);
    if (!service) return false;

    try {
      await axios.get(`${service.url}${service.healthEndpoint}`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Forward authenticated request with user context
   */
  async forwardWithAuth(serviceKey, options, user) {
    const headers = {
      ...options.headers,
      'X-User-Id': user?.id || '',
      'X-User-Email': user?.email || '',
      'X-User-Role': user?.role || 'user'
    };

    return this.request(serviceKey, { ...options, headers });
  }
}

export const serviceClient = new ServiceClient();
