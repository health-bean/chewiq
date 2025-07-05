import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useExposureTypes = () => {
  const [exposureTypes, setExposureTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExposureTypes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/exposure-types`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setExposureTypes(data.exposure_types || []);
    } catch (err) {
      console.error('Error fetching exposure types:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExposureTypes();
  }, []);

  return { 
    exposureTypes, 
    loading, 
    error,
    refetch: fetchExposureTypes 
  };
};

export default useExposureTypes;