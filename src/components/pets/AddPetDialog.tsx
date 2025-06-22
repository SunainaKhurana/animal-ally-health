
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Camera, CalendarIcon, X, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { dogBreeds, catBreeds } from "@/lib/petData";
import { calculateAge } from "@/lib/dateUtils";

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

  const availableBreeds = formData.type === "dog" ? dogBreeds : catBreeds;
  const currentAge = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute -left-2 -top-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-center">Add New Pet</DialogTitle>
          <Button
            type="submit"
            form="add-pet-form"
            variant="ghost"
            size="icon"
            className="absolute -right-2 -top-1 h-8 w-8 text-orange-500"
          >
            <Check className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form id="add-pet-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
              {formData.photo ? (
                <img src={formData.photo} alt="Pet" className="w-full h-full rounded-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <Button type="button" variant="outline" size="sm">
              Add Photo
            </Button>
          </div>

          {/* Pet Name */}
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

          {/* Pet Type */}
          <div>
            <Label>Pet Type *</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value, breed: "" })}
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

          {/* Breed */}
          {formData.type && (
            <div>
              <Label>Breed {formData.type === "dog" && "*"}</Label>
              <Select value={formData.breed} onValueChange={(value) => setFormData({ ...formData, breed: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={`Select ${formData.type} breed`} />
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
          )}

          {/* Gender */}
          <div>
            <Label>Gender *</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
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

          {/* Date of Birth */}
          <div>
            <Label>Date of Birth *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !formData.dateOfBirth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dateOfBirth}
                  onSelect={(date) => setFormData({ ...formData, dateOfBirth: date })}
                  disabled={(date) => date > new Date() || date < new Date("1990-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {currentAge && (
              <p className="text-sm text-gray-600 mt-1">Current age: {currentAge}</p>
            )}
          </div>

          {/* Weight */}
          <div className="pb-4">
            <Label htmlFor="weight">Weight *</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="Weight"
                className="flex-1"
              />
              <Select 
                value={formData.weightUnit} 
                onValueChange={(value) => setFormData({ ...formData, weightUnit: value })}
              >
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPetDialog;
