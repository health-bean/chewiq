const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');

/**
 * Simplified correlation insights handler with better error handling
 */
async function handleGetCorrelationInsights(queryParams, event) {
  try {
    const userId = queryParams?.user_id || queryParams?.userId;
    const timeframeDays = parseInt(queryParams?.timeframe_days) || 180;
    const confidenceThreshold = parseFloat(queryParams?.confidence_threshold) || 0.1; // Lower threshold for demo

    console.log('Correlations request:', { userId, timeframeDays, confidenceThreshold });

    if (!userId) {
      return errorResponse('user_id parameter is required', 400);
    }

    // Get timeline data for the user with better error handling
    let timelineData;
    try {
      timelineData = await getTimelineData(userId, timeframeDays);
      console.log(`Found ${timelineData.length} timeline entries for user ${userId}`);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      return successResponse({
        insights: [],
        summary: { 
          totalCorrelations: 0, 
          triggers: 0, 
          improvements: 0, 
          message: 'No timeline data available for analysis'
        },
        user_id: userId,
        timeframe_days: timeframeDays
      });
    }
    
    if (timelineData.length === 0) {
      console.log('No timeline data found for user:', userId);
      return successResponse({
        insights: [],
        summary: { 
          totalCorrelations: 0, 
          triggers: 0, 
          improvements: 0,
          message: 'No timeline entries found for correlation analysis'
        },
        user_id: userId,
        timeframe_days: timeframeDays
      });
    }

    // Run simplified correlation analysis
    let correlations = [];
    try {
      correlations = await detectSimpleCorrelations(timelineData, confidenceThreshold);
      console.log(`Found ${correlations.length} correlations`);
    } catch (error) {
      console.error('Error in correlation analysis:', error);
      // Return empty results instead of failing
      correlations = [];
    }

    const summary = {
      totalCorrelations: correlations.length,
      triggers: correlations.filter(c => c.type === 'food-symptom').length,
      improvements: correlations.filter(c => c.type === 'supplement-improvement').length,
      medicationEffects: correlations.filter(c => c.type === 'medication-effect').length,
      exerciseImpacts: correlations.filter(c => c.type === 'exercise-energy').length,
      dataPoints: timelineData.length,
      analysisTimeframe: timeframeDays
    };

    return successResponse({
      insights: correlations,
      summary,
      timeframe_days: timeframeDays,
      confidence_threshold: confidenceThreshold,
      user_id: userId
    });

  } catch (error) {
    console.error('Correlation analysis error:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(`Failed to analyze correlations: ${error.message}`, 500);
  }
}

/**
 * Get timeline data with better error handling
 */
async function getTimelineData(userId, timeframeDays) {
  let client;
  
  try {
    client = await pool.connect();
    console.log('Database connected successfully');
    
    const query = `
      SELECT 
        entry_date,
        entry_time,
        entry_type,
        structured_content,
        severity,
        protocol_compliant,
        notes,
        created_at
      FROM timeline_entries 
      WHERE user_id = $1 
        AND entry_date >= CURRENT_DATE - INTERVAL '${timeframeDays} days'
      ORDER BY entry_date, entry_time
    `;

    console.log('Executing query for user:', userId);
    const result = await client.query(query, [userId]);
    console.log(`Query returned ${result.rows.length} rows`);
    
    // Transform structured_content to content for analysis
    const transformedRows = result.rows.map(row => {
      let content = 'Unknown';
      
      if (row.structured_content) {
        try {
          const structured = typeof row.structured_content === 'string' 
            ? JSON.parse(row.structured_content) 
            : row.structured_content;
          
          // Extract the main item name based on entry type
          switch (row.entry_type) {
            case 'food':
              content = structured.food_name || structured.name || structured.item_name || 'Unknown Food';
              break;
            case 'symptom':
              content = structured.symptom_name || structured.name || structured.item_name || 'Unknown Symptom';
              break;
            case 'supplement':
              content = structured.supplement_name || structured.name || structured.item_name || 'Unknown Supplement';
              break;
            case 'medication':
              content = structured.medication_name || structured.name || structured.item_name || 'Unknown Medication';
              break;
            default:
              content = structured.name || structured.item_name || 'Unknown';
          }
        } catch (error) {
          console.warn('Error parsing structured_content:', error);
          content = 'Unknown';
        }
      }
      
      return {
        ...row,
        content // Add content field for analysis
      };
    });
    
    return transformedRows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Simplified correlation detection
 */
async function detectSimpleCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];

  try {
    // 1. Simple Food-Symptom Correlations
    const foodSymptomCorrelations = await detectSimpleFoodSymptomCorrelations(timelineData, confidenceThreshold);
    correlations.push(...foodSymptomCorrelations);
    console.log(`Found ${foodSymptomCorrelations.length} food-symptom correlations`);

    // 2. Simple Supplement-Improvement Correlations
    const supplementCorrelations = await detectSimpleSupplementImprovements(timelineData, confidenceThreshold);
    correlations.push(...supplementCorrelations);
    console.log(`Found ${supplementCorrelations.length} supplement correlations`);

  } catch (error) {
    console.error('Error in correlation detection:', error);
    // Return what we have so far instead of failing completely
  }

  return correlations;
}

/**
 * Simple food-symptom correlation detection
 */
async function detectSimpleFoodSymptomCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];
  
  try {
    const foodEntries = timelineData.filter(entry => entry.entry_type === 'food');
    const symptomEntries = timelineData.filter(entry => entry.entry_type === 'symptom');

    console.log(`Analyzing ${foodEntries.length} food entries and ${symptomEntries.length} symptom entries`);

    if (foodEntries.length === 0 || symptomEntries.length === 0) {
      return correlations;
    }

    // Group foods by name
    const foodGroups = {};
    for (const entry of foodEntries) {
      const foodName = entry.content.toLowerCase().trim();
      if (!foodGroups[foodName]) {
        foodGroups[foodName] = [];
      }
      foodGroups[foodName].push(entry);
    }

    // Analyze each food for correlations
    for (const [foodName, foodInstances] of Object.entries(foodGroups)) {
      if (foodInstances.length < 2) continue; // Need at least 2 instances

      for (const symptomType of getUniqueSymptoms(symptomEntries)) {
        const correlation = analyzeSimpleFoodSymptomCorrelation(
          foodInstances,
          symptomEntries.filter(s => s.content === symptomType),
          foodName,
          symptomType
        );

        if (correlation.confidence >= confidenceThreshold) {
          correlations.push(correlation);
        }
      }
    }
  } catch (error) {
    console.error('Error in food-symptom correlation detection:', error);
  }

  return correlations;
}

