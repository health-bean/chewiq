// Clean direct authentication test using AWS SDK
import React, { useState } from 'react';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

// Cognito configuration
const REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_vr1pPiP6N';
const CLIENT_ID = '5luhu590qnjdgi7579k1mqoct9';

// Create a Cognito Identity Provider client
const client = new CognitoIdentityProviderClient({ region: REGION });

const CleanDirectAuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('🔑 Direct sign in with:', { email });
      
      // Create the auth command
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      });
      
      // Send the command
      const response = await client.send(command);
      
      console.log('✅ Direct sign in successful');
      
      const authResult = {
        success: true,
        authResult: response.AuthenticationResult,
        challengeName: response.ChallengeName,
        session: response.Session
      };
      
      setResult(authResult);
    } catch (err) {
      console.error('❌ Direct sign in error:', err);
      setError(err.message);
      setResult({
        success: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Clean Direct Auth Test</h2>
      <p className="mb-4 text-gray-600">
        This test uses the AWS SDK directly, bypassing Amplify.
      </p>
      
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
            {result.success ? (
              <div>
                <p className="mb-2 text-green-700">✅ Authentication successful!</p>
                <div className="mt-4">
                  <h4 className="font-semibold mb-1">Auth Tokens:</h4>
                  <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded">
                    {JSON.stringify({
                      idToken: result.authResult?.IdToken ? '✓ Present' : '✗ Missing',
                      accessToken: result.authResult?.AccessToken ? '✓ Present' : '✗ Missing',
                      refreshToken: result.authResult?.RefreshToken ? '✓ Present' : '✗ Missing',
                      expiresIn: result.authResult?.ExpiresIn || 'N/A',
                      tokenType: result.authResult?.TokenType || 'N/A'
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-red-700">{result.error}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Next steps */}
      {result && result.success && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold mb-2">Next Steps:</h3>
          <p className="mb-2">
            Authentication was successful using the direct AWS SDK approach.
            This confirms that your Cognito user pool and credentials are working correctly.
          </p>
          <p>
            The issue is likely with how Amplify is being configured in your application.
            Consider using this direct approach in your application if Amplify continues to cause issues.
          </p>
        </div>
      )}
    </div>
  );
};

export default CleanDirectAuthTest;
