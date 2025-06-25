
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePets } from '@/hooks/usePets';

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

interface PetContextType {
  selectedPet: Pet | null;
  setSelectedPet: (pet: Pet | null) => void;
  pets: Pet[];
  loading: boolean;
  addPet: (pet: Omit<Pet, 'id'>) => Promise<Pet | null>;
  updatePet: (pet: Pet) => Promise<void>;
  deletePet: (petId: string) => Promise<void>;
  refetchPets: () => Promise<void>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const usePetContext = () => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePetContext must be used within a PetProvider');
  }
  return context;
};

interface PetProviderProps {
  children: ReactNode;
}

export const PetProvider = ({ children }: PetProviderProps) => {
  const { pets, loading, addPet, updatePet, deletePet, refetch } = usePets();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Auto-select first pet if none selected and pets are available
  useEffect(() => {
    if (!selectedPet && pets.length > 0) {
      setSelectedPet(pets[0]);
    }
  }, [pets, selectedPet]);

  // If selected pet is deleted or no longer exists, select first available pet
  useEffect(() => {
    if (selectedPet && !pets.find(pet => pet.id === selectedPet.id)) {
      setSelectedPet(pets.length > 0 ? pets[0] : null);
    }
  }, [pets, selectedPet]);

  const value: PetContextType = {
    selectedPet,
    setSelectedPet,
    pets,
    loading,
    addPet,
    updatePet,
    deletePet,
    refetchPets: refetch,
  };

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
};
