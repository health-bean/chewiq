class ApiConfig {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.environment = import.meta.env.VITE_APP_ENV || 'development';
    this.authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';
    this.isLocal = this.environment === 'development' && this.baseURL.includes('localhost');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add auth headers when auth is enabled
    if (this.authEnabled) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  getAuthToken() {
    // Will implement this when adding auth
    return localStorage.getItem('auth_token') || null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      console.log(`[API] ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle auth errors specifically
        if (response.status === 401 || response.status === 403) {
          if (this.authEnabled) {
            // Will trigger login flow when auth is implemented
            console.warn('Authentication required');
            // For now, just throw the error
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      
      // In local development without auth, provide helpful error messages
      if (this.isLocal && !this.authEnabled && error.message.includes('CORS')) {
        console.error('💡 CORS Error: Make sure vite proxy is configured correctly');
      }
      
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT', 
      body: JSON.stringify(data),
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
