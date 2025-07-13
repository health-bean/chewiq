import { useState } from 'react';

const useSetupWizard = (protocols, updatePreferences, onComplete) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [setupData, setSetupData] = useState({
    setupType: null, // 'quick' or 'full'
    protocols: [],
    symptoms: [],
    supplements: [],
    medications: [],
    foods: [],
    detox: [] // Ensure this starts as empty array
  });

  const steps = [
    { title: 'Welcome', key: 'welcome', required: true },
    { title: 'Protocols', key: 'protocols', required: false },
    { title: 'Symptoms', key: 'symptoms', required: false },
    { title: 'Supplements', key: 'supplements', required: false },
    { title: 'Medications', key: 'medications', required: false },
    { title: 'Common Foods', key: 'foods', required: false },
    { title: 'Detox Activities', key: 'detox', required: false }
  ];

  const maxSteps = setupData.setupType === 'quick' ? 2 : steps.length;

  // Validation for each step
  const validateStep = (stepKey) => {
    switch (stepKey) {
      case 'welcome':
        return setupData.setupType !== null;
      case 'protocols':
        // Protocols step is always valid (user can select none)
        return true;
      default:
        return true;
    }
  };

  const canProceed = () => {
    if (!steps[currentStep]) return false;
    const currentStepKey = steps[currentStep].key;
    return validateStep(currentStepKey);
  };

  const handleNext = () => {
    if (!canProceed()) {
      setError('Please make a selection before continuing.');
      return;
    }

    setError(null);
    
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeSetup();
    }
  };

  const handleBack = () => {
    if (completing) return; // Don't allow back during completion
    setError(null);
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  // Clean data to remove any circular references or non-serializable values
  const cleanDataForSerialization = (data) => {
    if (data === null || data === undefined) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => cleanDataForSerialization(item));
    }
    
    if (typeof data === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip React-specific properties
        if (key.startsWith('__react') || key.startsWith('_react')) continue;
        
        // Skip functions and DOM elements
        if (typeof value === 'function' || 
            (value && typeof value === 'object' && value.nodeType)) continue;
            
        cleaned[key] = cleanDataForSerialization(value);
      }
      return cleaned;
    }
    
    return data;
  };

  const completeSetup = async () => {
    try {
      setCompleting(true);
      setError(null);
      
      // Build clean preferences object
      const sanitizeArray = (data) => {
        if (!Array.isArray(data)) return [];
        
        return data.map(item => {
          if (item && typeof item === 'object') {
            // Only keep plain data properties, exclude React components
            const sanitized = {};
            ['id', 'name', 'category', 'color', 'addedAt'].forEach(key => {
              if (item[key] !== undefined && typeof item[key] !== 'object') {
                sanitized[key] = item[key];
              }
            });
            return sanitized;
          }
          return item;
        }).filter(item => item && item.id);
      };
      
      const preferencesUpdate = {
        protocols: setupData.protocols || [],
        quick_symptoms: sanitizeArray(setupData.symptoms),
        quick_supplements: sanitizeArray(setupData.supplements),
        quick_medications: sanitizeArray(setupData.medications),
        quick_foods: sanitizeArray(setupData.foods),
        quick_detox: sanitizeArray(setupData.detox),
        setup_complete: true,
        setup_type: setupData.setupType,
        setup_completed_at: new Date().toISOString()
      };
      
      // Test serialization
      JSON.stringify(preferencesUpdate);
      
      // Save preferences
      await updatePreferences(preferencesUpdate);
      
      // Call completion callback
      if (onComplete) {
        await onComplete();
      }
      
    } catch (error) {
      console.error('Setup completion failed:', error);
      setError('Failed to save setup. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const retryComplete = () => {
    setError(null);
    completeSetup();
  };

  const resetSetupData = () => {
    setSetupData({
      setupType: null,
      protocols: [],
      symptoms: [],
      supplements: [],
      medications: [],
      foods: [],
      detox: []
    });
  };

  const updateSetupData = (updates) => {
    if (completing) return; // Don't allow changes during completion
    
    setSetupData(prev => {
      const newData = { ...prev, ...updates };
      return newData;
    });
    
    // Clear any validation errors when user makes changes
    if (error) {
      setError(null);
    }
  };

  const isFirst = currentStep === 0;
  const isLast = currentStep === maxSteps - 1;

  return {
    currentStep,
    setupData,
    steps: steps.slice(0, maxSteps),
    maxSteps,
    handleNext,
    handleBack,
    updateSetupData,
    completing,
    error,
    retryComplete,
    isFirst,
    isLast,
    canProceed: canProceed(),
    validateStep
  };
};

export default useSetupWizard;
