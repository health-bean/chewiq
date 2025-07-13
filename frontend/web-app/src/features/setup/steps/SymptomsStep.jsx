import React from 'react';
import { Button, Checkbox, Card } from '../../../../../shared/components/ui';
import { cn } from '../../../../../shared/design-system';
import { Activity, Brain, Zap, Utensils, Sparkles, Moon } from 'lucide-react';

const SymptomsStep = ({ setupData, updateSetupData, onNext, onBack, isLast }) => {
  // Helper function to render icons by name
  const renderIcon = (iconName) => {
    const iconProps = { className: "w-4 h-4" };
    switch (iconName) {
      case 'Activity': return <Activity {...iconProps} />;
      case 'Brain': return <Brain {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'Utensils': return <Utensils {...iconProps} />;
      case 'Sparkles': return <Sparkles {...iconProps} />;
      case 'Moon': return <Moon {...iconProps} />;
      default: return <Activity {...iconProps} />;
    }
  };

  const commonSymptoms = [
    { 
      id: 'joint_pain', 
      name: 'Joint Pain', 
      category: 'Pain',
      iconName: 'Activity',
      color: 'text-red-600 bg-red-100'
    },
    { 
      id: 'brain_fog', 
      name: 'Brain Fog', 
      category: 'Cognitive',
      iconName: 'Brain',
      color: 'text-purple-600 bg-purple-100'
    },
    { 
      id: 'fatigue', 
      name: 'Fatigue', 
      category: 'Energy',
      iconName: 'Zap',
      color: 'text-orange-600 bg-orange-100'
    },
    { 
      id: 'digestive', 
      name: 'Digestive Issues', 
      category: 'Gut',
      iconName: 'Utensils',
      color: 'text-green-600 bg-green-100'
    },
    { 
      id: 'skin', 
      name: 'Skin Issues', 
      category: 'Skin',
      iconName: 'Sparkles',
      color: 'text-pink-600 bg-pink-100'
    },
    { 
      id: 'sleep', 
      name: 'Sleep Problems', 
      category: 'Sleep',
      iconName: 'Moon',
      color: 'text-indigo-600 bg-indigo-100'
    }
  ];

  const handleSymptomChange = (symptom, isChecked) => {
    const currentSymptoms = setupData.symptoms || [];
    
    if (isChecked) {
      // Store only plain data, no React components
      const plainSymptom = {
        id: symptom.id,
        name: symptom.name,
        category: symptom.category,
        color: symptom.color
      };
      updateSetupData({ 
        symptoms: [...currentSymptoms, plainSymptom]
      });
    } else {
      updateSetupData({ 
        symptoms: currentSymptoms.filter(s => s.id !== symptom.id)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Symptoms to Track
        </h3>
        <p className="text-gray-600">
          Select symptoms you want to track for quick entry and pattern analysis.
        </p>
      </div>

      {/* Symptoms Grid */}
      <div className="grid grid-cols-1 gap-3">
        {commonSymptoms.map((symptom) => {
          const isSelected = setupData.symptoms.some(s => s.id === symptom.id);
          
          return (
            <Card
              key={symptom.id}
              variant="outlined"
              padding="sm"
              className={cn(
                "transition-all duration-200",
                isSelected && "border-primary-300 bg-primary-50"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  symptom.color
                )}>
                  {renderIcon(symptom.iconName)}
                </div>
                
                <div className="flex-1">
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleSymptomChange(symptom, e.target.checked)}
                    label={symptom.name}
                    description={`${symptom.category} tracking`}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Don't see your symptom?</strong> You can always add custom symptoms 
          later when logging your daily entries.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex space-x-3">
        <Button 
          variant="secondary" 
          onClick={onBack} 
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={onNext} 
          className="flex-1"
        >
          {isLast ? 'Complete Setup' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default SymptomsStep;
