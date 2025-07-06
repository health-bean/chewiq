import React from 'react';
import { Button } from '../../../../../shared/components/ui';

const FoodsStep = ({ setupData, updateSetupData, onNext, onBack, isLast }) => {
  const commonFoods = [
    { id: 'chicken', name: 'Chicken breast', category: 'Protein' },
    { id: 'beef', name: 'Ground beef', category: 'Protein' },
    { id: 'salmon', name: 'Salmon', category: 'Protein' },
    { id: 'broccoli', name: 'Broccoli', category: 'Vegetable' },
    { id: 'avocado', name: 'Avocado', category: 'Fat' },
    { id: 'bone_broth', name: 'Bone broth', category: 'Beverage' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Common Foods</h3>
        <p className="text-sm text-gray-600">Select foods you eat regularly for quick tracking.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {commonFoods.map((food) => (
          <label
            key={food.id}
            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer text-sm ${
              setupData.foods.some(f => f.id === food.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={setupData.foods.some(f => f.id === food.id)}
              onChange={(e) => {
                const newFoods = e.target.checked
                  ? [...setupData.foods, food]
                  : setupData.foods.filter(f => f.id !== food.id);
                updateSetupData({ foods: newFoods });
              }}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium">{food.name}</div>
              <div className="text-xs text-gray-500">{food.category}</div>
            </div>
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

export default FoodsStep;