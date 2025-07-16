// File: frontend/shared/utils/apiClient.js
// Enhanced API client with Cognito token + Demo mode support

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.health-platform.com';

// Simple logger
const logger = {
  debug: (msg, data) => console.log(`[API] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[API] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[API] ${msg}`, data || '')
};

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authContext = null;
  }

  // Set authentication context (called by auth provider)
  setAuthContext(authContext) {
    this.authContext = authContext;
    logger.debug('Auth context updated', { 
      hasAuth: !!authContext,
      isDemo: authContext?.isDemo,
      hasToken: !!authContext?.token
    });
  }

  // Get appropriate headers based on auth type
  getAuthHeaders() {
    if (!this.authContext) {
      logger.debug('No auth context - no auth headers');
      return {};
    }

    if (this.authContext.isDemo) {
      // Demo mode - use demo headers
      const headers = {
        'X-Demo-Mode': 'true',
        'X-Demo-User-Id': this.authContext.userId,
      };
      
      if (this.authContext.sessionId) {
        headers['X-Demo-Session-Id'] = this.authContext.sessionId;
      }
      
      logger.debug('Using demo auth headers', { userId: this.authContext.userId });
      return headers;
    } else {
      // Real user - use Cognito token
      if (this.authContext.token) {
        logger.debug('Using Cognito auth token');
        return {
          'Authorization': `Bearer ${this.authContext.token}`
        };
      } else {
        logger.warn('Real user but no token available');
        return {};
      }
    }
  }

  // Generic request method
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers
      };

      // Prepare request options
      const requestOptions = {
        ...options,
        headers
      };

      logger.debug('API request', { 
        method: options.method || 'GET',
        endpoint,
        hasAuth: Object.keys(this.getAuthHeaders()).length > 0
      });

      const response = await fetch(url, requestOptions);
      
      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const data = await response.json();
      
      logger.debug('API response success', { 
        endpoint,
        status: response.status
      });

      return data;

    } catch (error) {
      logger.error('API request failed', { 
        endpoint,
        error: error.message,
        status: error.status
      });
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Health-specific API methods
  async getProtocols() {
    return this.get('/protocols');
  }

  async getUserPreferences() {
    return this.get('/user/preferences');
  }

  async updateUserPreferences(preferences) {
    return this.put('/user/preferences', preferences);
  }

  async getTimelineEntries(date) {
    return this.get(`/timeline/entries?date=${date}`);
  }

  async addTimelineEntry(entry) {
    return this.post('/timeline/entries', entry);
  }

  async getReflectionData(date) {
    return this.get(`/reflections?date=${date}`);
  }

  async saveReflectionData(date, data) {
    return this.post('/reflections', { date, ...data });
  }

  async getCorrelationInsights() {
    return this.get('/insights/correlations');
  }

  async getUserProfile() {
    return this.get('/user/profile');
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
