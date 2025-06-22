
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  photo?: string;
}

interface PetSelectorProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
  placeholder?: string;
}

const PetSelector = ({ pets, selectedPet, onSelectPet, placeholder = "Select a pet" }: PetSelectorProps) => {
  if (pets.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="p-4 text-center">
          <p className="text-gray-600 text-sm">No pets found</p>
        </CardContent>
      </Card>
    );
  }

  if (pets.length === 1) {
    const pet = pets[0];
    return (
      <Card className="cursor-pointer" onClick={() => onSelectPet(pet)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              {pet.photo ? (
                <img 
                  src={pet.photo} 
                  alt={pet.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm">{pet.type === 'dog' ? '🐕' : '🐱'}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{pet.name}</h3>
              <p className="text-sm text-gray-600">{pet.breed}</p>
            </div>
            <Check className="h-4 w-4 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {selectedPet ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    {selectedPet.photo ? (
                      <img 
                        src={selectedPet.photo} 
                        alt={selectedPet.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{selectedPet.type === 'dog' ? '🐕' : '🐱'}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedPet.name}</h3>
                    <p className="text-sm text-gray-600">{selectedPet.breed}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">{placeholder}</p>
              )}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {pets.map((pet) => (
          <DropdownMenuItem
            key={pet.id}
            onClick={() => onSelectPet(pet)}
            className="p-3"
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                {pet.photo ? (
                  <img 
                    src={pet.photo} 
                    alt={pet.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs">{pet.type === 'dog' ? '🐕' : '🐱'}</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{pet.name}</h4>
                <p className="text-xs text-gray-600">{pet.breed}</p>
              </div>
              {selectedPet?.id === pet.id && (
                <Check className="h-4 w-4 text-orange-500" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PetSelector;
