
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ConditionsListProps {
  availableConditions: string[];
  selectedConditions: string[];
  onConditionToggle: (condition: string) => void;
}

const ConditionsList = ({ 
  availableConditions, 
  selectedConditions, 
  onConditionToggle 
}: ConditionsListProps) => {
  return (
    <div className="space-y-3">
      <Label>Select Common Conditions:</Label>
      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
        {availableConditions.map((condition) => (
          <div key={condition} className="flex items-center space-x-2">
            <Checkbox
              id={condition}
              checked={selectedConditions.includes(condition)}
              onCheckedChange={() => onConditionToggle(condition)}
            />
            <Label 
              htmlFor={condition}
              className="text-sm font-normal cursor-pointer flex-1"
            >
              {condition}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConditionsList;
