import { useState } from 'react';
import { MOCK_EXPOSURE_TYPES } from '../constants/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useExposureTypes = () => {
  const [exposureTypes, setExposureTypes] = useState(MOCK_EXPOSURE_TYPES);
  const [loading, setLoading] = useState(false);

  // Future: Replace with real API
  // const fetchExposureTypes = async () => {
  //   const response = await fetch(`${API_BASE_URL}/api/v1/exposure-types`);
  //   const data = await response.json();
  //   setExposureTypes(data.exposure_types);
  // };

  return { exposureTypes, loading };
};

export default useExposureTypes;