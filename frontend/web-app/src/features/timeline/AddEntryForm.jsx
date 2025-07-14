import React from 'react';
import { Button, Card, Input, Select, Textarea } from '../../../../shared/components/ui';
import UnifiedSmartSelector from '../../components/common/UnifiedSmartSelector';
import QuickChecks from '../../components/common/QuickChecks';
import { ENTRY_TYPES } from '../../../../shared/constants/constants';

const AddEntryForm = ({ 
  formData, 
  updateFormData, 
  toggleSelectedFood, 
  handleQuickSelect,
  onSubmit,
  onCancel,
  preferences,
  exposureTypes,
  detoxTypes
}) => {
  return (
    <Card variant="primary" className="space-y-4">
      <div className="flex space-x-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => updateFormData({ time: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <Select
            value={formData.type}
            onChange={(e) => updateFormData({ type: e.target.value })}
          >
            <option value={ENTRY_TYPES.FOOD}>Food</option>
            <option value={ENTRY_TYPES.SYMPTOM}>Symptom</option>
            <option value={ENTRY_TYPES.SUPPLEMENT}>Supplement</option>
            <option value={ENTRY_TYPES.MEDICATION}>Medication</option>
            <option value={ENTRY_TYPES.EXPOSURE}>Exposure</option>
            <option value={ENTRY_TYPES.DETOX}>Detox</option>
          </Select>
        </div>
      </div>

      <Card>
        {/* All entry types use the unified selector */}
        <div className="space-y-3">
          <QuickChecks 
            type={formData.type} 
            preferences={preferences} 
            onQuickSelect={handleQuickSelect}
          />
          <UnifiedSmartSelector
            type={formData.type}
            selectedItems={formData.selectedItems || []}
            onItemsChange={(items) => {
              console.log('🔧 AddEntryForm: Items changed:', items);
              updateFormData({ selectedItems: items });
            }}
            selectedProtocols={preferences.protocols}
            prioritizeUserHistory={true}
          />
        </div>
      </Card>

      <div className="flex space-x-2">
        <Button variant="success" onClick={onSubmit} className="flex-1">
          Add Entry
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </Card>
  );
};

export default AddEntryForm;