
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
}

interface PetSwitcherProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
  onAddPet: () => void;
}

const PetSwitcher = ({ pets, selectedPet, onSelectPet, onAddPet }: PetSwitcherProps) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto">
      {pets.map((pet) => (
        <button
          key={pet.id}
          onClick={() => onSelectPet(pet)}
          className={`flex-shrink-0 relative ${
            selectedPet?.id === pet.id ? 'ring-2 ring-orange-500 ring-offset-2' : ''
          }`}
        >
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            {pet.photo ? (
              <img 
                src={pet.photo} 
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-white">
                {pet.type === 'dog' ? '🐕' : '🐱'}
              </span>
            )}
          </div>
          <p className="text-xs mt-1 text-center font-medium text-gray-700 truncate w-16">
            {pet.name}
          </p>
        </button>
      ))}
      
      {/* Add Pet Button */}
      <button
        onClick={onAddPet}
        className="flex-shrink-0 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
          <Plus className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-xs mt-1 text-center font-medium text-gray-500">Add Pet</p>
      </button>
    </div>
  );
};

export default PetSwitcher;
