
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  error: string | null;
  addPet: (pet: Omit<Pet, 'id'>) => Promise<Pet | null>;
  updatePet: (pet: Pet) => Promise<void>;
  deletePet: (petId: string) => Promise<void>;
  refetchPets: () => Promise<void>;
  retry: () => void;
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
  const { user, session } = useAuth();
  const { pets, loading, addPet, updatePet, deletePet, refetch, error } = usePets();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Auto-select first pet if none selected and pets are available
  useEffect(() => {
    if (user && !selectedPet && pets.length > 0) {
      console.log('Auto-selecting first pet:', pets[0].name);
      setSelectedPet(pets[0]);
    }
  }, [pets, selectedPet, user]);

  // If selected pet is deleted or no longer exists, select first available pet
  useEffect(() => {
    if (user && selectedPet && !pets.find(pet => pet.id === selectedPet.id)) {
      console.log('Selected pet no longer exists, selecting new pet');
      setSelectedPet(pets.length > 0 ? pets[0] : null);
    }
  }, [pets, selectedPet, user]);

  // Clear selected pet when user logs out
  useEffect(() => {
    if (!user) {
      console.log('User logged out, clearing selected pet');
      setSelectedPet(null);
    }
  }, [user]);

  const retry = () => {
    console.log('Retrying pet fetch...');
    refetch();
  };

  const value: PetContextType = {
    selectedPet,
    setSelectedPet,
    pets,
    loading,
    error,
    addPet,
    updatePet,
    deletePet,
    refetchPets: refetch,
    retry
  };

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
};
