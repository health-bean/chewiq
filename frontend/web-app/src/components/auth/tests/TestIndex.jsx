// Test index page
import React from 'react';

const TestIndex = () => {
  const tests = [
    {
      name: 'Auth Headers Debugger',
      path: '/test/headers',
      description: 'Shows the authentication headers being sent to the API to help diagnose 401 errors.'
    },
    {
      name: 'Clean Direct Auth Test',
      path: '/test/clean-direct-auth',
      description: 'A clean implementation of direct authentication using the AWS SDK, bypassing Amplify.'
    },
    {
      name: 'Minimal Auth Test',
      path: '/test/minimal-auth',
      description: 'A simplified test that focuses solely on authentication with explicit configuration.'
    },
    {
      name: 'Amplify Initialization Test',
      path: '/test/amplify-init',
      description: 'Tests that Amplify is properly initialized with the correct configuration.'
    },
    {
      name: 'Basic Auth Operations Test',
      path: '/test/basic-auth',
      description: 'Tests basic authentication operations like signIn, signOut, getCurrentUser, and fetchAuthSession.'
    },
    {
      name: 'AuthProvider Test',
      path: '/test/simple-auth',
      description: 'Tests the AuthProvider component in isolation.'
    },
    {
      name: 'API Integration Test',
      path: '/test/api-integration',
      description: 'Tests the integration between authentication and API calls.'
    },
    {
      name: 'Error Handling Test',
      path: '/test/error-handling',
      description: 'Tests error handling and edge cases in the authentication system.'
    },
    {
      name: 'Full Authentication Flow Test',
      path: '/test/full-flow',
      description: 'Tests the complete authentication flow from login to protected content to logout.'
    },
    {
      name: 'Direct Auth Test',
      path: '/direct-auth-test',
      description: 'Tests direct authentication with the AWS SDK (bypassing Amplify).'
    }
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Suite</h1>
      
      <p className="mb-6 text-gray-700">
        This test suite helps you verify that your authentication system is working correctly.
        Click on each test to run it individually.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        {tests.map((test, index) => (
          <a
            key={index}
            href={test.path}
            className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-600">{test.name}</h2>
            <p className="text-gray-600">{test.description}</p>
          </a>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Testing Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Start with the <strong>Amplify Initialization Test</strong> to verify your configuration.</li>
          <li>Then test <strong>Basic Auth Operations</strong> to ensure core authentication functions work.</li>
          <li>Test the <strong>AuthProvider</strong> to verify your auth context works correctly.</li>
          <li>Test <strong>API Integration</strong> to ensure authenticated API calls work.</li>
          <li>Test <strong>Error Handling</strong> to verify your system handles edge cases.</li>
          <li>Finally, test the <strong>Full Authentication Flow</strong> to verify the complete user experience.</li>
        </ol>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Amplify Upgrade</h2>
        <p className="mb-2">
          The authentication system has been upgraded to use the full <code>aws-amplify</code> package instead of individual modules.
          This should resolve the "Auth UserPool not configured" error.
        </p>
        <p>
          If you still encounter issues, the <strong>Clean Direct Auth Test</strong> provides a reliable alternative
          using the AWS SDK directly.
        </p>
      </div>
      
      <div className="mt-6 text-center">
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700"
        >
          Back to Main App
        </a>
      </div>
    </div>
  );
};

export default TestIndex;
