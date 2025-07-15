import safeLogger from '../utils/safeLogger';

class ApiConfig {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.environment = import.meta.env.VITE_APP_ENV || 'development';
    this.authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';
    this.isLocal = this.environment === 'development' && this.baseURL.includes('localhost');
    this.authContext = null; // Will be set by AuthProvider
  }

  // Method to set auth context from AuthProvider
  setAuthContext(authContext) {
    this.authContext = authContext;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add auth headers when auth is enabled
    if (this.authEnabled) {
      const token = this.getAuthToken();
      safeLogger.debug('API authentication status', { authEnabled: this.authEnabled, hasToken: !!token });
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        safeLogger.debug('Authorization header added');
      } else {
        safeLogger.debug('No auth token available');
      }
    }

    return headers;
  }

  getAuthToken() {
    // First try to get token from auth context (preferred)
    if (this.authContext && this.authContext.token) {
      safeLogger.debug('Auth token from context', { found: true });
      return this.authContext.token;
    }
    
    // Fallback to sessionStorage for backward compatibility
    const token = sessionStorage.getItem('auth_token');
    safeLogger.debug('Auth token from sessionStorage', { found: !!token });
    return token || null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Always get fresh headers (including token) for each request
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      safeLogger.debug(`API Request: ${options.method || 'GET'} ${endpoint}`, { 
        method: options.method || 'GET',
        endpoint
      });
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle auth errors specifically
        if (response.status === 401 || response.status === 403) {
          if (this.authEnabled) {
            // Will trigger login flow when auth is implemented
            safeLogger.warn('Authentication required for API request', { 
              status: response.status, 
              endpoint 
            });
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      safeLogger.error(`API Error for ${endpoint}`, { 
        status: error.status || error.statusCode,
        message: error.message,
        endpoint
      });
      
      // In local development without auth, provide helpful error messages
      if (this.isLocal && !this.authEnabled && error.message.includes('CORS')) {
        safeLogger.error('CORS Error: Make sure vite proxy is configured correctly');
      }
      
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Safe JSON serialization that handles circular references
  safeStringify(data) {
    const seen = new WeakSet();
    return JSON.stringify(data, (key, value) => {
      // Skip React-specific properties that cause circular references
      if (key.startsWith('__react') || key.startsWith('_react') || key === 'stateNode') {
        return undefined;
      }
      
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      
      // Skip functions and DOM elements
      if (typeof value === 'function' || 
          (value && typeof value === 'object' && value.nodeType)) {
        return undefined;
      }
      
      return value;
    });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: this.safeStringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT', 
      body: this.safeStringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiConfig();

// Export environment helpers
export const isProduction = () => import.meta.env.VITE_APP_ENV === 'production';
export const isDevelopment = () => import.meta.env.VITE_APP_ENV === 'development';
export const isAuthEnabled = () => import.meta.env.VITE_AUTH_ENABLED === 'true';
