// File: frontend/web-app/src/components/debug/HeaderDebugger.jsx
// Component to debug authentication headers and API calls

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { apiClient } from '../../../../shared/services/api';
import safeLogger from '../../../../shared/utils/safeLogger';

export const HeaderDebugger = () => {
  const auth = useAuth();
  const [authHeaders, setAuthHeaders] = useState({});
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  // Get current auth headers
  useEffect(() => {
    if (auth.isAuthenticated) {
      const headers = auth.getAuthHeaders();
      setAuthHeaders(headers);
    } else {
      setAuthHeaders({});
    }
  }, [auth.isAuthenticated, auth.getAuthHeaders]);

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

  // Test all endpoints
  const testAllEndpoints = async () => {
    setLoading(true);
    const endpoints = [
      '/api/v1/detox-types/search',
      '/api/v1/user/preferences',
      '/api/v1/timeline/entries?date=2025-07-20'
    ];
    
    const results = {};
    for (const endpoint of endpoints) {
      results[endpoint] = await testEndpoint(endpoint);
    }
    
    setLoading(false);
    return results;
  };

  // Test with demo user parameter
  const testWithDemoParam = async () => {
    setLoading(true);
    if (!auth.user?.id) {
      setTestResults(prev => ({
        ...prev,
        demoParam: { success: false, error: 'No user ID available' }
      }));
      setLoading(false);
      return;
    }
    
    try {
      const endpoint = `/api/v1/timeline/entries?date=2025-07-20&demo_user=${auth.user.id}`;
      const result = await apiClient.get(endpoint);
      setTestResults(prev => ({
        ...prev,
        demoParam: { success: true, data: result, endpoint }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        demoParam: { success: false, error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fix auth headers
  const fixAuthHeaders = () => {
    // Ensure API client has the correct auth headers
    apiClient.setHeaderGetter(auth.getAuthHeaders);
    apiClient.setTokenGetter(auth.getAuthToken);
    
    // Set user context for legacy support
    const userContext = auth.getUserContext();
    apiClient.setUserContext(userContext);
    
    safeLogger.debug('API client headers reset', { 
      userId: auth.user?.id, 
      userType: auth.userType 
    });
    
    // Update displayed headers
    setAuthHeaders(auth.getAuthHeaders());
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Authentication Header Debugger</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current User</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(auth.user, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Auth Headers</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(authHeaders, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={fixAuthHeaders}
          style={{ 
            padding: '8px 16px', 
            background: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          Fix Auth Headers
        </button>
        
        <button 
          onClick={() => testEndpoint('/api/v1/detox-types/search')}
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
          Test Detox Types API
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
        
        <button 
          onClick={testWithDemoParam}
          style={{ 
            padding: '8px 16px', 
            background: '#FF9800', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
          disabled={loading}
        >
          Test With Demo Param
        </button>
        
        <button 
          onClick={testAllEndpoints}
          style={{ 
            padding: '8px 16px', 
            background: '#9C27B0', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
          disabled={loading}
        >
          Test All Endpoints
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

export default HeaderDebugger;
