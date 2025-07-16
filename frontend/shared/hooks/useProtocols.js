import { useState, useEffect } from 'react';
import { simpleApiClient } from '../services/simpleApi.js';
import safeLogger from '../utils/safeLogger';

const useProtocols = (isAuthenticated = false) => {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchProtocols = async () => {
      // Always try to fetch if we have a token, regardless of isAuthenticated flag
      const hasToken = sessionStorage.getItem('auth_token'); // Fixed: was 'authToken', should be 'auth_token'
      
      if (!isAuthenticated && !hasToken) {
        safeLogger.debug('Skipping protocols fetch - not authenticated');
        setLoading(false);
        return;
      }
      
      // Prevent duplicate calls
      if (loading) {
        safeLogger.debug('Already loading protocols, skipping duplicate call');
        return;
      }
      
      safeLogger.debug('Fetching protocols', { isAuthenticated });
      
      try {
        setLoading(true);
        const data = await simpleApiClient.get('/api/v1/protocols');
        
        // Only update state if component is still mounted
        if (!isCancelled) {
          safeLogger.debug('Protocols loaded successfully', { count: data.protocols?.length || 0 });
          setProtocols(data.protocols || []);
          setError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          safeLogger.error('Failed to load protocols', { error: error.message });
          setError(error.message);
          setProtocols([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchProtocols();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  return { protocols, loading, error };
};

export default useProtocols;