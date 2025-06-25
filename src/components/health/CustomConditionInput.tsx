
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomConditionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const CustomConditionInput = ({ 
  value, 
  onChange, 
  onKeyPress 
}: CustomConditionInputProps) => {
  return (
    <div className="space-y-2">
      <Label>Add other conditions (if not listed):</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter condition name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
        />
      </div>
    </div>
  );
};

export default CustomConditionInput;