/**
 * Simple supplement improvement detection
 */
async function detectSimpleSupplementImprovements(timelineData, confidenceThreshold) {
  const correlations = [];
  
  try {
    const supplementEntries = timelineData.filter(entry => entry.entry_type === 'supplement');
    const symptomEntries = timelineData.filter(entry => entry.entry_type === 'symptom');

    console.log(`Analyzing ${supplementEntries.length} supplement entries and ${symptomEntries.length} symptom entries`);

    if (supplementEntries.length === 0 || symptomEntries.length === 0) {
      return correlations;
    }

    // Group supplements
    const supplementGroups = {};
    for (const entry of supplementEntries) {
      const supplementName = entry.content.toLowerCase().trim();
      if (!supplementGroups[supplementName]) {
        supplementGroups[supplementName] = [];
      }
      supplementGroups[supplementName].push(entry);
    }

    // Analyze each supplement
    for (const [supplementName, supplementInstances] of Object.entries(supplementGroups)) {
      if (supplementInstances.length < 3) continue; // Need more data for supplement analysis

      const startDate = new Date(Math.min(...supplementInstances.map(s => parseDateTime(s).getTime())));
      
      for (const symptomType of getUniqueSymptoms(symptomEntries)) {
        const correlation = analyzeSimpleSupplementImprovement(
          supplementInstances,
          symptomEntries.filter(s => s.content === symptomType),
          startDate,
          supplementName,
          symptomType
        );

        if (correlation.confidence >= confidenceThreshold) {
          correlations.push(correlation);
        }
      }
    }
  } catch (error) {
    console.error('Error in supplement correlation detection:', error);
  }

  return correlations;
}

/**
 * Simple food-symptom correlation analysis
 */
