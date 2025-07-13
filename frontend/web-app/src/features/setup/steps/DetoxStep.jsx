import React from 'react';
import { Button, Checkbox, Card } from '../../../../../shared/components/ui';

const DetoxStep = ({ setupData, updateSetupData, onNext, onBack, isLast }) => {
  // Simple detox activities - NO React components stored
  const detoxActivities = [
    { id: 'sauna', name: 'Sauna', category: 'Heat Therapy' },
    { id: 'infrared', name: 'Infrared Sauna', category: 'Heat Therapy' },
    { id: 'coffee_enema', name: 'Coffee Enema', category: 'Internal Cleansing' },
    { id: 'epsom_bath', name: 'Epsom Bath', category: 'Bath Therapy' },
    { id: 'detox_bath', name: 'Detox Bath', category: 'Bath Therapy' },
    { id: 'dry_brushing', name: 'Dry Brushing', category: 'Manual Therapy' },
    { id: 'cold_shower', name: 'Cold Shower', category: 'Cold Therapy' },
    { id: 'lymphatic_massage', name: 'Lymphatic Massage', category: 'Manual Therapy' }
  ];

  const handleDetoxToggle = (activityId, isChecked) => {
    const currentDetox = setupData.detox || [];
    
    if (isChecked) {
      // Find the activity and store ONLY plain data
      const activity = detoxActivities.find(a => a.id === activityId);
      const plainActivity = {
        id: activity.id,
        name: activity.name,
        category: activity.category
      };
      
      updateSetupData({ 
        detox: [...currentDetox, plainActivity]
      });
    } else {
      updateSetupData({ 
        detox: currentDetox.filter(activity => activity.id !== activityId)
      });
    }
  };

  const isActivitySelected = (activityId) => {
    return (setupData.detox || []).some(activity => activity.id === activityId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Detox Activities
        </h3>
        <p className="text-gray-600">
          Select detox activities you currently do or want to track
        </p>
      </div>

      {/* Detox Activities List */}
      <div className="space-y-3">
        {detoxActivities.map((activity) => {
          const isSelected = isActivitySelected(activity.id);
          
          return (
            <Card
              key={activity.id}
              variant={isSelected ? "default" : "outlined"}
              padding="sm"
            >
              <Checkbox
                checked={isSelected}
                onChange={(e) => handleDetoxToggle(activity.id, e.target.checked)}
                label={
                  <div>
                    <div className="font-medium text-gray-900">{activity.name}</div>
                    <div className="text-sm text-gray-500">{activity.category}</div>
                  </div>
                }
              />
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Don't see your detox activity?</strong> You can add custom activities 
          later in your timeline entries.
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

export default DetoxStep;
