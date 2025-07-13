import React from 'react';
import { Rocket, ClipboardList } from 'lucide-react';
import { Button, Card } from '../../../../../shared/components/ui';
import { cn } from '../../../../../shared/design-system';

const WelcomeStep = ({ setupData, updateSetupData, onNext }) => {
  const setupOptions = [
    {
      type: 'quick',
      icon: <Rocket className="w-6 h-6" />,
      title: 'Quick Start',
      duration: '2 min',
      description: 'Jump right in and explore with basic setup',
      recommended: false
    },
    {
      type: 'full',
      icon: <ClipboardList className="w-6 h-6" />,
      title: 'Full Setup',
      duration: '5 min',
      description: 'Get the complete personalized experience',
      recommended: true
    }
  ];

  const handleSetupChoice = (setupType) => {
    updateSetupData({ setupType });
  };

  const canProceed = setupData.setupType !== null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Welcome to FILO Health!
        </h3>
        <p className="text-gray-600 text-lg">
          Let's set up your personalized health journey. How would you like to begin?
        </p>
      </div>

      {/* Setup Options */}
      <div className="space-y-4">
        {setupOptions.map((option) => {
          const isSelected = setupData.setupType === option.type;
          
          return (
            <Card
              key={option.type}
              variant={isSelected ? "default" : "outlined"}
              padding="none"
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected && "border-primary-300 bg-primary-50 shadow-sm",
                "focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
              )}
              onClick={() => handleSetupChoice(option.type)}
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                    isSelected 
                      ? "bg-primary-600 text-white" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {option.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {option.title}
                      </h4>
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        isSelected
                          ? "bg-primary-100 text-primary-700"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {option.duration}
                      </span>
                      {option.recommended && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {option.description}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Setup Type Explanation */}
      {setupData.setupType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            {setupData.setupType === 'quick' ? 'Quick Start' : 'Full Setup'} Selected
          </h4>
          <p className="text-sm text-blue-700">
            {setupData.setupType === 'quick' 
              ? 'You\'ll set up basic protocols and can add more details later in your preferences.'
              : 'We\'ll walk you through all the options to create a comprehensive health profile.'
            }
          </p>
        </div>
      )}

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Don't worry - you can always change these settings later in your preferences.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button 
          onClick={onNext}
          disabled={!canProceed}
          variant="primary"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default WelcomeStep;
