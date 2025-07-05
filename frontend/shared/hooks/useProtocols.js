import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useProtocols = () => {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProtocols = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/protocols`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProtocols(data.protocols || []);
    } catch (err) {
      console.error('Error fetching protocols:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, []);

  return { 
    protocols, 
    loading, 
    error,
    refetch: fetchProtocols 
  };
};

export default useProtocols;