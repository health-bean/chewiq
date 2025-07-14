import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

const useProtocols = (isAuthenticated = false) => {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProtocols = async () => {
      // Always try to fetch if we have a token, regardless of isAuthenticated flag
      const hasToken = sessionStorage.getItem('authToken');
      
      if (!isAuthenticated && !hasToken) {
        console.log('🔧 useProtocols: No auth, skipping fetch');
        setLoading(false);
        return;
      }
      
      console.log('🔧 useProtocols: Fetching protocols...', { isAuthenticated, hasToken: !!hasToken });
      
      try {
        const data = await apiClient.get('/api/v1/protocols');
        console.log('🔧 useProtocols: Received protocols:', data.protocols?.length || 0);
        setProtocols(data.protocols || []);
        setError(null);
      } catch (error) {
        console.error('🔧 useProtocols: Error fetching protocols:', error);
        setError(error.message);
        setProtocols([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocols();
  }, [isAuthenticated]);

  return { protocols, loading, error };
};

export default useProtocols;