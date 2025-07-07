// File: frontend/shared/components/AuthProvider.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Verify existing token on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check for stored tokens
        const storedToken = localStorage.getItem('auth_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          console.log('Found stored auth data, verifying...');
          
          try {
            // Parse stored user
            const parsedUser = JSON.parse(storedUser);
            
            // Verify token is still valid
            const isValid = await verifyStoredToken(storedToken);
            
            if (isValid) {
              console.log('Stored token is valid, restoring session');
              setToken(storedToken);
              setRefreshToken(storedRefreshToken);
              setUser(parsedUser);
            } else if (storedRefreshToken) {
              console.log('Access token expired, attempting refresh...');
              await attemptTokenRefresh(storedRefreshToken);
            } else {
              console.log('Token invalid and no refresh token, clearing storage');
              clearAuthStorage();
            }
          } catch (error) {
            console.error('Error parsing stored auth data:', error);
            clearAuthStorage();
          }
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
        clearAuthStorage();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Helper function to verify stored token
  const verifyStoredToken = async (tokenToVerify) => {
    try {
      const response = await apiClient.get('/api/v1/auth/verify', {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });
      return response?.valid === true;
    } catch (error) {
      console.log('Token verification failed:', error);
      return false;
    }
  };

  // Helper function to attempt token refresh
  const attemptTokenRefresh = async (storedRefreshToken) => {
    try {
      const response = await apiClient.post('/api/v1/auth/refresh', {
        refreshToken: storedRefreshToken
      });

      if (response?.token && response?.refreshToken) {
        console.log('Token refresh successful');
        const storedUser = JSON.parse(localStorage.getItem('user'));
        
        // Update tokens
        setToken(response.token);
        setRefreshToken(response.refreshToken);
        setUser(storedUser);
        
        // Update localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('refresh_token', response.refreshToken);
        
        return true;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthStorage();
      return false;
    }
  };

  // Helper function to clear auth storage
  const clearAuthStorage = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setError(null);
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for:', email);
      
      const response = await apiClient.post('/api/v1/auth/login', {
        email,
        password
      });

      if (response?.user && response?.token) {
        console.log('Login successful:', response.user);
        
        // Set state
        setUser(response.user);
        setToken(response.token);
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken);
        }
        
        // Save to localStorage for persistence
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken);
        }
        
        return { success: true, user: response.user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call backend logout endpoint
      if (token) {
        await apiClient.post('/api/v1/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      console.log('Logout successful');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout anyway
    } finally {
      // Always clear auth state and storage
      clearAuthStorage();
      setLoading(false);
    }
  };

  // Verify token (for checking if still valid)
  const verifyToken = async () => {
    if (!token) return false;
    
    try {
      const response = await apiClient.get('/api/v1/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response?.valid === true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Auto-refresh token before it expires (optional enhancement)
  useEffect(() => {
    if (!token || !refreshToken) return;

    // Set up automatic token refresh 2 minutes before expiry
    // Since your tokens expire in 15 minutes, refresh after 13 minutes
    const refreshInterval = setInterval(async () => {
      console.log('Auto-refreshing token...');
      await attemptTokenRefresh(refreshToken);
    }, 13 * 60 * 1000); // 13 minutes

    return () => clearInterval(refreshInterval);
  }, [token, refreshToken]);

  // Auth context value
  const value = {
    user,
    token,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    verifyToken,
    getAuthHeaders,
    setError // For clearing errors
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the context for the hook
export { AuthContext };