import React from 'react';
import useProtocols from '../../../../shared/hooks/useProtocols';
import useUserPreferences from '../../../../shared/hooks/useUserPreferences';
import useSetupWizard from './useSetupWizard';

// Import step components
import WelcomeStep from './steps/WelcomeStep';
import ProtocolsStep from './steps/ProtocolsStep';
import SymptomsStep from './steps/SymptomsStep';
import SupplementsStep from './steps/SupplementsStep';
import MedicationsStep from './steps/MedicationsStep';
import FoodsStep from './steps/FoodsStep';
import DetoxStep from './steps/DetoxStep';

const SetupWizard = ({ onComplete }) => {
  const { protocols } = useProtocols();
  const { updatePreferences } = useUserPreferences();
  
  const {
    currentStep,
    setupData,
    steps,
    maxSteps,
    handleNext,
    handleBack,
    updateSetupData,
    isFirst,
    isLast
  } = useSetupWizard(protocols, updatePreferences, onComplete);

  // Map step components
  const stepComponents = {
    welcome: WelcomeStep,
    protocols: ProtocolsStep,
    symptoms: SymptomsStep,
    supplements: SupplementsStep,
    medications: MedicationsStep,
    foods: FoodsStep,
    detox: DetoxStep
  };

  const CurrentStepComponent = stepComponents[steps[currentStep].key];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Setup</h2>
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {maxSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / maxSteps) * 100}%` }}
          />
        </div>
      </div>

      <CurrentStepComponent
        setupData={setupData}
        updateSetupData={updateSetupData}
        protocols={protocols}
        onNext={handleNext}
        onBack={handleBack}
        isFirst={isFirst}
        isLast={isLast}
      />
    </div>
  );
};

export default SetupWizard;