import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

const useDetoxTypes = () => {
  const [detoxTypes, setDetoxTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetoxTypes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.get('/api/v1/detox-types/search');
      setDetoxTypes(data.detox_types || []);
    } catch (err) {
      setError(err.message);
      setDetoxTypes([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetoxTypes();
  }, []);

  return { 
    detoxTypes, 
    loading, 
    error,
    refetch: fetchDetoxTypes
  };
};

export default useDetoxTypes;