
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

  // Enhanced setSelectedPet that persists to localStorage
  const setSelectedPetWithPersistence = (pet: Pet | null) => {
    setSelectedPet(pet);
    if (pet && user) {
      localStorage.setItem(`selectedPetId_${user.id}`, pet.id);
      console.log('💾 Persisted selected pet:', pet.name);
    } else if (user) {
      localStorage.removeItem(`selectedPetId_${user.id}`);
      console.log('🗑️ Removed persisted pet selection');
    }
  };

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

  // Initialize selected pet from localStorage or auto-select
  useEffect(() => {
    if (!user || loading || initializationComplete) return;

    console.log('🎯 Pet initialization:', {
      hasUser: !!user,
      hasSelectedPet: !!selectedPet,
      petsCount: pets.length
    });

    if (pets.length > 0) {
      // Try to restore from localStorage first
      const savedPetId = localStorage.getItem(`selectedPetId_${user.id}`);
      const savedPet = savedPetId ? pets.find(pet => pet.id === savedPetId) : null;
      
      if (savedPet) {
        console.log('✅ Restored saved pet:', savedPet.name);
        setSelectedPet(savedPet);
      } else if (!selectedPet) {
        // Auto-select most recently added pet (first in list due to ordering)
        console.log('✅ Auto-selecting most recent pet:', pets[0].name);
        setSelectedPetWithPersistence(pets[0]);
      }
    }
    
    setInitializationComplete(true);
  }, [pets, selectedPet, user, loading, initializationComplete]);

  // Handle pet deletion or unavailability
  useEffect(() => {
    if (!user || loading || !initializationComplete) return;

    if (selectedPet && pets.length > 0) {
      const petExists = pets.find(pet => pet.id === selectedPet.id);
      if (!petExists) {
        console.log('⚠️ Selected pet no longer exists, selecting most recent pet');
        setSelectedPetWithPersistence(pets[0]);
      }
    } else if (!selectedPet && pets.length > 0) {
      // Ensure we always have a selected pet when pets are available
      console.log('🔄 No pet selected but pets available, selecting most recent');
      setSelectedPetWithPersistence(pets[0]);
    }
  }, [pets, selectedPet, user, loading, initializationComplete]);

  // Clear selected pet and localStorage when user logs out
  useEffect(() => {
    if (!user) {
      console.log('🚪 User logged out, clearing selected pet and localStorage');
      setSelectedPet(null);
      setInitializationComplete(false);
      // Clear all pet selections from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('selectedPetId_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [user]);

  const retry = () => {
    console.log('🔄 Retrying pet fetch...');
    setInitializationComplete(false);
    refetch();
  };

  // Enhanced add pet with auto-selection and persistence
  const handleAddPet = async (pet: Omit<Pet, 'id'>) => {
    try {
      const newPet = await addPet(pet);
      if (newPet) {
        console.log('🎯 Setting newly added pet as selected with persistence');
        setSelectedPetWithPersistence(newPet);
      }
      return newPet;
    } catch (error) {
      console.error('❌ Error adding pet:', error);
      throw error;
    }
  };

  // Enhanced delete pet with cleanup and auto-reselection
  const handleDeletePet = async (petId: string) => {
    try {
      await deletePet(petId);
      
      // If we deleted the selected pet, select the next available pet
      if (selectedPet?.id === petId) {
        console.log('🗑️ Deleted selected pet, selecting next available');
        const remainingPets = pets.filter(p => p.id !== petId);
        if (remainingPets.length > 0) {
          setSelectedPetWithPersistence(remainingPets[0]);
        } else {
          setSelectedPet(null);
          if (user) {
            localStorage.removeItem(`selectedPetId_${user.id}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error deleting pet:', error);
      throw error;
    }
  };

  const value: PetContextType = {
    selectedPet,
    setSelectedPet: setSelectedPetWithPersistence,
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
