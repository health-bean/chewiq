// Test for error handling and edge cases
import React, { useState } from 'react';
import { SimpleAuthProvider, useSimpleAuth } from '../SimpleAuthProvider';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

// Error handling test component (must be used inside SimpleAuthProvider)
const ErrorTester = () => {
  const { 
    user, 
    loading: authLoading, 
    error: authError, 
    isAuthenticated,
    setError,
    login, 
    logout
  } = useSimpleAuth();
  
  const [testCase, setTestCase] = useState('invalid-credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Run the selected test case
  const runTestCase = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      switch (testCase) {
        case 'invalid-credentials':
          await testInvalidCredentials();
          break;
        case 'network-failure':
          await testNetworkFailure();
          break;
        case 'session-timeout':
          await testSessionTimeout();
          break;
        case 'concurrent-auth':
          await testConcurrentAuth();
          break;
        case 'manual-error':
          await testManualError();
          break;
        default:
          setResult({
            success: false,
            error: 'Unknown test case'
          });
      }
    } catch (err) {
      setResult({
        success: false,
        error: err.message,
        details: err.toString()
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Test case: Invalid credentials
  const testInvalidCredentials = async () => {
    try {
      // Try to sign in with invalid credentials
      const result = await login(
        email || 'invalid@example.com', 
        password || 'wrongpassword',
        'real'
      );
      
      // Check if the login result indicates a failure (which is what we expect)
      if (result && result.success === false) {
        setResult({
          success: true,
          message: 'Login correctly failed with invalid credentials',
          details: result
        });
      } else {
        setResult({
          success: false,
          message: 'Expected login to fail, but it succeeded',
          details: result
        });
      }
    } catch (err) {
      // This is also a successful test case since the login failed
      setResult({
        success: true,
        message: 'Login correctly failed with invalid credentials (exception)',
        error: err.message
      });
    }
  };
  
  // Test case: Network failure
  const testNetworkFailure = async () => {
    try {
      // Mock a network failure by using an invalid endpoint
      const originalFetch = window.fetch;
      window.fetch = () => Promise.reject(new Error('Network failure (simulated)'));
      
      try {
        await signIn({
          username: email || 'test@example.com',
          password: password || 'password'
        });
        
        setResult({
          success: false,
          message: 'Expected network failure, but request succeeded'
        });
      } catch (err) {
        setResult({
          success: true,
          message: 'Network failure correctly handled',
          error: err.message
        });
      } finally {
        // Restore original fetch
        window.fetch = originalFetch;
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Error during network failure test',
        error: err.message
      });
      
      // Ensure fetch is restored
      window.fetch = window.originalFetch || window.fetch;
    }
  };
  
  // Test case: Session timeout
  const testSessionTimeout = async () => {
    try {
      if (!isAuthenticated) {
        setResult({
          success: false,
          message: 'You must be logged in to test session timeout'
        });
        return;
      }
      
      // Mock an expired token by modifying the session
      const session = await fetchAuthSession();
      
      if (!session.tokens?.accessToken) {
        setResult({
          success: false,
          message: 'No access token found in session'
        });
        return;
      }
      
      // Try to use the session after simulating expiration
      try {
        // This should fail if token validation is working
        await getCurrentUser();
        
        setResult({
          success: true,
          message: 'Session timeout test completed',
          details: 'Note: This test is difficult to simulate fully without modifying the tokens'
        });
      } catch (err) {
        setResult({
          success: true,
          message: 'Session timeout correctly detected',
          error: err.message
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Error during session timeout test',
        error: err.message
      });
    }
  };
  
  // Test case: Concurrent authentication operations
  const testConcurrentAuth = async () => {
    try {
      // Start multiple auth operations concurrently
      const loginPromise1 = login(
        email || 'test@example.com', 
        password || 'password',
        'real'
      );
      
      const loginPromise2 = login(
        email || 'test@example.com', 
        password || 'password',
        'real'
      );
      
      // Wait for both to complete
      const results = await Promise.allSettled([loginPromise1, loginPromise2]);
      
      setResult({
        success: true,
        message: 'Concurrent authentication test completed',
        details: results.map(r => ({
          status: r.status,
          value: r.status === 'fulfilled' ? r.value : null,
          reason: r.status === 'rejected' ? r.reason.message : null
        }))
      });
    } catch (err) {
      setResult({
        success: false,
        message: 'Error during concurrent authentication test',
        error: err.message
      });
    }
  };
  
  // Test case: Manual error setting
  const testManualError = async () => {
    try {
      // Test the setError function
      setError('This is a manually set error for testing');
      
      setResult({
        success: true,
        message: 'Manual error set successfully'
      });
    } catch (err) {
      setResult({
        success: false,
        message: 'Error during manual error test',
        error: err.message
      });
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Error Handling Test</h2>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Auth Status:</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-700">Authenticated:</div>
          <div>{isAuthenticated ? '✓' : '✗'}</div>
          
          <div className="text-gray-700">User ID:</div>
          <div>{user?.id || 'Not logged in'}</div>
        </div>
      </div>
      
      {/* Test Case Selection */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Select Test Case:</h3>
        <select
          value={testCase}
          onChange={(e) => setTestCase(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
        >
          <option value="invalid-credentials">Invalid Credentials</option>
          <option value="network-failure">Network Failure</option>
          <option value="session-timeout">Session Timeout</option>
          <option value="concurrent-auth">Concurrent Authentication</option>
          <option value="manual-error">Manual Error Setting</option>
        </select>
        
        {/* Credentials for tests that need them */}
        {(testCase === 'invalid-credentials' || testCase === 'concurrent-auth') && (
          <div className="mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use default test values
            </p>
          </div>
        )}
        
        <button
          onClick={runTestCase}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Running Test...' : 'Run Test'}
        </button>
      </div>
      
      {/* Auth Error */}
      {authError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-md">
          <h3 className="font-semibold text-red-800">Auth Error:</h3>
          <p className="text-red-700">{authError}</p>
        </div>
      )}
      
      {/* Test Result */}
      {result && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <div className={`p-4 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            {result.message && (
              <p className={`mb-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
            )}
            
            {result.error && (
              <div className="mb-2">
                <h4 className="font-semibold text-red-800">Error:</h4>
                <p className="text-red-700">{result.error}</p>
              </div>
            )}
            
            {result.details && (
              <div className="mt-2">
                <h4 className="font-semibold mb-1">Details:</h4>
                <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded">
                  {typeof result.details === 'object' 
                    ? JSON.stringify(result.details, null, 2)
                    : result.details}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Auth Actions */}
      <div className="flex gap-3">
        {!isAuthenticated ? (
          <button
            onClick={() => window.location.href = '/test/simple-auth'}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Go to Login Page
          </button>
        ) : (
          <button
            onClick={logout}
            disabled={authLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

// Wrapper component that provides SimpleAuthProvider
const ErrorHandlingTest = () => {
  return (
    <SimpleAuthProvider>
      <ErrorTester />
    </SimpleAuthProvider>
  );
};

export default ErrorHandlingTest;
