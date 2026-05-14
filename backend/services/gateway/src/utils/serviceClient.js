import axios from 'axios';
import { serviceRegistry } from './serviceRegistry.js';

/**
 * HTTP Client for inter-service communication
 * Provides methods for making requests to other microservices
 */
class ServiceClient {
  constructor() {
    this.timeout = 30000; // 30 seconds
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

    try {
      const response = await axios({
        method,
        url,
        data,
        params,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: requestTimeout
      });

      return response.data;
    } catch (error) {
      console.error(`Service communication error [${serviceKey}]:`, error.message);
      
      if (error.response) {
        // Service responded with error
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
      } else if (error.request) {
        // No response received
        throw {
          status: 503,
          message: `Service '${serviceKey}' is unavailable`,
          service: serviceKey
        };
      } else {
        // Request setup error
        throw {
          status: 500,
          message: error.message,
          service: serviceKey
        };
      }
    }
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
