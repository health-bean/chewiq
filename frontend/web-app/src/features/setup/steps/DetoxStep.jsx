import React from 'react';
import { Button } from '../../../../../shared/components/ui';

const DetoxStep = ({ setupData, updateSetupData, onNext, onBack, isLast }) => {
  const commonDetoxActivities = [
    { id: 'sauna', name: 'Sauna', category: 'Heat' },
    { id: 'infrared', name: 'Infrared Sauna', category: 'Heat' },
    { id: 'coffee_enema', name: 'Coffee Enema', category: 'Internal' },
    { id: 'epsom_bath', name: 'Epsom Bath', category: 'Bath' },
    { id: 'detox_bath', name: 'Detox Bath', category: 'Bath' },
    { id: 'dry_brushing', name: 'Dry Brushing', category: 'Manual' },
    { id: 'cold_plunge', name: 'Cold Plunge', category: 'Cold' },
    { id: 'lymphatic', name: 'Lymphatic Massage', category: 'Manual' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Detox Activities</h3>
        <p className="text-sm text-gray-600">Select detox activities you do regularly for quick tracking.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {commonDetoxActivities.map((detox) => (
          <label
            key={detox.id}
            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer text-sm ${
              setupData.detox.some(d => d.id === detox.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={setupData.detox.some(d => d.id === detox.id)}
              onChange={(e) => {
                const newDetox = e.target.checked
                  ? [...setupData.detox, detox]
                  : setupData.detox.filter(d => d.id !== detox.id);
                updateSetupData({ detox: newDetox });
              }}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <div>
              <div className="font-medium">{detox.name}</div>
              <div className="text-xs text-gray-500">{detox.category}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex space-x-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Complete Setup
        </Button>
      </div>
    </div>
  );
};

export default DetoxStep;