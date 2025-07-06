import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

const useProtocols = () => {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const data = await apiClient.get('/api/v1/protocols');
        setProtocols(data.protocols || []);
      } catch (error) {
        console.error('Failed to load protocols:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocols();
  }, []);

  return { protocols, loading, error };
};

export default useProtocols;