function analyzeSimpleFoodSymptomCorrelation(foodInstances, symptoms, foodName, symptomType) {
  let correlationCount = 0;
  let totalOpportunities = foodInstances.length;

  for (const foodEntry of foodInstances) {
    try {
      const foodTime = parseDateTime(foodEntry);
      const windowEnd = new Date(foodTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      const symptomInWindow = symptoms.find(symptom => {
        const symptomTime = parseDateTime(symptom);
        return symptomTime > foodTime && symptomTime <= windowEnd;
      });

      if (symptomInWindow) {
        correlationCount++;
      }
    } catch (error) {
      console.warn('Error analyzing food-symptom correlation:', error);
    }
  }

  const confidence = totalOpportunities > 0 ? correlationCount / totalOpportunities : 0;
  const percentage = Math.round(confidence * 100);

  return {
    type: 'food-symptom',
    trigger: foodName,
    effect: symptomType,
    timeWindow: 24,
    timeWindowDescription: 'within 24 hours',
    confidence: Math.round(confidence * 100) / 100,
    frequency: `${correlationCount}/${totalOpportunities} times`,
    occurrences: correlationCount,
    totalOpportunities,
    description: percentage > 50 
      ? `Your data suggests ${foodName} may trigger ${symptomType} (${percentage}% of the time)`
      : `Possible pattern: ${foodName} and ${symptomType} (${percentage}% correlation)`,
    recommendation: percentage > 50 
      ? `Consider monitoring ${foodName} consumption more closely`
      : `Continue tracking to confirm this potential pattern`
  };
}

/**
 * Simple supplement improvement analysis
 */
function analyzeSimpleSupplementImprovement(supplementInstances, symptoms, startDate, supplementName, symptomType) {
  try {
    const twoWeeksBefore = new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoWeeksAfter = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const symptomsBefore = symptoms.filter(s => {
      const sympTime = parseDateTime(s);
      return sympTime >= twoWeeksBefore && sympTime < startDate;
    });

    const symptomsAfter = symptoms.filter(s => {
      const sympTime = parseDateTime(s);
      return sympTime >= startDate && sympTime <= twoWeeksAfter;
    });

    const frequencyBefore = symptomsBefore.length / 14;
    const frequencyAfter = symptomsAfter.length / 14;

    const frequencyImprovement = frequencyBefore > 0 ? (frequencyBefore - frequencyAfter) / frequencyBefore : 0;
    const confidence = Math.max(0, frequencyImprovement);
    const improvementPercent = Math.round(confidence * 100);

    if (confidence <= 0) {
      return { confidence: 0 };
    }

    return {
      type: 'supplement-improvement',
      trigger: supplementName,
      effect: `reduced ${symptomType}`,
      timeWindow: 14 * 24,
      timeWindowDescription: 'after 2 weeks',
      confidence: Math.round(confidence * 100) / 100,
      frequency: `${Math.round(frequencyImprovement * 100)}% reduction in frequency`,
      description: improvementPercent > 30 
        ? `Your data suggests ${supplementName} may help reduce ${symptomType} (${improvementPercent}% improvement)`
        : `Possible benefit: ${supplementName} for ${symptomType} (${improvementPercent}% improvement)`,
      recommendation: improvementPercent > 30 
        ? `Consider continuing ${supplementName} - your data shows positive effects`
        : `Monitor ${supplementName} effects over a longer period`
    };
  } catch (error) {
    console.warn('Error analyzing supplement improvement:', error);
    return { confidence: 0 };
  }
}

/**
 * Helper function to safely parse date and time
 */
function parseDateTime(entry) {
  try {
    let dateStr;
    
    if (entry.entry_date instanceof Date) {
      dateStr = entry.entry_date.toISOString().split('T')[0];
    } else {
      dateStr = entry.entry_date;
    }
    
    const timeStr = entry.entry_time || '12:00:00';
    return new Date(`${dateStr}T${timeStr}`);
  } catch (error) {
    console.warn('Error parsing date/time:', error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Get unique symptom types
 */
function getUniqueSymptoms(symptomEntries) {
  try {
    return [...new Set(symptomEntries.map(s => s.content))];
  } catch (error) {
    console.warn('Error getting unique symptoms:', error);
    return [];
  }
}

module.exports = {
  handleGetCorrelationInsights
};
