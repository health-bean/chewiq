import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useReflectionData = (selectedDate, userId) => {
  const [reflectionData, setReflectionData] = useState({
    bedtime: '',
    wake_time: '',
    sleep_quality: '',
    overnight_symptoms: '',
    energy_level: 5,
    mood_level: 5,
    physical_comfort: 5,
    overall_notes: '',
    activity_level: '',
    meditation_practice: false,
    meditation_duration: 0,
    mindfulness_activities: '',
    cycle_day: '',
    ovulation: false,
    additional_reflections: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load reflection data for selected date
  const fetchReflectionData = async () => {
    if (!selectedDate || !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        user_id: userId,
        date: selectedDate
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/journal/entries?${params}`);
      
      if (!response.ok) {
        // If no entry exists (404), use defaults
        if (response.status === 404) {
          setReflectionData({
            bedtime: '',
            wake_time: '',
            sleep_quality: '',
            overnight_symptoms: '',
            energy_level: 5,
            mood_level: 5,
            physical_comfort: 5,
            overall_notes: '',
            activity_level: '',
            meditation_practice: false,
            meditation_duration: 0,
            mindfulness_activities: '',
            cycle_day: '',
            ovulation: false,
            additional_reflections: ''
          });
          setHasUnsavedChanges(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Handle the response format from API test: {"entries":[],"total":0}
      if (data.entries && data.entries.length > 0) {
        setReflectionData(data.entries[0]);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error fetching reflection data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReflectionData();
  }, [selectedDate, userId]);

  const updateReflectionData = (updates) => {
    setReflectionData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const saveReflectionData = async () => {
    if (!selectedDate || !userId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try PUT first (following the preferences pattern)
      const response = await fetch(`${API_BASE_URL}/api/v1/journal/entries`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          date: selectedDate,
          ...reflectionData
        })
      });
      
      if (!response.ok) {
        // If PUT doesn't work, try POST
        const postResponse = await fetch(`${API_BASE_URL}/api/v1/journal/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            date: selectedDate,
            ...reflectionData
          })
        });
        
        if (!postResponse.ok) {
          throw new Error(`HTTP error! status: ${postResponse.status}`);
        }
      }
      
      setHasUnsavedChanges(false);
      console.log('✅ Reflection data saved successfully');
      return true;
    } catch (err) {
      console.error('Error saving reflection data:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    reflectionData,
    updateReflectionData,
    saveReflectionData,
    loading,
    error,
    hasUnsavedChanges,
    refetch: fetchReflectionData
  };
};

export default useReflectionData;