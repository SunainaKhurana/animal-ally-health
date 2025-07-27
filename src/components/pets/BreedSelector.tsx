
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dogBreeds, catBreeds } from "@/lib/petData";

interface BreedSelectorProps {
  value: string;
  onChange: (value: string) => void;
  petType: string;
}

const BreedSelector = ({ value, onChange, petType }: BreedSelectorProps) => {
  if (!petType) return null;

  const availableBreeds = petType === "dog" ? dogBreeds : catBreeds;

  return (
    <div>
      <Label>Breed {petType === "dog" && "*"}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder={`Select ${petType} breed`} />
        </SelectTrigger>
        <SelectContent>
          {availableBreeds.map((breed) => (
            <SelectItem key={breed} value={breed}>
              {breed}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BreedSelector;
