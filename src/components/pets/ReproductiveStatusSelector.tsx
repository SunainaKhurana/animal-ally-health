
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReproductiveStatusSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ReproductiveStatusSelector = ({ value, onChange }: ReproductiveStatusSelectorProps) => {
  return (
    <div>
      <Label htmlFor="reproductive-status">Reproductive Status (Optional)</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="not_yet">Not Yet</SelectItem>
          <SelectItem value="spayed">Spayed</SelectItem>
          <SelectItem value="neutered">Neutered</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReproductiveStatusSelector;
