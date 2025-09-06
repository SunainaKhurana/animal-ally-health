
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedPets } from '@/hooks/useOptimizedPets';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

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

const PetProviderInner = ({ children }: PetProviderProps) => {
  const { user, session } = useAuth();
  const { pets, loading, addPet, updatePet, deletePet, refetch, error } = useOptimizedPets();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Debug logging for context state
  useEffect(() => {
    console.log('🔍 PetContext Debug:', {
      user: user ? { id: user.id, email: user.email } : null,
      petsCount: pets.length,
      selectedPet: selectedPet ? { id: selectedPet.id, name: selectedPet.name } : null,
      loading,
      error,
      initializationComplete
    });
  }, [user, pets, selectedPet, loading, error, initializationComplete]);

  // Auto-select first pet if none selected and pets are available - but preserve user selection
  useEffect(() => {
    if (!user || loading || initializationComplete) return;

    console.log('🎯 Auto-selection check:', {
      hasUser: !!user,
      hasSelectedPet: !!selectedPet,
      petsCount: pets.length,
      firstPet: pets[0] ? { id: pets[0].id, name: pets[0].name } : null
    });

    // Only auto-select if no pet is selected AND we have pets available
    // This preserves user's manual selection
    if (!selectedPet && pets.length > 0) {
      console.log('✅ Auto-selecting first pet:', pets[0].name);
      setSelectedPet(pets[0]);
    }
    
    setInitializationComplete(true);
  }, [pets, selectedPet, user, loading, initializationComplete]);

  // Only reselect if the current selected pet no longer exists
  useEffect(() => {
    if (!user || loading || !initializationComplete) return;

    if (selectedPet && pets.length > 0) {
      const petExists = pets.find(pet => pet.id === selectedPet.id);
      if (!petExists) {
        console.log('⚠️ Selected pet no longer exists, selecting new pet');
        setSelectedPet(pets.length > 0 ? pets[0] : null);
      }
    }
    // Removed the auto-reselection when selectedPet is null but pets exist
    // This preserves user's choice to not have a pet selected
  }, [pets, selectedPet, user, loading, initializationComplete]);

  // Clear selected pet when user logs out
  useEffect(() => {
    if (!user) {
      console.log('🚪 User logged out, clearing selected pet');
      setSelectedPet(null);
      setInitializationComplete(false);
    }
  }, [user]);

  const retry = () => {
    console.log('🔄 Retrying pet fetch...');
    setInitializationComplete(false);
    refetch();
  };

  // Enhanced add pet with error handling
  const handleAddPet = async (pet: Omit<Pet, 'id'>) => {
    try {
      const newPet = await addPet(pet);
      if (newPet && !selectedPet) {
        console.log('🎯 Setting newly added pet as selected');
        setSelectedPet(newPet);
      }
      return newPet;
    } catch (error) {
      console.error('❌ Error adding pet:', error);
      throw error;
    }
  };

  // Enhanced delete pet with cleanup
  const handleDeletePet = async (petId: string) => {
    try {
      await deletePet(petId);
      
      // If we deleted the selected pet, clear selection
      if (selectedPet?.id === petId) {
        console.log('🗑️ Deleted selected pet, clearing selection');
        setSelectedPet(null);
      }
    } catch (error) {
      console.error('❌ Error deleting pet:', error);
      throw error;
    }
  };

  const value: PetContextType = {
    selectedPet,
    setSelectedPet,
    pets,
    loading: loading || !initializationComplete,
    error,
    addPet: handleAddPet,
    updatePet,
    deletePet: handleDeletePet,
    refetchPets: refetch,
    retry
  };

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
};

export const PetProvider = ({ children }: PetProviderProps) => {
  return (
    <ErrorBoundary>
      <PetProviderInner>{children}</PetProviderInner>
    </ErrorBoundary>
  );
};
