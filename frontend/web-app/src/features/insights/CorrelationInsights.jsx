import React, { useState } from 'react';
import { useCorrelations } from '../../../../shared/hooks/useCorrelations';
import { AlertTriangle, TrendingUp, Clock, Target, Zap, Activity, Pill, Moon, Dumbbell, Brain, Heart, CheckCircle, AlertCircle } from 'lucide-react';

const DEMO_USER_ID = '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0'; // Sarah's ID for demo

const CorrelationInsights = () => {
  const [confidenceFilter, setConfidenceFilter] = useState(0.7); // Default to Strong patterns
  const [timeframeFilter, setTimeframeFilter] = useState(180); // Longer timeframe for more data
  
  const { 
    correlations,  
    sortedCorrelations,
    summary, 
    loading, 
    error,
    correlationStats
  } = useCorrelations(DEMO_USER_ID, confidenceFilter, timeframeFilter);

  // ENHANCED: Determine if correlation is positive or negative
  const isPositiveCorrelation = (correlation) => {
    const positiveKeywords = ['reduce', 'improve', 'help', 'boost', 'increase energy', 'better', 'benefit'];
    const negativeKeywords = ['cause', 'trigger', 'worsen', 'amplify', 'side effect'];
    
    const text = (correlation.description || correlation.effect || '').toLowerCase();
    
    const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
    const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
    
    // Supplement improvements and sleep quality improvements are typically positive
    if (correlation.type === 'supplement-improvement' || 
        (correlation.type === 'sleep-quality' && text.includes('improve'))) {
      return true;
    }
    
    // Exercise energy boosts are positive
    if (correlation.type === 'exercise-energy' && text.includes('boost')) {
      return true;
    }
    
    // Medication effects and stress amplification are typically negative
    if (correlation.type === 'medication-effect' || correlation.type === 'stress-symptom') {
      return false;
    }
    
    // Food triggers are typically negative
    if (correlation.type === 'food-symptom') {
      return false;
    }
    
    return hasPositive && !hasNegative;
  };

  // ENHANCED: Get appropriate icon based on correlation type
  const getCorrelationIcon = (correlation) => {
    const isPositive = isPositiveCorrelation(correlation);
    
    switch (correlation.type) {
      case 'medication-effect':
        return <Pill className="w-5 h-5 text-red-500" />;
      case 'sleep-quality':
        return <Moon className={`w-5 h-5 ${isPositive ? 'text-green-500' : 'text-blue-500'}`} />;
      case 'exercise-energy':
        return <Dumbbell className={`w-5 h-5 ${isPositive ? 'text-green-500' : 'text-orange-500'}`} />;
      case 'stress-symptom':
        return <Brain className="w-5 h-5 text-red-500" />;
      case 'supplement-improvement':
        return <Heart className="w-5 h-5 text-green-500" />;
      case 'food-symptom':
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  // ENHANCED: Get correlation type display name
  const getCorrelationTypeLabel = (type) => {
    switch (type) {
      case 'medication-effect':
        return 'Medication Effect';
      case 'sleep-quality':
        return 'Sleep Factor';
      case 'exercise-energy':
        return 'Exercise Impact';
      case 'stress-symptom':
        return 'Stress Factor';
      case 'supplement-improvement':
        return 'Supplement Benefit';
      case 'food-symptom':
      default:
        return 'Food Response';
    }
  };

  // ENHANCED: Get correlation type color based on positive/negative
  const getCorrelationTypeColor = (type, isPositive = null) => {
    if (isPositive === true) {
      return 'bg-green-100 text-green-800';
    } else if (isPositive === false) {
      return 'bg-red-100 text-red-800';
    }
    
    switch (type) {
      case 'medication-effect':
      case 'stress-symptom':
      case 'food-symptom':
        return 'bg-red-100 text-red-800';
      case 'supplement-improvement':
        return 'bg-green-100 text-green-800';
      case 'sleep-quality':
      case 'exercise-energy':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // ENHANCED: Get confidence color based on positive/negative and strength
  const getPatternStrengthColor = (correlation) => {
    const isPositive = isPositiveCorrelation(correlation);
    const confidence = correlation.confidence;
    
    if (confidence >= 0.9) {
      return isPositive ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200';
    }
    if (confidence >= 0.7) {
      return isPositive ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100';
    }
    if (confidence >= 0.5) {
      return isPositive ? 'text-green-500 bg-green-50 border-green-100' : 'text-orange-600 bg-orange-50 border-orange-100';
    }
    return 'text-blue-600 bg-blue-50 border-blue-100';
  };

  const getPatternStrengthLabel = (confidence) => {
    if (confidence >= 0.9) return 'Very Strong';
    if (confidence >= 0.7) return 'Strong';
    if (confidence >= 0.5) return 'Moderate';
    return 'Emerging';
  };

  // ENHANCED: Consolidate duplicates by trigger
  const consolidateByTrigger = (patterns) => {
    const grouped = {};
    
    patterns.forEach(pattern => {
      const key = pattern.trigger.toLowerCase();
      if (!grouped[key]) {
        grouped[key] = {
          trigger: pattern.trigger,
          type: pattern.type,
          confidence: pattern.confidence,
          effects: [],
          icon: getCorrelationIcon(pattern),
          typeLabel: getCorrelationTypeLabel(pattern.type),
          typeColor: getCorrelationTypeColor(pattern.type),
          isPositive: isPositiveCorrelation(pattern),
          seenDescriptions: new Set(),
          seenRecommendations: new Set()
        };
      }
      
      // Filter out duplicate descriptions and medical advice recommendations
      const shouldIncludeDescription = pattern.description && 
        !grouped[key].seenDescriptions.has(pattern.description.toLowerCase());
      
      const shouldIncludeRecommendation = pattern.recommendation && 
        !grouped[key].seenRecommendations.has(pattern.recommendation.toLowerCase()) &&
        !pattern.recommendation.toLowerCase().includes('continue') &&
        !pattern.recommendation.toLowerCase().includes('keep taking') &&
        !pattern.recommendation.toLowerCase().includes('maintain');
      
      if (shouldIncludeDescription) {
        grouped[key].seenDescriptions.add(pattern.description.toLowerCase());
      }
      
      if (shouldIncludeRecommendation) {
        grouped[key].seenRecommendations.add(pattern.recommendation.toLowerCase());
      }
      
      grouped[key].effects.push({
        effect: pattern.effect,
        description: shouldIncludeDescription ? pattern.description : null,
        recommendation: shouldIncludeRecommendation ? pattern.recommendation : null,
        timeWindowDescription: pattern.timeWindowDescription,
        frequency: pattern.frequency,
        confidence: pattern.confidence
      });
      
      // Keep the highest confidence for the group
      if (pattern.confidence > grouped[key].confidence) {
        grouped[key].confidence = pattern.confidence;
      }
    });
    
    // Clean up the helper sets before returning
    return Object.values(grouped).map(group => {
      delete group.seenDescriptions;
      delete group.seenRecommendations;
      return group;
    }).sort((a, b) => b.confidence - a.confidence);
  };

  // ENHANCED: Filter for very high confidence patterns (90%+)
  const veryHighConfidencePatterns = correlations.filter(c => c.confidence >= 0.9);
  const consolidatedHighConfidence = consolidateByTrigger(veryHighConfidencePatterns);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Analyzing health patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Insights</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Target className="w-7 h-7 text-blue-600" />
              <span>Health Pattern Analysis</span>
            </h2>
            <p className="text-gray-600 mt-1">
              Patterns observed from your comprehensive health tracking data
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{correlationStats?.total || 0}</div>
            <div className="text-sm text-gray-500">Patterns Observed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-6">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700 min-w-0 flex-shrink-0">Pattern Strength:</label>
            <select 
              value={confidenceFilter} 
              onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 sm:flex-none sm:w-40"
            >
              <option value={0.5}>Moderate (50%+)</option>
              <option value={0.7}>Strong (70%+)</option>
              <option value={0.9}>Very Strong (90%+)</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700 min-w-0 flex-shrink-0">Time Period:</label>
            <select 
              value={timeframeFilter} 
              onChange={(e) => setTimeframeFilter(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 sm:flex-none sm:w-32"
            >
              <option value={30}>30 days</option>
              <option value={90}>3 months</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Very Strong Patterns (90%+) - ENHANCED */}
      {consolidatedHighConfidence.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Very Strong Patterns (90%+ Observed)</span>
              <span className="text-sm font-normal text-gray-500">({consolidatedHighConfidence.length} found)</span>
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {consolidatedHighConfidence.map((group, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {group.icon}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCorrelationTypeColor(group.type, group.isPositive)}`}>
                          {group.typeLabel}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {group.trigger}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPatternStrengthColor(group)}`}>
                      {Math.round(group.confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getPatternStrengthLabel(group.confidence)} Pattern
                    </div>
                  </div>
                </div>
                
                <div className="ml-8 space-y-2">
                  {group.effects.map((effect, effectIndex) => (
                    <div key={effectIndex} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center space-x-2">
                        {group.isPositive ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium text-gray-900">{effect.effect}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {effect.timeWindowDescription} • {effect.frequency}
                      </div>
                      {effect.description && (
                        <div className="text-sm text-blue-600 mt-1">
                          💡 {effect.description}
                        </div>
                      )}
                      {effect.recommendation && (
                        <div className="text-sm text-green-600 mt-1">
                          🎯 {effect.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Patterns - ENHANCED */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>All Observed Patterns (Sorted by Strength)</span>
          </h3>
        </div>
        
        {sortedCorrelations.filter(c => c.confidence >= 0.5).length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No patterns found with 50%+ strength and current filters.</p>
            <p className="text-sm text-gray-400 mt-1">Try lowering the pattern strength threshold to Moderate (50%+).</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedCorrelations.filter(c => c.confidence >= 0.5).map((correlation, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getCorrelationIcon(correlation)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getCorrelationTypeColor(correlation.type, isPositiveCorrelation(correlation))}`}>
                            {getCorrelationTypeLabel(correlation.type)}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900">
                          {correlation.trigger}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>→</span>
                          <span className="font-medium">{correlation.effect}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 ml-8">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{correlation.timeWindowDescription}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{correlation.frequency}</span>
                      </div>
                    </div>
                    
                    {correlation.description && (
                      <div className="mt-2 ml-8">
                        <p className="text-sm text-blue-600 font-medium">
                          💡 {correlation.description}
                        </p>
                      </div>
                    )}
                    
                    {correlation.recommendation && (
                      <div className="mt-1 ml-8">
                        <p className="text-sm text-green-600">
                          🎯 {correlation.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPatternStrengthColor(correlation)}`}>
                      {Math.round(correlation.confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getPatternStrengthLabel(correlation.confidence)} Pattern
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Pill className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{correlationStats?.byType?.medicationEffects || 0}</div>
              <div className="text-sm text-red-700">Medication Effects</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Moon className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{correlationStats?.byType?.sleepFactors || 0}</div>
              <div className="text-sm text-blue-700">Sleep Factors</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Dumbbell className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{correlationStats?.byType?.exerciseImpacts || 0}</div>
              <div className="text-sm text-green-700">Exercise Impacts</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">{correlationStats?.byType?.stressAmplifiers || 0}</div>
              <div className="text-sm text-purple-700">Stress Amplifiers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationInsights;