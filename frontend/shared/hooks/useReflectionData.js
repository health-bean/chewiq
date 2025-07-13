import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

const useReflectionData = (selectedDate) => {
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load reflection data for selected date
  useEffect(() => {
    const loadReflectionData = () => {
      // SECURITY: Use sessionStorage for personal health data privacy
      const saved = sessionStorage.getItem(`reflection_${selectedDate}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setReflectionData(parsed);
        } catch (error) {
        }
      } else {
        // Reset to defaults for new date
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
      }
      setHasUnsavedChanges(false);
    };

    loadReflectionData();
  }, [selectedDate]);

  const updateReflectionData = (updates) => {
    setReflectionData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const saveReflectionData = async () => {
    setLoading(true);
    try {
      // SECURITY: Save to sessionStorage for health data privacy
      sessionStorage.setItem(`reflection_${selectedDate}`, JSON.stringify(reflectionData));
      
      // TODO: Send to API when ready
      // await apiClient.post('/api/v1/journal/entries', {
      //   date: selectedDate,
      //   ...reflectionData
      // });
      
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
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
    hasUnsavedChanges
  };
};

export default useReflectionData;