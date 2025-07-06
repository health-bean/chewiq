import React from 'react';
import { Plus } from 'lucide-react';
import { Button, Input } from '../../../../../shared/components/ui';

const MedicationsStep = ({ onNext, onBack, isLast }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Medications</h3>
      <p className="text-sm text-gray-600">Add any medications you take regularly (optional).</p>
    </div>

    <div className="space-y-3">
      <Input
        placeholder="e.g., Thyroid medication, Blood pressure medication"
      />
      <Button variant="ghost" size="sm" icon={Plus}>
        Add Medication
      </Button>
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

export default MedicationsStep;