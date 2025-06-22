
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import PetTypeSelector from "./PetTypeSelector";
import BreedSelector from "./BreedSelector";
import GenderSelector from "./GenderSelector";
import DateOfBirthSelector from "./DateOfBirthSelector";
import WeightInput from "./WeightInput";

interface AddPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPet: (pet: any) => void;
}

const AddPetDialog = ({ open, onOpenChange, onAddPet }: AddPetDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    breed: "",
    dateOfBirth: undefined as Date | undefined,
    weight: "",
    weightUnit: "lbs",
    gender: "",
    photo: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.dateOfBirth || !formData.weight || !formData.gender) {
      return;
    }

    onAddPet({
      ...formData,
      weight: parseFloat(formData.weight),
      nextVaccination: "2024-08-15" // Mock next vaccination date
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
      photo: ""
    });
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
          >
            Save
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

            <div className="pb-4">
              <WeightInput
                weight={formData.weight}
                weightUnit={formData.weightUnit}
                onWeightChange={(weight) => setFormData({ ...formData, weight })}
                onUnitChange={(unit) => setFormData({ ...formData, weightUnit: unit })}
              />
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddPetDialog;
