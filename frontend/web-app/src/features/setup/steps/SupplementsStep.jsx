import React from 'react';
import { Button } from '../../../../../shared/components/ui';

const SupplementsStep = ({ setupData, updateSetupData, onNext, onBack, isLast }) => {
  const commonSupplements = [
    { id: 'vit_d', name: 'Vitamin D', category: 'Vitamin' },
    { id: 'omega_3', name: 'Omega-3 Fish Oil', category: 'Essential Fatty Acid' },
    { id: 'probiotic', name: 'Probiotic', category: 'Probiotic' },
    { id: 'magnesium', name: 'Magnesium', category: 'Mineral' },
    { id: 'zinc', name: 'Zinc', category: 'Mineral' },
    { id: 'b_complex', name: 'B-Complex', category: 'Vitamin' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Supplements</h3>
        <p className="text-sm text-gray-600">Select supplements you take regularly for quick tracking.</p>
      </div>

      <div className="space-y-2">
        {commonSupplements.map((supplement) => (
          <label
            key={supplement.id}
            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer ${
              setupData.supplements.some(s => s.id === supplement.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={setupData.supplements.some(s => s.id === supplement.id)}
              onChange={(e) => {
                const newSupplements = e.target.checked
                  ? [...setupData.supplements, supplement]
                  : setupData.supplements.filter(s => s.id !== supplement.id);
                updateSetupData({ supplements: newSupplements });
              }}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">{supplement.name}</span>
            <span className="text-sm text-gray-500">{supplement.category}</span>
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

export default SupplementsStep;