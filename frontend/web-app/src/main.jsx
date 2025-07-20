// Initialize Amplify first, before any other imports
import './config/amplifyInit.js';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DirectAuthTest from './components/auth/DirectAuthTest'
import AmplifyInitTest from './components/auth/tests/AmplifyInitTest'
import BasicAuthTest from './components/auth/tests/BasicAuthTest'
import SimpleAuthTest from './components/auth/tests/SimpleAuthTest'
import ApiIntegrationTest from './components/auth/tests/ApiIntegrationTest'
import ErrorHandlingTest from './components/auth/tests/ErrorHandlingTest'
import FullAuthFlowTest from './components/auth/tests/FullAuthFlowTest'
import TestIndex from './components/auth/tests/TestIndex'
import MinimalAuthTest from './components/auth/tests/MinimalAuthTest'
import HeaderDebugger from './components/auth/tests/HeaderDebugger'

// Simple router
const renderApp = () => {
  const path = window.location.pathname;
  
  // Test index
  if (path === '/test' || path === '/test/') {
    return <TestIndex />;
  }
  
  // Test routes
  if (path === '/direct-auth-test') {
    return <DirectAuthTest />;
  }
  
  if (path === '/test/amplify-init') {
    return <AmplifyInitTest />;
  }
  
  if (path === '/test/basic-auth') {
    return <BasicAuthTest />;
  }
  
  if (path === '/test/simple-auth') {
    return <SimpleAuthTest />;
  }
  
  if (path === '/test/api-integration') {
    return <ApiIntegrationTest />;
  }
  
  if (path === '/test/error-handling') {
    return <ErrorHandlingTest />;
  }
  
  if (path === '/test/full-flow') {
    return <FullAuthFlowTest />;
  }
  
  if (path === '/test/minimal-auth') {
    return <MinimalAuthTest />;
  }
  
  if (path === '/test/clean-direct-auth') {
    // Temporarily disabled until AWS SDK is properly installed
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
        <h2 className="text-2xl font-bold mb-4">Clean Direct Auth Test</h2>
        <p className="mb-4 text-gray-600">
          This test is temporarily disabled. Please try the other tests first.
        </p>
        <a 
          href="/test"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Test Index
        </a>
      </div>
    );
  }
  
  if (path === '/test/headers') {
    return <HeaderDebugger />;
  }
  
  // Default route
  return <App />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {renderApp()}
  </StrictMode>,
)
