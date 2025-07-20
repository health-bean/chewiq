// Direct authentication test component
import React, { useState } from 'react';
import { signIn, checkUser } from '../../utils/directAuth';

const DirectAuthTest = () => {
  const [email, setEmail] = useState('deebyrne26@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userCheckResult, setUserCheckResult] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const authResult = await signIn(email, password);
      setResult(authResult);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUser = async () => {
    setLoading(true);
    setUserCheckResult(null);
    
    try {
      const checkResult = await checkUser(email);
      setUserCheckResult(checkResult);
    } catch (error) {
      setUserCheckResult({ exists: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Direct Auth Test</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Check User</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Email"
          />
          <button
            onClick={handleCheckUser}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check User'}
          </button>
        </div>
        
        {userCheckResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h4 className="font-semibold">
              {userCheckResult.exists ? '✅ User Exists' : '❌ User Not Found'}
            </h4>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(userCheckResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSignIn} className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Sign In</h3>
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Email"
            required
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Password"
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
      
      {result && (
        <div className="p-4 bg-gray-100 rounded-md">
          <h4 className="font-semibold">
            {result.success ? '✅ Sign In Successful' : '❌ Sign In Failed'}
          </h4>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DirectAuthTest;
