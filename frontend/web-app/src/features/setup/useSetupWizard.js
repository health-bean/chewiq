import { useState } from 'react';

const useSetupWizard = (protocols, updatePreferences, onComplete) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    setupType: null, // 'quick' or 'full'
    protocols: [],
    symptoms: [],
    supplements: [],
    medications: [],
    foods: [],
    detox: []
  });

  const steps = [
    { title: 'Welcome', key: 'welcome' },
    { title: 'Protocols', key: 'protocols' },
    { title: 'Symptoms', key: 'symptoms' },
    { title: 'Supplements', key: 'supplements' },
    { title: 'Medications', key: 'medications' },
    { title: 'Common Foods', key: 'foods' },
    { title: 'Detox Activities', key: 'detox' }
  ];

  const maxSteps = setupData.setupType === 'quick' ? 2 : steps.length;

  const handleNext = () => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeSetup();
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const completeSetup = async () => {
    console.log('Completing setup with data:', setupData);
    
    try {
      await updatePreferences({
        protocols: setupData.protocols,
        quick_symptoms: setupData.symptoms,
        quick_supplements: setupData.supplements,
        quick_medications: setupData.medications,
        quick_foods: setupData.foods,
        quick_detox: setupData.detox,
        setup_complete: true
      });
      
      console.log('Setup completed successfully');
      
      // Small delay to ensure preferences are saved
      setTimeout(() => {
        onComplete();
      }, 500);
      
    } catch (error) {
      console.error('Failed to complete setup:', error);
      // Still allow completion even if save fails
      onComplete();
    }
  };

  const updateSetupData = (updates) => {
    setSetupData({ ...setupData, ...updates });
  };

  return {
    currentStep,
    setupData,
    steps,
    maxSteps,
    handleNext,
    handleBack,
    updateSetupData,
    isFirst: currentStep === 0,
    isLast: currentStep === maxSteps - 1
  };
};

export default useSetupWizard;