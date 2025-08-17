import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

export const usePets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, session } = useAuth();

  const fetchPets = async (retryCount = 0) => {
    if (!user || !session) {
      console.log('🐾 No user or session, clearing pets');
      setPets([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🐾 Fetching pets for user:', user.id);
      console.log('📊 Session valid:', !!session?.access_token);
      
      const { data, error: fetchError } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Pets fetch error:', fetchError);
        
        // If it's an auth error, don't retry
        if (fetchError.message?.includes('JWT') || fetchError.message?.includes('Authentication')) {
          console.log('🔐 Auth error detected, not retrying pets fetch');
          throw new Error('Authentication expired. Please refresh the page.');
        }
        
        throw fetchError;
      }

      console.log('✅ Raw pets data from database:', data);

      // Simplified transformation with better error handling
      const transformedPets = data?.map(pet => {
        console.log('🔄 Transforming pet:', pet.name, pet);
        
        // Simple age calculation - use current age fields if available
        const currentDate = new Date();
        let birthDate = new Date(currentDate);
        
        // If we have age fields, calculate birth date from them
        if (pet.age_years || pet.age_months) {
          const years = pet.age_years || 0;
          const months = pet.age_months || 0;
          birthDate.setFullYear(currentDate.getFullYear() - years);
          birthDate.setMonth(currentDate.getMonth() - months);
        } else if (pet.age) {
          // Fallback to just age field
          birthDate.setFullYear(currentDate.getFullYear() - pet.age);
        }
        
        // Weight handling
        let displayWeight = pet.weight || 0;
        let weightUnit = 'lbs';
        
        // If weight_kg exists and is different from weight, use lbs
        if (pet.weight_kg && Math.abs(pet.weight_kg - pet.weight) > 0.1) {
          displayWeight = pet.weight;
          weightUnit = 'lbs';
        } else if (pet.weight_kg && Math.abs(pet.weight_kg - pet.weight) < 0.1) {
          // If weight and weight_kg are similar, it's probably in kg
          displayWeight = pet.weight;
          weightUnit = 'kg';
        }

        const transformedPet = {
          id: pet.id,
          name: pet.name,
          type: pet.type as 'dog' | 'cat',
          breed: pet.breed || '',
          dateOfBirth: birthDate,
          weight: Number(displayWeight),
          weightUnit: weightUnit,
          gender: (pet.gender || 'male') as 'male' | 'female',
          photo: pet.photo_url,
          nextVaccination: undefined,
          preExistingConditions: pet.pre_existing_conditions || [],
          reproductiveStatus: (pet.reproductive_status || 'not_yet') as 'spayed' | 'neutered' | 'not_yet'
        };

        console.log('✅ Transformed pet:', transformedPet);
        return transformedPet;
      }) || [];

      console.log('🎯 Final transformed pets:', transformedPets);
      setPets(transformedPets);
      setError(null);
    } catch (error: any) {
      console.error('❌ Error fetching pets:', error);
      
      // Retry logic for transient errors
      if (retryCount < 2 && (error.message?.includes('network') || error.code === 'PGRST301')) {
        console.log(`🔄 Retrying pets fetch (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchPets(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setError(error.message || 'Failed to load pets');
      
      // Only show toast for non-auth errors
      if (!error.message?.includes('Authentication') && !error.message?.includes('JWT')) {
        toast({
          title: "Error",
          description: "Failed to load pets. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch pets when user or session changes
  useEffect(() => {
    console.log('👥 User/session changed, fetching pets...');
    fetchPets();
  }, [user, session]);

  const addPet = async (petData: Omit<Pet, 'id'>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a pet",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log('Adding pet with data:', petData);
      
      const now = new Date();
      const birthDate = new Date(petData.dateOfBirth);
      
      let ageInYears = now.getFullYear() - birthDate.getFullYear();
      let ageInMonths = now.getMonth() - birthDate.getMonth();
      
      if (ageInMonths < 0 || (ageInMonths === 0 && now.getDate() < birthDate.getDate())) {
        ageInYears--;
        ageInMonths += 12;
      }
      
      if (now.getDate() < birthDate.getDate()) {
        ageInMonths--;
        if (ageInMonths < 0) {
          ageInMonths += 12;
          ageInYears--;
        }
      }

      const weightInKg = petData.weightUnit === 'kg' ? petData.weight : petData.weight * 0.453592;

      const insertData = {
        name: petData.name,
        type: petData.type,
        breed: petData.breed || '',
        species: petData.type,
        age: ageInYears,
        age_years: ageInYears,
        age_months: ageInMonths,
        weight: petData.weight,
        weight_kg: weightInKg,
        gender: petData.gender,
        photo_url: petData.photo || null,
        user_id: user.id,
        owner_id: user.id,
        pre_existing_conditions: petData.preExistingConditions || [],
        reproductive_status: petData.reproductiveStatus || 'not_yet'
      };

      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('pets')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Pet added successfully:', data);

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

      setPets(prev => [newPet, ...prev]);

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
  };

  const updatePet = async (updatedPet: Pet) => {
    if (!user) {
      console.log('No user found, cannot update pet');
      return;
    }

    try {
      console.log('Updating pet with data:', updatedPet);
      
      const now = new Date();
      const birthDate = new Date(updatedPet.dateOfBirth);
      
      let ageInYears = now.getFullYear() - birthDate.getFullYear();
      let ageInMonths = now.getMonth() - birthDate.getMonth();
      
      if (ageInMonths < 0 || (ageInMonths === 0 && now.getDate() < birthDate.getDate())) {
        ageInYears--;
        ageInMonths += 12;
      }
      
      if (now.getDate() < birthDate.getDate()) {
        ageInMonths--;
        if (ageInMonths < 0) {
          ageInMonths += 12;
          ageInYears--;
        }
      }

      const weightInKg = updatedPet.weightUnit === 'kg' ? updatedPet.weight : updatedPet.weight * 0.453592;

      const updateData = {
        name: updatedPet.name,
        type: updatedPet.type,
        breed: updatedPet.breed || '',
        species: updatedPet.type,
        age: ageInYears,
        age_years: ageInYears,
        age_months: ageInMonths,
        weight: updatedPet.weight,
        weight_kg: weightInKg,
        gender: updatedPet.gender,
        photo_url: updatedPet.photo || null,
        pre_existing_conditions: updatedPet.preExistingConditions || [],
        reproductive_status: updatedPet.reproductiveStatus || 'not_yet'
      };

      console.log('Update data being sent to Supabase:', updateData);

      const { data, error } = await supabase
        .from('pets')
        .update(updateData)
        .eq('id', updatedPet.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Pet updated successfully in database:', data);

      setPets(prev => prev.map(pet => pet.id === updatedPet.id ? updatedPet : pet));

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
  };

  const deletePet = async (petId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) throw error;

      setPets(prev => prev.filter(pet => pet.id !== petId));

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
  };

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
