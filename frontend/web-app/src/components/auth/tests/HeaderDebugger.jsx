// HeaderDebugger.jsx - A component to debug authentication headers
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../../../contexts/AuthProvider';

const HeaderDebugger = () => {
  const { isAuthenticated, getAuthToken, getAuthHeaders } = useAuth();
  const [headers, setHeaders] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      setHeaders(getAuthHeaders());
      setToken(getAuthToken());
    }
  }, [isAuthenticated, getAuthHeaders, getAuthToken]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Auth Headers Debugger</h2>
      
      {isAuthenticated ? (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Auth Headers:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
              {JSON.stringify(headers, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Auth Token:</h3>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
              <p className="mb-2 font-semibold">Token:</p>
              <p className="text-xs break-all">{token}</p>
            </div>
          </div>
        </>
      ) : (
        <p>Please log in to see auth headers</p>
      )}
    </div>
  );
};

const WrappedHeaderDebugger = () => (
  <AuthProvider>
    <HeaderDebugger />
  </AuthProvider>
);

export default WrappedHeaderDebugger;
