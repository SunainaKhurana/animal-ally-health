import { useState, useEffect } from "react";
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
import PreExistingConditionsSelector from "./PreExistingConditionsSelector";
import ReproductiveStatusSelector from "./ReproductiveStatusSelector";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  dateOfBirth: Date;
  weight: number;
  weightUnit?: string;
  gender: 'male' | 'female';
  photo?: string;
  nextVaccination?: string;
  preExistingConditions?: string[];
  reproductiveStatus?: 'spayed' | 'neutered' | 'not_yet';
}

interface EditPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: Pet | null;
  onUpdatePet: (updatedPet: Pet) => void;
}

const EditPetDialog = ({ open, onOpenChange, pet, onUpdatePet }: EditPetDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "" as 'dog' | 'cat' | "",
    breed: "",
    dateOfBirth: undefined as Date | undefined,
    weight: "",
    weightUnit: "lbs",
    gender: "" as 'male' | 'female' | "",
    photo: "",
    nextVaccination: "",
    preExistingConditions: [] as string[],
    reproductiveStatus: "not_yet"
  });

  useEffect(() => {
    if (pet) {
      console.log('Setting form data for pet:', pet);
      setFormData({
        name: pet.name,
        type: pet.type,
        breed: pet.breed || "",
        dateOfBirth: pet.dateOfBirth,
        weight: pet.weight.toString(),
        weightUnit: pet.weightUnit || "lbs",
        gender: pet.gender,
        photo: pet.photo || "",
        nextVaccination: pet.nextVaccination || "",
        preExistingConditions: pet.preExistingConditions || [],
        reproductiveStatus: pet.reproductiveStatus || "not_yet"
      });
    }
  }, [pet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !formData.name || !formData.type || !formData.dateOfBirth || !formData.weight || !formData.gender) {
      console.log('Form validation failed');
      return;
    }

    const updatedPet: Pet = {
      ...pet,
      name: formData.name,
      type: formData.type as 'dog' | 'cat',
      breed: formData.breed,
      dateOfBirth: formData.dateOfBirth,
      weight: parseFloat(formData.weight),
      weightUnit: formData.weightUnit,
      gender: formData.gender as 'male' | 'female',
      photo: formData.photo,
      nextVaccination: formData.nextVaccination,
      preExistingConditions: formData.preExistingConditions,
      reproductiveStatus: formData.reproductiveStatus as 'spayed' | 'neutered' | 'not_yet'
    };

    console.log('Submitting updated pet data:', updatedPet);
    onUpdatePet(updatedPet);
    onOpenChange(false);
  };

  if (!pet) return null;

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
          <SheetTitle className="text-center">Edit {pet.name}'s Profile</SheetTitle>
          <Button
            type="submit"
            form="edit-pet-form"
            className="absolute right-0 top-0 bg-orange-500 hover:bg-orange-600"
          >
            Save
          </Button>
        </SheetHeader>

        <div className="mt-6 h-full overflow-y-auto pb-20">
          <form id="edit-pet-form" onSubmit={handleSubmit} className="space-y-4">
            <PhotoUpload 
              photo={formData.photo}
              onPhotoChange={(photo) => {
                console.log('Photo changed in EditPetDialog:', photo.substring(0, 50) + '...');
                setFormData({ ...formData, photo });
              }}
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
              onChange={(value) => setFormData({ ...formData, type: value as 'dog' | 'cat', breed: "" })}
            />

            <BreedSelector
              petType={formData.type}
              value={formData.breed}
              onChange={(value) => setFormData({ ...formData, breed: value })}
            />

            <GenderSelector
              value={formData.gender}
              onChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' })}
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

            <ReproductiveStatusSelector
              value={formData.reproductiveStatus}
              onChange={(status) => setFormData({ ...formData, reproductiveStatus: status })}
            />

            <div className="pb-4">
              <Label htmlFor="nextVaccination">Next Vaccination</Label>
              <Input
                id="nextVaccination"
                value={formData.nextVaccination}
                onChange={(e) => setFormData({ ...formData, nextVaccination: e.target.value })}
                placeholder="e.g., 2024-12-15"
                className="mt-1"
              />
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditPetDialog;
