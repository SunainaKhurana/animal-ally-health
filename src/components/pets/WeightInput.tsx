
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WeightInputProps {
  value: string;
  weightUnit: string;
  onChange: (weight: string) => void;
  onUnitChange: (unit: string) => void;
}

const WeightInput = ({ value, weightUnit, onChange, onUnitChange }: WeightInputProps) => {
  return (
    <div>
      <Label htmlFor="weight">Weight *</Label>
      <div className="flex space-x-2 mt-1">
        <Input
          id="weight"
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Weight"
          className="flex-1"
        />
        <Select value={weightUnit} onValueChange={onUnitChange}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lbs">lbs</SelectItem>
            <SelectItem value="kg">kg</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default WeightInput;
