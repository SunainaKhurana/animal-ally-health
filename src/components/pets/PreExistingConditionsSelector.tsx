
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

const COMMON_CONDITIONS = [
  'Hip Dysplasia',
  'Addison\'s Disease',
  'Diabetes',
  'Epilepsy',
  'Heart Disease',
  'Kidney Disease',
  'Arthritis',
  'Allergies',
  'Thyroid Issues',
  'Eye Problems'
];

interface PreExistingConditionsSelectorProps {
  value: string[];
  onChange: (conditions: string[]) => void;
}

const PreExistingConditionsSelector = ({ value, onChange }: PreExistingConditionsSelectorProps) => {
  const [newCondition, setNewCondition] = useState('');

  const addCondition = (condition: string) => {
    if (condition && !value.includes(condition)) {
      onChange([...value, condition]);
    }
    setNewCondition('');
  };

  const removeCondition = (condition: string) => {
    onChange(value.filter(c => c !== condition));
  };

  return (
    <div className="space-y-3">
      <Label>Pre-existing Conditions (Optional)</Label>
      
      {/* Custom condition input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom condition"
          value={newCondition}
          onChange={(e) => setNewCondition(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCondition(newCondition)}
        />
        <Button 
          type="button"
          size="sm" 
          onClick={() => addCondition(newCondition)}
          disabled={!newCondition}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Common conditions */}
      <div className="grid grid-cols-2 gap-2">
        {COMMON_CONDITIONS.map((condition) => (
          <Button
            key={condition}
            type="button"
            variant={value.includes(condition) ? "default" : "outline"}
            size="sm"
            className="text-xs justify-start h-auto p-2"
            onClick={() => {
              if (value.includes(condition)) {
                removeCondition(condition);
              } else {
                addCondition(condition);
              }
            }}
          >
            {condition}
          </Button>
        ))}
      </div>

      {/* Selected conditions */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Conditions:</Label>
          <div className="flex flex-wrap gap-1">
            {value.map((condition) => (
              <Badge key={condition} variant="secondary" className="text-xs">
                {condition}
                <button
                  type="button"
                  onClick={() => removeCondition(condition)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreExistingConditionsSelector;
