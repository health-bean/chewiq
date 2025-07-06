import React from 'react';
import { Button } from '../../../../../shared/components/ui';

const SymptomsStep = ({ setupData, updateSetupData, onNext, onBack, isLast }) => {
  const commonSymptoms = [
    { id: 'joint_pain', name: 'Joint Pain', category: 'Pain' },
    { id: 'brain_fog', name: 'Brain Fog', category: 'Cognitive' },
    { id: 'fatigue', name: 'Fatigue', category: 'Energy' },
    { id: 'digestive', name: 'Digestive Issues', category: 'Gut' },
    { id: 'skin', name: 'Skin Issues', category: 'Skin' },
    { id: 'sleep', name: 'Sleep Problems', category: 'Sleep' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Symptoms You're Tracking</h3>
        <p className="text-sm text-gray-600">Select symptoms you want to track for quick entry later.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {commonSymptoms.map((symptom) => (
          <label
            key={symptom.id}
            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer text-sm ${
              setupData.symptoms.some(s => s.id === symptom.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={setupData.symptoms.some(s => s.id === symptom.id)}
              onChange={(e) => {
                const newSymptoms = e.target.checked
                  ? [...setupData.symptoms, symptom]
                  : setupData.symptoms.filter(s => s.id !== symptom.id);
                updateSetupData({ symptoms: newSymptoms });
              }}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>{symptom.name}</span>
          </label>
        ))}
      </div>

      <div className="flex space-x-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          {isLast ? 'Complete Setup' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default SymptomsStep;