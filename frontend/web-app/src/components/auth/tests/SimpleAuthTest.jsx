// Test for AuthProvider in isolation
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../../../contexts/AuthProvider';

// Auth test component (must be used inside AuthProvider)
const AuthTester = () => {
  const { 
    user, 
    loading, 
    error, 
    isAuthenticated, 
    isDemoMode, 
    isRealUser,
    login, 
    loginDemo, 
    loginReal, 
    logout,
    getUserContext,
    getAuthToken,
    getAuthHeaders
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('real');
  const [result, setResult] = useState(null);
  const [userContext, setUserContext] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authHeaders, setAuthHeaders] = useState(null);
  
  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setResult(null);
    
    try {
      const loginResult = await login(email, password, loginType);
      setResult(loginResult);
      console.log('Login result:', loginResult);
      
      // If login successful, get user context and auth info
      if (loginResult.success) {
        updateAuthInfo();
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
      console.error('Login error:', err);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setResult({ success: true, message: 'Logged out successfully' });
      setUserContext(null);
      setAuthToken(null);
      setAuthHeaders(null);
    } catch (err) {
      setResult({ success: false, error: err.message });
      console.error('Logout error:', err);
    }
  };
  
  // Update auth info
  const updateAuthInfo = () => {
    const context = getUserContext();
    const token = getAuthToken();
    const headers = getAuthHeaders();
    
    setUserContext(context);
    setAuthToken(token);
    setAuthHeaders(headers);
  };
  
  // Check auth info on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      updateAuthInfo();
    }
  }, [isAuthenticated]);
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">AuthProvider Test</h2>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Auth Status:</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-700">Loading:</div>
          <div>{loading ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">Authenticated:</div>
          <div>{isAuthenticated ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">Demo Mode:</div>
          <div>{isDemoMode ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">Real User:</div>
          <div>{isRealUser ? '✓' : '✗'}</div>
        </div>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">User Info:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify(user, null, 2)}
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
          <div className="mb-3">
            <select
              value={loginType}
              onChange={(e) => setLoginType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="real">Real User</option>
              <option value="demo">Demo User</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
      )}
      
      {/* Logout Button (if authenticated) */}
      {isAuthenticated && (
        <div className="mb-6">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Logging Out...' : 'Logout'}
          </button>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-md">
          <h3 className="font-semibold text-red-800">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Result display */}
      {result && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Result:</h3>
          <div className={`p-4 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            {result.message && <p className="mb-2">{result.message}</p>}
            {result.error && <p className="mb-2 text-red-700">{result.error}</p>}
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {/* User Context */}
      {userContext && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">User Context:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify(userContext, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {/* Auth Token */}
      {authToken && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Auth Token:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-20">
            <p className="text-xs break-all">{authToken}</p>
          </div>
        </div>
      )}
      
      {/* Auth Headers */}
      {authHeaders && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Auth Headers:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify(authHeaders, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that provides AuthProvider
const SimpleAuthTest = () => {
  return (
    <AuthProvider>
      <AuthTester />
    </AuthProvider>
  );
};

export default SimpleAuthTest;
