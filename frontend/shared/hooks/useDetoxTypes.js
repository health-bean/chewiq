import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useDetoxTypes = () => {
  const [detoxTypes, setDetoxTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetoxTypes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/detox-types`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDetoxTypes(data.detox_types || []);
    } catch (err) {
      console.error('Error fetching detox types:', err);
      setError(err.message);
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