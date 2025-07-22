// Test for API integration with authentication
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../../../contexts/AuthProvider';
import { apiClient } from '../../../../../shared/services/api';

// API test component (must be used inside SimpleAuthProvider)
const ApiTester = () => {
  const { 
    user, 
    loading: authLoading, 
    error: authError, 
    isAuthenticated,
    isDemoMode,
    login, 
    logout
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('/user/profile');
  const [apiResult, setApiResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  
  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Use real login with device tracking disabled
      const loginResult = await login(email, password, 'real');
      console.log('Login result:', loginResult);
    } catch (err) {
      console.error('Login error:', err);
    }
  };
  
  // Handle API call
  const handleApiCall = async () => {
    setApiLoading(true);
    setApiResult(null);
    setApiError(null);
    
    try {
      console.log('Making API call to:', apiEndpoint);
      
      // Make API call using the apiClient
      const result = await apiClient.get(apiEndpoint);
      
      console.log('API result:', result);
      setApiResult(result);
    } catch (err) {
      console.error('API error:', err);
      setApiError(err.message || 'API call failed');
    } finally {
      setApiLoading(false);
    }
  };
  
  // Get API client status
  const getApiClientStatus = () => {
    // Check if the API client has auth headers and token getter
    const hasHeaderGetter = typeof apiClient.getHeaders === 'function';
    const hasTokenGetter = typeof apiClient.getToken === 'function';
    const hasUserContext = apiClient.getUserContext && apiClient.getUserContext() !== null;
    
    return {
      hasHeaderGetter,
      hasTokenGetter,
      hasUserContext,
      userContext: apiClient.getUserContext ? apiClient.getUserContext() : null
    };
  };
  
  const [apiClientStatus, setApiClientStatus] = useState(getApiClientStatus());
  
  // Update API client status when auth state changes
  useEffect(() => {
    setApiClientStatus(getApiClientStatus());
  }, [isAuthenticated, user]);
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">API Integration Test</h2>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Auth Status:</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-700">Authenticated:</div>
          <div>{isAuthenticated ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">Demo Mode:</div>
          <div>{isDemoMode ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">User ID:</div>
          <div>{user?.id || 'Not logged in'}</div>
        </div>
      </div>
      
      {/* API Client Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">API Client Status:</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-700">Has Header Getter:</div>
          <div>{apiClientStatus.hasHeaderGetter ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">Has Token Getter:</div>
          <div>{apiClientStatus.hasTokenGetter ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">Has User Context:</div>
          <div>{apiClientStatus.hasUserContext ? '✓' : '✗'}</div>
        </div>
      </div>
      
      {/* User Context */}
      {apiClientStatus.userContext && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">API Client User Context:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify(apiClientStatus.userContext, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {/* Login Form (if not authenticated) */}
      {!isAuthenticated && (
        <form onSubmit={handleLogin} className="mb-6">
          <h3 className="font-semibold mb-2">Login:</h3>
          <div className="mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {authLoading ? 'Logging In...' : 'Login'}
          </button>
        </form>
      )}
      
      {/* API Test (if authenticated) */}
      {isAuthenticated && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Test API Call:</h3>
          <div className="mb-3">
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="API Endpoint"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: /user/profile, /user/preferences, etc.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleApiCall}
              disabled={apiLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {apiLoading ? 'Loading...' : 'Make API Call'}
            </button>
            <button
              onClick={logout}
              disabled={authLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
      
      {/* Auth Error */}
      {authError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-md">
          <h3 className="font-semibold text-red-800">Auth Error:</h3>
          <p className="text-red-700">{authError}</p>
        </div>
      )}
      
      {/* API Error */}
      {apiError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-md">
          <h3 className="font-semibold text-red-800">API Error:</h3>
          <p className="text-red-700">{apiError}</p>
        </div>
      )}
      
      {/* API Result */}
      {apiResult && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">API Result:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify(apiResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that provides AuthProvider
const ApiIntegrationTest = () => {
  return (
    <AuthProvider>
      <ApiTester />
    </AuthProvider>
  );
};

export default ApiIntegrationTest;
