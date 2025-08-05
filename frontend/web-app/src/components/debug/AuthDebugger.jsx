// File: frontend/web-app/src/components/debug/AuthDebugger.jsx
// Simple component to debug authentication issues

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { apiClient } from '../../../../shared/services/api';

export const AuthDebugger = () => {
  const auth = useAuth();
  const [token, setToken] = useState('');
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  // Get current auth token
  useEffect(() => {
    const storedToken = sessionStorage.getItem('auth_token');
    setToken(storedToken || 'No token found');
  }, []);

  // Test API endpoints
  const testEndpoint = async (endpoint) => {
    setLoading(true);
    try {
      const result = await apiClient.get(endpoint);
      setTestResults(prev => ({
        ...prev,
        [endpoint]: { success: true, data: result }
      }));
      return { success: true, data: result };
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: { success: false, error: error.message }
      }));
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fix auth headers
  const fixAuthHeaders = () => {
    // Force refresh the token
    const storedToken = sessionStorage.getItem('auth_token');
    console.log('🔧 Current token:', storedToken ? `length: ${storedToken.length}` : 'none');
    
    // Ensure API client has the correct auth headers
    apiClient.setHeaderGetter(() => {
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        console.log('🔧 Setting Authorization header with token length:', token.length);
        return { Authorization: `Bearer ${token}` };
      }
      return {};
    });
    
    // Set user context
    if (auth.user) {
      apiClient.setUserContext({
        userId: auth.user.id,
        email: auth.user.email,
        isDemo: auth.authMode === 'demo'
      });
    }
    
    console.log('🔧 Auth headers fixed');
    
    // Update displayed token
    setToken(storedToken || 'No token found');
  };

  return (
    <div className="p-5 max-w-3xl mx-auto bg-filo-cream">
      <h2 className="text-xl font-bold mb-4">Authentication Debugger</h2>
      
      <div className="mb-5">
        <h3 className="font-semibold mb-2">Current User</h3>
        <pre className="bg-neutral-100 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(auth.user, null, 2)}
        </pre>
      </div>
      
      <div className="mb-5">
        <h3 className="font-semibold mb-2">Auth Mode</h3>
        <p><strong>{auth.authMode || 'Not set'}</strong></p>
      </div>
      
      <div className="mb-5">
        <h3 className="font-semibold mb-2">Auth Token</h3>
        <p>{token ? `Token exists (length: ${token.length})` : 'No token'}</p>
      </div>
      
      <div className="mb-5">
        <button 
          onClick={fixAuthHeaders}
          className="px-4 py-2 bg-allowed-600 text-white rounded hover:bg-allowed-700 mr-2 mb-2" 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          Fix Auth Headers
        </button>
        
        <button 
          onClick={() => testEndpoint('/api/v1/protocols')}
          className="px-4 py-2 bg-info-600 text-white rounded hover:bg-info-700 mr-2 mb-2" 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
          disabled={loading}
        >
          Test Protocols API
        </button>
        
        <button 
          onClick={() => testEndpoint('/api/v1/user/preferences')}
          style={{ 
            padding: '8px 16px', 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
          disabled={loading}
        >
          Test User Preferences API
        </button>
        
        <button 
          onClick={() => testEndpoint('/api/v1/timeline/entries?date=2025-07-20')}
          style={{ 
            padding: '8px 16px', 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
          disabled={loading}
        >
          Test Timeline API
        </button>
      </div>
      
      <div>
        <h3>Test Results</h3>
        {Object.entries(testResults).map(([endpoint, result]) => (
          <div key={endpoint} style={{ marginBottom: '15px' }}>
            <h4>{endpoint}</h4>
            <div style={{ 
              background: result.success ? '#E8F5E9' : '#FFEBEE', 
              padding: '10px', 
              borderRadius: '4px' 
            }}>
              <p><strong>Status:</strong> {result.success ? 'Success' : 'Error'}</p>
              {result.error && <p><strong>Error:</strong> {result.error}</p>}
              {result.data && (
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthDebugger;
