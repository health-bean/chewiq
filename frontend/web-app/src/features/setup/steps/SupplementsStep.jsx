import React from 'react';
import { Button, Checkbox, Card } from '../../../../../shared/components/ui';
import { cn } from '../../../../../shared/design-system';
import { Pill, Heart, Shield, Zap, Sparkles, Brain } from 'lucide-react';

const SupplementsStep = ({ setupData, updateSetupData, onNext, onBack, isLast }) => {
  // Helper function to render icons by name
  const renderIcon = (iconName) => {
    const iconProps = { className: "w-4 h-4" };
    switch (iconName) {
      case 'Sparkles': return <Sparkles {...iconProps} />;
      case 'Heart': return <Heart {...iconProps} />;
      case 'Shield': return <Shield {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'Pill': return <Pill {...iconProps} />;
      case 'Brain': return <Brain {...iconProps} />;
      default: return <Pill {...iconProps} />;
    }
  };
  const commonSupplements = [
    { 
      id: 'vit_d', 
      name: 'Vitamin D', 
      category: 'Vitamin',
      iconName: 'Sparkles',
      color: 'text-yellow-600 bg-yellow-100'
    },
    { 
      id: 'omega_3', 
      name: 'Omega-3 Fish Oil', 
      category: 'Essential Fatty Acid',
      iconName: 'Heart',
      color: 'text-blue-600 bg-blue-100'
    },
    { 
      id: 'probiotic', 
      name: 'Probiotic', 
      category: 'Probiotic',
      iconName: 'Shield',
      color: 'text-green-600 bg-green-100'
    },
    { 
      id: 'magnesium', 
      name: 'Magnesium', 
      category: 'Mineral',
      iconName: 'Zap',
      color: 'text-purple-600 bg-purple-100'
    },
    { 
      id: 'zinc', 
      name: 'Zinc', 
      category: 'Mineral',
      iconName: 'Pill',
      color: 'text-gray-600 bg-gray-100'
    },
    { 
      id: 'b_complex', 
      name: 'B-Complex', 
      category: 'Vitamin',
      iconName: 'Brain',
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  const handleSupplementChange = (supplement, isChecked) => {
    const currentSupplements = setupData.supplements || [];
    
    if (isChecked) {
      // Store only plain data, no React components
      const plainSupplement = {
        id: supplement.id,
        name: supplement.name,
        category: supplement.category,
        color: supplement.color
      };
      updateSetupData({ 
        supplements: [...currentSupplements, plainSupplement]
      });
    } else {
      updateSetupData({ 
        supplements: currentSupplements.filter(s => s.id !== supplement.id)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Daily Supplements
        </h3>
        <p className="text-gray-600">
          Select supplements you take regularly for quick tracking and correlation analysis.
        </p>
      </div>

      {/* Supplements List */}
      <div className="space-y-3">
        {commonSupplements.map((supplement) => {
          const isSelected = setupData.supplements.some(s => s.id === supplement.id);
          
          return (
            <Card
              key={supplement.id}
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
                  supplement.color
                )}>
                  {renderIcon(supplement.iconName)}
                </div>
                
                <div className="flex-1">
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleSupplementChange(supplement, e.target.checked)}
                    label={supplement.name}
                    description={supplement.category}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <p className="text-sm text-cyan-800">
          <strong>Taking other supplements?</strong> You can add custom supplements 
          later when logging your daily entries. We'll track correlations with your symptoms.
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

export default SupplementsStep;
