// File: frontend/shared/hooks/useUserPreferences.js (IMPROVED)

import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';
import useAuth from './useAuth.js';

const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Get auth context
  const { user, token, isAuthenticated, getAuthHeaders } = useAuth();

  // Default preferences structure
  const getDefaultPreferences = () => ({
    protocols: [],
    quick_supplements: [],
    quick_medications: [],
    quick_foods: [],
    quick_symptoms: [],
    quick_detox: [],
    setup_complete: false
  });

  // Load preferences from database when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('🔧 PREFS: No authenticated user, using defaults');
      setPreferences(getDefaultPreferences());
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔧 PREFS: Loading preferences for user:', user.id);
        
        const response = await apiClient.get('/api/v1/user/preferences', {
          headers: getAuthHeaders()
        });
        
        console.log('🔧 PREFS: API response:', response);
        
        // Handle both response formats: {preferences: {...}} or {...} directly
        let preferencesData = response;
        
        // If response has a preferences property, use that
        if (response && typeof response === 'object' && response.preferences) {
          preferencesData = response.preferences;
        }
        
        // Validate preferences data
        if (preferencesData && typeof preferencesData === 'object' && Object.keys(preferencesData).length > 0) {
          // Merge with defaults to ensure all required fields exist
          const mergedPreferences = { ...getDefaultPreferences(), ...preferencesData };
          console.log('🔧 PREFS: Loaded preferences:', mergedPreferences);
          setPreferences(mergedPreferences);
        } else {
          console.log('🔧 PREFS: No valid preferences found, using defaults');
          setPreferences(getDefaultPreferences());
        }
      } catch (error) {
        console.error('🔧 PREFS: Failed to load preferences:', error);
        setError('Failed to load preferences');
        setPreferences(getDefaultPreferences());
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [isAuthenticated, user, token]);

  const updatePreferences = async (newPreferences) => {
    console.log('🔧 PREFS: Starting updatePreferences with:', newPreferences);

    if (!isAuthenticated || !user) {
      console.error('🔧 PREFS: Cannot update preferences - user not authenticated');
      return Promise.reject(new Error('User not authenticated'));
    }

    if (!preferences) {
      console.error('🔧 PREFS: Cannot update preferences - not loaded yet');
      return Promise.reject(new Error('Preferences not loaded'));
    }
    
    // Preserve existing preferences and only update the specified ones
    const updatedPreferences = { 
      ...preferences, 
      ...newPreferences 
    };
    
    console.log('🔧 PREFS: Final preferences to save:', updatedPreferences);
    
    try {
      setSaving(true);
      setError(null);
      
      // Save to database
      console.log('🔧 PREFS: Making API call to save preferences...');
      const response = await apiClient.post('/api/v1/user/preferences', updatedPreferences, {
        headers: getAuthHeaders()
      });
      
      console.log('🔧 PREFS: Save response:', response);
      
      // Handle response
      let savedPreferences = updatedPreferences;
      if (response && response.preferences) {
        savedPreferences = response.preferences;
      }
      
      // Update local state
      setPreferences(savedPreferences);
      console.log('🔧 PREFS: Preferences saved successfully');
      
      return savedPreferences;
      
    } catch (error) {
      console.error('🔧 PREFS: Update failed:', error);
      setError('Failed to save preferences');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const refreshPreferences = async () => {
    console.log('🔧 PREFS: Refreshing preferences');

    if (!isAuthenticated || !user) {
      console.log('🔧 PREFS: Cannot refresh - user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/api/v1/user/preferences', {
        headers: getAuthHeaders()
      });
      
      console.log('🔧 PREFS: Refresh response:', response);
      
      // Handle response format
      let preferencesData = response;
      if (response && response.preferences) {
        preferencesData = response.preferences;
      }
      
      if (preferencesData && typeof preferencesData === 'object' && Object.keys(preferencesData).length > 0) {
        const mergedPreferences = { ...getDefaultPreferences(), ...preferencesData };
        setPreferences(mergedPreferences);
        console.log('🔧 PREFS: Preferences refreshed successfully');
      } else {
        console.log('🔧 PREFS: No valid preferences in refresh response');
      }
    } catch (error) {
      console.error('🔧 PREFS: Refresh failed:', error);
      setError('Failed to refresh preferences');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a specific preference exists
  const hasPreference = (key, value) => {
    if (!preferences || !preferences[key]) return false;
    if (Array.isArray(preferences[key])) {
      return preferences[key].includes(value);
    }
    return preferences[key] === value;
  };

  // Helper function to get a specific preference with fallback
  const getPreference = (key, defaultValue = null) => {
    if (!preferences) return defaultValue;
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  };

  return { 
    preferences, 
    updatePreferences, 
    refreshPreferences,
    loading,
    saving,
    error,
    isReady: isAuthenticated && preferences !== null,
    hasPreference,
    getPreference,
    // Additional auth-aware properties
    user,
    isAuthenticated
  };
};

export default useUserPreferences;