
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface GenderSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const GenderSelector = ({ value, onChange }: GenderSelectorProps) => {
  return (
    <div>
      <Label>Gender *</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex space-x-6 mt-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="male" id="male" />
          <Label htmlFor="male">♂️ Male</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="female" id="female" />
          <Label htmlFor="female">♀️ Female</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GenderSelector;
