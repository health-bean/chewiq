import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

export const useCorrelations = (timeframeDays = 180) => {
  const [correlations, setCorrelations] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCorrelations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        timeframe_days: timeframeDays
      });

      const data = await apiClient.get(`/api/v1/correlations/insights?${params}`);
      
      // Backend now returns insights as {triggers: [], helpers: [], trends: []}
      setCorrelations(data.insights || {});
      setSummary(data.summary || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelations();
  }, [timeframeDays]);

  const retryFetch = () => {
    fetchCorrelations();
  };

  // Handle both old array format and new object format from backend
  const allCorrelations = Array.isArray(correlations) 
    ? correlations 
    : [...(correlations.triggers || []), ...(correlations.helpers || []), ...(correlations.trends || [])];

  // ENHANCED: Group correlations by all 6 types
  const groupedCorrelations = {
    // Legacy groupings (maintain backward compatibility)
    triggers: allCorrelations.filter(c => c.type === 'food-symptom'),
    improvements: allCorrelations.filter(c => c.type === 'supplement-improvement'),
    protocols: allCorrelations.filter(c => c.type === 'protocol-effectiveness'),
    
    // NEW: Enhanced correlation types
    medicationEffects: allCorrelations.filter(c => c.type === 'medication-effect'),
    sleepQuality: allCorrelations.filter(c => c.type === 'sleep-quality'),
    exerciseEnergy: allCorrelations.filter(c => c.type === 'exercise-energy'),
    stressAmplification: allCorrelations.filter(c => c.type === 'stress-symptom'),
    
    // Comprehensive grouping
    allTypes: {
      'food-symptom': allCorrelations.filter(c => c.type === 'food-symptom'),
      'supplement-improvement': allCorrelations.filter(c => c.type === 'supplement-improvement'),
      'medication-effect': allCorrelations.filter(c => c.type === 'medication-effect'),
      'sleep-quality': allCorrelations.filter(c => c.type === 'sleep-quality'),
      'exercise-energy': allCorrelations.filter(c => c.type === 'exercise-energy'),
      'stress-symptom': allCorrelations.filter(c => c.type === 'stress-symptom'),
      'protocol-effectiveness': allCorrelations.filter(c => c.type === 'protocol-effectiveness')
    }
  };

  // ENHANCED: High confidence triggers from ALL types, not just food
  const highConfidenceTriggers = allCorrelations.filter(c => c.confidence >= 0.7);

  // ENHANCED: Get correlations sorted by confidence
  const sortedCorrelations = [...allCorrelations].sort((a, b) => b.confidence - a.confidence);

  // ENHANCED: Get statistics by type - matches backend summary format
  const correlationStats = {
    total: allCorrelations.length,
    byType: {
      foodTriggers: groupedCorrelations.triggers.length,
      medicationEffects: groupedCorrelations.medicationEffects.length,
      sleepFactors: groupedCorrelations.sleepQuality.length, // Match backend: sleepFactors
      exerciseImpacts: groupedCorrelations.exerciseEnergy.length, // Match backend: exerciseImpacts  
      stressAmplifiers: groupedCorrelations.stressAmplification.length, // Match backend: stressAmplifiers
      supplementImprovements: groupedCorrelations.improvements.length,
      protocolEffectiveness: groupedCorrelations.protocols.length
    },
    byConfidence: {
      high: allCorrelations.filter(c => c.confidence >= 0.7).length,
      medium: allCorrelations.filter(c => c.confidence >= 0.5 && c.confidence < 0.7).length,
      low: allCorrelations.filter(c => c.confidence < 0.5).length
    }
  };

  // ENHANCED: Get top correlations by type
  const getTopCorrelationsByType = (type, limit = 3) => {
    return allCorrelations
      .filter(c => c.type === type)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  };

  // ENHANCED: Get correlations above threshold
  const getCorrelationsAboveThreshold = (threshold = 0.6) => {
    return allCorrelations.filter(c => c.confidence >= threshold);
  };

  // ENHANCED: Check if user has specific correlation types
  const hasCorrelationType = (type) => {
    return allCorrelations.some(c => c.type === type);
  };

  // ENHANCED: Get correlation insights summary
  const getInsightsSummary = () => {
    const insights = [];
    
    // High confidence medication effects
    const highMedEffects = groupedCorrelations.medicationEffects.filter(c => c.confidence >= 0.7);
    if (highMedEffects.length > 0) {
      insights.push(`${highMedEffects.length} medication side effect${highMedEffects.length > 1 ? 's' : ''} detected`);
    }
    
    // Sleep quality improvements
    const sleepImprovements = groupedCorrelations.sleepQuality.filter(c => c.confidence >= 0.6);
    if (sleepImprovements.length > 0) {
      insights.push(`${sleepImprovements.length} sleep quality factor${sleepImprovements.length > 1 ? 's' : ''} identified`);
    }
    
    // Exercise energy patterns
    const exercisePatterns = groupedCorrelations.exerciseEnergy.filter(c => c.confidence >= 0.6);
    if (exercisePatterns.length > 0) {
      insights.push(`${exercisePatterns.length} exercise energy pattern${exercisePatterns.length > 1 ? 's' : ''} found`);
    }
    
    // Stress amplification
    const stressAmplifiers = groupedCorrelations.stressAmplification.filter(c => c.confidence >= 0.6);
    if (stressAmplifiers.length > 0) {
      insights.push(`${stressAmplifiers.length} stress amplification factor${stressAmplifiers.length > 1 ? 's' : ''} identified`);
    }
    
    return insights;
  };

  return {
    // Core data
    correlations: allCorrelations, // Return the processed array instead of raw backend response
    sortedCorrelations,
    groupedCorrelations,
    summary,
    
    // Legacy compatibility
    highConfidenceTriggers,
    
    // Enhanced features
    correlationStats,
    getTopCorrelationsByType,
    getCorrelationsAboveThreshold,
    hasCorrelationType,
    getInsightsSummary,
    
    // State management
    loading,
    error,
    refetch: retryFetch
  };
};