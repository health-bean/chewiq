import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load preferences on app start
  useEffect(() => {
    const loadPreferences = () => {
      try {
        // Try to load from localStorage first
        const saved = localStorage.getItem('user_preferences');
        if (saved) {
          const parsed = JSON.parse(saved);
          setPreferences(parsed);
        } else {
          // Set default preferences for new users
          setPreferences({
            protocols: [],
            quick_supplements: [],
            quick_medications: [],
            quick_foods: [],
            quick_symptoms: [],
            quick_detox: [],
            setup_complete: false
          });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setError('Failed to load preferences');
        // Fallback to default
        setPreferences({
          protocols: [],
          quick_supplements: [],
          quick_medications: [],
          quick_foods: [],
          quick_symptoms: [],
          quick_detox: [],
          setup_complete: false
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const updatePreferences = async (newPreferences) => {
    if (!preferences) return;
    
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    try {
      // Save to localStorage immediately (optimistic update)
      localStorage.setItem('user_preferences', JSON.stringify(updatedPreferences));
      setPreferences(updatedPreferences);
      
      // TODO: Also save to your API when ready
      // await apiClient.post('/api/v1/user/preferences', updatedPreferences);
      
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError('Failed to save preferences');
      // Revert optimistic update on error
      const saved = localStorage.getItem('user_preferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    }
  };

  return { 
    preferences, 
    updatePreferences, 
    loading,
    error,
    isReady: preferences !== null 
  };
};

export default useUserPreferences;