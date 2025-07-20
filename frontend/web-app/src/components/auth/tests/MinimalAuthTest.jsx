// Minimal authentication test component
import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

const MinimalAuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Configure Amplify directly in this component
  const configureAmplify = () => {
    try {
      // Configure Amplify
      const amplifyConfig = {
        Auth: {
          Cognito: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_vr1pPiP6N',
            userPoolClientId: '5luhu590qnjdgi7579k1mqoct9',
            loginWith: {
              email: true,
              username: false,
              phone: false
            },
            authenticationFlowType: 'USER_PASSWORD_AUTH'
          }
        }
      };
      
      Amplify.configure(amplifyConfig);
      setResult({ success: true, message: 'Amplify configured successfully' });
    } catch (err) {
      setError(err.message);
      setResult({ success: false, error: err.message });
    }
  };
  
  // Handle sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('🔑 Signing in with:', { email });
      
      const signInResult = await signIn({
        username: email,
        password: password,
        options: {
          authFlowType: 'USER_SRP_AUTH'
        }
      });
      
      console.log('✅ Sign in result:', signInResult);
      setResult({ success: true, data: signInResult });
    } catch (err) {
      console.error('❌ Sign in error:', err);
      setError(err.message);
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Minimal Auth Test</h2>
      
      {/* Configure Amplify */}
      <div className="mb-6">
        <button
          onClick={configureAmplify}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Configure Amplify
        </button>
      </div>
      
      {/* Sign In Form */}
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
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
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
    </div>
  );
};

export default MinimalAuthTest;
