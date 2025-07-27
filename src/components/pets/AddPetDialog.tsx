
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { usePetContext } from "@/contexts/PetContext";
import { useToast } from "@/hooks/use-toast";
import PetTypeSelector from "./PetTypeSelector";
import BreedSelector from "./BreedSelector";
import DateOfBirthSelector from "./DateOfBirthSelector";
import GenderSelector from "./GenderSelector";
import WeightInput from "./WeightInput";
import PhotoUpload from "./PhotoUpload";
import PreExistingConditionsSelector from "./PreExistingConditionsSelector";
import ReproductiveStatusSelector from "./ReproductiveStatusSelector";

interface AddPetDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAddPet?: (pet: any) => Promise<void>;
}

const AddPetDialog = ({ open: controlledOpen, onOpenChange, onAddPet }: AddPetDialogProps) => {
  const { addPet } = usePetContext();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"dog" | "cat">("dog");
  const [breed, setBreed] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [weight, setWeight] = useState("0");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [photo, setPhoto] = useState("");
  const [preExistingConditions, setPreExistingConditions] = useState<string[]>([]);
  const [reproductiveStatus, setReproductiveStatus] = useState<'spayed' | 'neutered' | 'not_yet'>('not_yet');

  // Use controlled open state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const resetForm = () => {
    setName("");
    setType("dog");
    setBreed("");
    setDateOfBirth(undefined);
    setWeight("0");
    setWeightUnit("kg");
    setGender("male");
    setPhoto("");
    setPreExistingConditions([]);
    setReproductiveStatus('not_yet');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !breed || !dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const petData = {
        name,
        type,
        breed,
        dateOfBirth,
        weight: parseFloat(weight),
        weightUnit,
        gender,
        photo,
        preExistingConditions,
        reproductiveStatus,
        nextVaccination: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      if (onAddPet) {
        await onAddPet(petData);
      } else {
        await addPet(petData);
      }

      resetForm();
      setIsOpen(false);

      toast({
        title: "Success",
        description: "Pet added successfully!",
      });
    } catch (error) {
      console.error("Error adding pet:", error);
      toast({
        title: "Error",
        description: "Failed to add pet. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Pet
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Pet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pet Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <PetTypeSelector value={type} onChange={(value) => setType(value as "dog" | "cat")} />

          <BreedSelector 
            value={breed} 
            onChange={setBreed}
            petType={type}
          />

          <DateOfBirthSelector 
            value={dateOfBirth} 
            onChange={setDateOfBirth} 
          />

          <WeightInput 
            value={weight} 
            weightUnit={weightUnit}
            onChange={setWeight}
            onUnitChange={setWeightUnit}
          />

          <GenderSelector value={gender} onChange={(value) => setGender(value as "male" | "female")} />

          <PhotoUpload photo={photo} onPhotoChange={setPhoto} />

          <PreExistingConditionsSelector 
            value={preExistingConditions}
            onChange={setPreExistingConditions}
          />

          <ReproductiveStatusSelector 
            value={reproductiveStatus}
            onChange={(value) => setReproductiveStatus(value as 'spayed' | 'neutered' | 'not_yet')}
          />

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Pet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPetDialog;
