import { useState, useEffect } from 'react';
import { timelineService } from '../../../shared/services/timelineService';

export const useTimelineEntries = (selectedDate, isAuthenticated = false) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = async () => {
    console.log('🔍 useTimelineEntries: loadEntries called', { selectedDate, isAuthenticated });
    
    if (!selectedDate || !isAuthenticated) {
      console.log('🔍 useTimelineEntries: Skipping load - no date or not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 useTimelineEntries: Calling timelineService.getEntries with date:', selectedDate);
      const data = await timelineService.getEntries(selectedDate);
      console.log('🔍 useTimelineEntries: Received data:', data);
      setEntries(data.entries || []);
      console.log('🔍 useTimelineEntries: Set entries:', data.entries?.length || 0);
    } catch (err) {
      console.error('🔍 useTimelineEntries: Failed to load timeline entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entryData) => {
    try {
      await timelineService.createEntry(entryData);
      await loadEntries(); // Refresh entries after adding
    } catch (err) {
      console.error('Failed to add entry:', err);
      setError(err.message);
      throw err;
    }
  };

  const hasCriticalInsights = () => {
    return entries.some(entry => entry.protocol_compliant === false);
  };

  useEffect(() => {
    loadEntries();
  }, [selectedDate, isAuthenticated]);

  return {
    entries,
    loading,
    error,
    addEntry,
    hasCriticalInsights,
    refreshEntries: loadEntries
  };
};