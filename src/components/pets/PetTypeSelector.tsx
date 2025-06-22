
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PetTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const PetTypeSelector = ({ value, onChange }: PetTypeSelectorProps) => {
  return (
    <div>
      <Label>Pet Type *</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex space-x-6 mt-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dog" id="dog" />
          <Label htmlFor="dog">🐕 Dog</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cat" id="cat" />
          <Label htmlFor="cat">🐱 Cat</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default PetTypeSelector;
