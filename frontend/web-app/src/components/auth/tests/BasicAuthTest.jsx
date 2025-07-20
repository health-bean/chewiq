// Basic test for Amplify authentication operations
import React, { useState, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

// Import our Amplify initialization
import '../../../config/amplifyInit';

const BasicAuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [operation, setOperation] = useState('');

  // Check for existing user session on load
  useEffect(() => {
    checkCurrentUser();
  }, []);

  // Check if user is already signed in
  const checkCurrentUser = async () => {
    setOperation('getCurrentUser');
    setLoading(true);
    setError(null);
    
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setResult({ success: true, message: 'User is signed in' });
      console.log('✅ Current user:', user);
      
      // Also fetch the session if user is signed in
      try {
        const authSession = await fetchAuthSession();
        setSession(authSession);
        console.log('✅ Auth session:', authSession);
      } catch (sessionError) {
        console.error('❌ Error fetching session:', sessionError);
      }
    } catch (err) {
      console.log('ℹ️ No current user');
      setCurrentUser(null);
      setSession(null);
      setResult({ success: false, message: 'No user is currently signed in' });
    } finally {
      setLoading(false);
    }
  };

  // Sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setOperation('signIn');
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('🔑 Signing in with:', { email });
      
      // Use CUSTOM_AUTH flow instead of USER_PASSWORD_AUTH to avoid device tracking issues
      const signInResult = await signIn({
        username: email,
        password: password,
        options: {
          // Use a different auth flow that doesn't require device tracking
          authFlowType: 'USER_SRP_AUTH'
        }
      });
      
      console.log('✅ Sign in result:', signInResult);
      setResult({ success: true, data: signInResult });
      
      // Refresh current user
      await checkCurrentUser();
    } catch (err) {
      console.error('❌ Sign in error:', err);
      setError(err.message);
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    setOperation('signOut');
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      await signOut();
      console.log('✅ Signed out successfully');
      setCurrentUser(null);
      setSession(null);
      setResult({ success: true, message: 'Signed out successfully' });
    } catch (err) {
      console.error('❌ Sign out error:', err);
      setError(err.message);
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Refresh session
  const handleRefreshSession = async () => {
    setOperation('fetchAuthSession');
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const authSession = await fetchAuthSession();
      setSession(authSession);
      console.log('✅ Auth session refreshed:', authSession);
      setResult({ success: true, message: 'Session refreshed successfully' });
    } catch (err) {
      console.error('❌ Session refresh error:', err);
      setError(err.message);
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Basic Auth Operations Test</h2>
      
      {/* Current User Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Current Status:</h3>
        {currentUser ? (
          <div className="text-green-700">
            ✅ Signed in as: {currentUser.username || currentUser.userId}
          </div>
        ) : (
          <div className="text-gray-700">Not signed in</div>
        )}
      </div>
      
      {/* Sign In Form */}
      {!currentUser && (
        <form onSubmit={handleSignIn} className="mb-6">
          <h3 className="font-semibold mb-2">Sign In:</h3>
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
            disabled={loading && operation === 'signIn'}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && operation === 'signIn' ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      )}
      
      {/* Actions for signed-in users */}
      {currentUser && (
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={handleSignOut}
            disabled={loading && operation === 'signOut'}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading && operation === 'signOut' ? 'Signing Out...' : 'Sign Out'}
          </button>
          
          <button
            onClick={handleRefreshSession}
            disabled={loading && operation === 'fetchAuthSession'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && operation === 'fetchAuthSession' ? 'Refreshing...' : 'Refresh Session'}
          </button>
          
          <button
            onClick={checkCurrentUser}
            disabled={loading && operation === 'getCurrentUser'}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading && operation === 'getCurrentUser' ? 'Checking...' : 'Check Current User'}
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
            {result.data && (
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
      
      {/* Session info */}
      {session && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Session Info:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify({
                hasIdToken: !!session.tokens?.idToken,
                hasAccessToken: !!session.tokens?.accessToken,
                hasRefreshToken: !!session.tokens?.refreshToken,
                expiresAt: session.tokens?.accessToken?.payload?.exp
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicAuthTest;
