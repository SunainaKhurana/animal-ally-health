import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PerformanceOptimizer, CompressedStorage } from '@/lib/performanceOptimizer';

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

const PETS_CACHE_KEY = 'pets_cache_';
const CACHE_DURATION = 600000; // 10 minutes

export const useOptimizedPets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, session } = useAuth();

  // Memoized cache key
  const cacheKey = useMemo(() => 
    user ? `${PETS_CACHE_KEY}${user.id}` : null, 
    [user?.id]
  );

  // Optimized data transformation
  const transformPetData = useCallback((rawPet: any): Pet => {
    const currentDate = new Date();
    let birthDate = new Date(currentDate);
    
    // Simplified age calculation
    if (rawPet.age_years || rawPet.age_months) {
      const years = rawPet.age_years || 0;
      const months = rawPet.age_months || 0;
      birthDate.setFullYear(currentDate.getFullYear() - years);
      birthDate.setMonth(currentDate.getMonth() - months);
    } else if (rawPet.age) {
      birthDate.setFullYear(currentDate.getFullYear() - rawPet.age);
    }
    
    // Optimized weight handling
    const displayWeight = rawPet.weight || 0;
    const weightUnit = rawPet.weight_kg && Math.abs(rawPet.weight_kg - rawPet.weight) > 0.1 ? 'lbs' : 'kg';

    return {
      id: rawPet.id,
      name: rawPet.name,
      type: rawPet.type as 'dog' | 'cat',
      breed: rawPet.breed || '',
      dateOfBirth: birthDate,
      weight: Number(displayWeight),
      weightUnit: weightUnit,
      gender: (rawPet.gender || 'male') as 'male' | 'female',
      photo: rawPet.photo_url,
      nextVaccination: undefined,
      preExistingConditions: rawPet.pre_existing_conditions || [],
      reproductiveStatus: (rawPet.reproductive_status || 'not_yet') as 'spayed' | 'neutered' | 'not_yet'
    };
  }, []);

  // Optimized fetch function
  const fetchPets = useCallback(async (retryCount = 0) => {
    if (!user || !session || !cacheKey) {
      setPets([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cached = CompressedStorage.get<Pet[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        setPets(cached);
        setLoading(false);
        // Fetch fresh data in background
        fetchFreshData();
        return;
      }

      await fetchFreshData();
      
    } catch (error: any) {
      console.error('❌ Error fetching pets:', error);
      
      // Retry logic for transient errors
      if (retryCount < 2 && (error.message?.includes('network') || error.code === 'PGRST301')) {
        setTimeout(() => fetchPets(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setError(error.message || 'Failed to load pets');
      setLoading(false);
    }
  }, [user, session, cacheKey]);

  // Separate function for fresh data fetching
  const fetchFreshData = useCallback(async () => {
    if (!user || !cacheKey) return;

    const { data, error: fetchError } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      if (fetchError.message?.includes('JWT') || fetchError.message?.includes('Authentication')) {
        throw new Error('Authentication expired. Please refresh the page.');
      }
      throw fetchError;
    }

    // Transform data efficiently
    const transformedPets = (data || []).map(transformPetData);
    
    // Update state and cache
    setPets(transformedPets);
    CompressedStorage.set(cacheKey, transformedPets);
    setLoading(false);
  }, [user, cacheKey, transformPetData]);

  // Load pets when dependencies change
  useEffect(() => {
    const debouncedFetch = PerformanceOptimizer.debounce(fetchPets, 100);
    debouncedFetch();
  }, [fetchPets]);

  // Optimized add pet function
  const addPet = useCallback(async (petData: Omit<Pet, 'id'>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a pet",
        variant: "destructive",
      });
      return null;
    }

    try {
      const now = new Date();
      const birthDate = new Date(petData.dateOfBirth);
      
      // Simplified age calculation
      const ageInYears = now.getFullYear() - birthDate.getFullYear();
      const ageInMonths = (now.getMonth() - birthDate.getMonth()) + ((ageInYears - 1) * 12);
      const weightInKg = petData.weightUnit === 'kg' ? petData.weight : petData.weight * 0.453592;

      const insertData = {
        name: petData.name,
        type: petData.type,
        breed: petData.breed || '',
        species: petData.type,
        age: ageInYears,
        age_years: ageInYears,
        age_months: Math.max(0, ageInMonths),
        weight: petData.weight,
        weight_kg: weightInKg,
        gender: petData.gender,
        photo_url: petData.photo || null,
        user_id: user.id,
        owner_id: user.id,
        pre_existing_conditions: petData.preExistingConditions || [],
        reproductive_status: petData.reproductiveStatus || 'not_yet'
      };

      const { data, error } = await supabase
        .from('pets')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newPet: Pet = {
        id: data.id,
        name: data.name,
        type: data.type as 'dog' | 'cat',
        breed: data.breed,
        dateOfBirth: petData.dateOfBirth,
        weight: petData.weight,
        weightUnit: petData.weightUnit,
        gender: data.gender as 'male' | 'female',
        photo: data.photo_url,
        preExistingConditions: data.pre_existing_conditions || [],
        reproductiveStatus: data.reproductive_status as 'spayed' | 'neutered' | 'not_yet' || 'not_yet'
      };

      // Update state and cache optimistically
      const updatedPets = [newPet, ...pets];
      setPets(updatedPets);
      if (cacheKey) {
        CompressedStorage.set(cacheKey, updatedPets);
      }

      toast({
        title: "Success",
        description: `${petData.name} has been added!`,
      });

      return newPet;
    } catch (error: any) {
      console.error('Error adding pet:', error);
      toast({
        title: "Error",
        description: `Failed to add pet: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return null;
    }
  }, [user, pets, toast, cacheKey]);

  // Optimized update pet function
  const updatePet = useCallback(async (updatedPet: Pet) => {
    if (!user) return;

    try {
      const now = new Date();
      const birthDate = new Date(updatedPet.dateOfBirth);
      
      const ageInYears = now.getFullYear() - birthDate.getFullYear();
      const ageInMonths = (now.getMonth() - birthDate.getMonth()) + ((ageInYears - 1) * 12);
      const weightInKg = updatedPet.weightUnit === 'kg' ? updatedPet.weight : updatedPet.weight * 0.453592;

      const updateData = {
        name: updatedPet.name,
        type: updatedPet.type,
        breed: updatedPet.breed || '',
        species: updatedPet.type,
        age: ageInYears,
        age_years: ageInYears,
        age_months: Math.max(0, ageInMonths),
        weight: updatedPet.weight,
        weight_kg: weightInKg,
        gender: updatedPet.gender,
        photo_url: updatedPet.photo || null,
        pre_existing_conditions: updatedPet.preExistingConditions || [],
        reproductive_status: updatedPet.reproductiveStatus || 'not_yet'
      };

      const { error } = await supabase
        .from('pets')
        .update(updateData)
        .eq('id', updatedPet.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update state and cache optimistically
      const updatedPets = pets.map(pet => pet.id === updatedPet.id ? updatedPet : pet);
      setPets(updatedPets);
      if (cacheKey) {
        CompressedStorage.set(cacheKey, updatedPets);
      }

      toast({
        title: "Success",
        description: `${updatedPet.name}'s profile has been updated!`,
      });
    } catch (error: any) {
      console.error('Error updating pet:', error);
      toast({
        title: "Error",
        description: `Failed to update pet: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }, [user, pets, toast, cacheKey]);

  // Optimized delete pet function
  const deletePet = useCallback(async (petId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) throw error;

      // Update state and cache optimistically
      const updatedPets = pets.filter(pet => pet.id !== petId);
      setPets(updatedPets);
      if (cacheKey) {
        CompressedStorage.set(cacheKey, updatedPets);
      }

      toast({
        title: "Success",
        description: "Pet has been deleted",
      });
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      toast({
        title: "Error",
        description: "Failed to delete pet",
        variant: "destructive",
      });
    }
  }, [user, pets, toast, cacheKey]);

  return {
    pets,
    loading,
    error,
    addPet,
    updatePet,
    deletePet,
    refetch: fetchPets
  };
};