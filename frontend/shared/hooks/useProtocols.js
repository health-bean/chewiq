import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

const useProtocols = (isAuthenticated = false) => {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProtocols = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await apiClient.get('/api/v1/protocols');
        setProtocols(data.protocols || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocols();
  }, [isAuthenticated]);

  return { protocols, loading, error };
};

export default useProtocols;