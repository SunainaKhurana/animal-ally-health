
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePetContext } from "@/contexts/PetContext";
import PhotoUpload from "./PhotoUpload";
import PetTypeSelector from "./PetTypeSelector";
import BreedSelector from "./BreedSelector";
import GenderSelector from "./GenderSelector";
import DateOfBirthSelector from "./DateOfBirthSelector";
import WeightInput from "./WeightInput";
import PreExistingConditionsSelector from "./PreExistingConditionsSelector";
import ReproductiveStatusSelector from "./ReproductiveStatusSelector";

interface AddPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPet?: (pet: any) => void;
}

const AddPetDialog = ({ open, onOpenChange, onAddPet }: AddPetDialogProps) => {
  const { addPet } = usePetContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    breed: "",
    dateOfBirth: undefined as Date | undefined,
    weight: "",
    weightUnit: "lbs",
    gender: "",
    photo: "",
    preExistingConditions: [] as string[],
    reproductiveStatus: "not_yet"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.dateOfBirth || !formData.weight || !formData.gender) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const petData = {
        ...formData,
        weight: parseFloat(formData.weight),
        nextVaccination: "2024-08-15" // Mock next vaccination date
      };

      const newPet = await addPet(petData);
      
      if (newPet) {
        toast({
          title: "Pet added successfully! 🎉",
          description: `${formData.name} has been added to your pets.`,
        });

        // Reset form
        setFormData({
          name: "",
          type: "",
          breed: "",
          dateOfBirth: undefined,
          weight: "",
          weightUnit: "lbs",
          gender: "",
          photo: "",
          preExistingConditions: [],
          reproductiveStatus: "not_yet"
        });

        // Call callback if provided (for onboarding)
        if (onAddPet) {
          onAddPet(newPet);
        }

        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error adding pet:', error);
      toast({
        title: "Error adding pet",
        description: error.message || "Failed to add pet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-full">
        <SheetHeader className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute left-0 top-0 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-center">Add New Pet</SheetTitle>
          <Button
            type="submit"
            form="add-pet-form"
            className="absolute right-0 top-0 bg-orange-500 hover:bg-orange-600"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </SheetHeader>

        <div className="mt-6 h-full overflow-y-auto pb-20">
          <form id="add-pet-form" onSubmit={handleSubmit} className="space-y-4">
            <PhotoUpload 
              photo={formData.photo}
              onPhotoChange={(photo) => setFormData({ ...formData, photo })}
            />

            <div>
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your pet's name"
                className="mt-1"
              />
            </div>

            <PetTypeSelector
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value, breed: "" })}
            />

            <BreedSelector
              petType={formData.type}
              value={formData.breed}
              onChange={(value) => setFormData({ ...formData, breed: value })}
            />

            <GenderSelector
              value={formData.gender}
              onChange={(value) => setFormData({ ...formData, gender: value })}
            />

            <DateOfBirthSelector
              value={formData.dateOfBirth}
              onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
            />

            <WeightInput
              weight={formData.weight}
              weightUnit={formData.weightUnit}
              onWeightChange={(weight) => setFormData({ ...formData, weight })}
              onUnitChange={(unit) => setFormData({ ...formData, weightUnit: unit })}
            />

            <PreExistingConditionsSelector
              value={formData.preExistingConditions}
              onChange={(conditions) => setFormData({ ...formData, preExistingConditions: conditions })}
            />

            <div className="pb-4">
              <ReproductiveStatusSelector
                value={formData.reproductiveStatus}
                onChange={(status) => setFormData({ ...formData, reproductiveStatus: status })}
              />
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddPetDialog;
