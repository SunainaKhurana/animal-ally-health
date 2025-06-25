
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchPets();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchPets();
      } else {
        setPets([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match frontend interface
      const transformedPets = data?.map(pet => {
        // Calculate date of birth from stored age information
        const currentDate = new Date();
        
        // Use age_years and age_months if available, otherwise fall back to age
        const years = pet.age_years || pet.age || 0;
        const months = pet.age_months || 0;
        
        // Calculate birth date more accurately
        const birthDate = new Date(currentDate);
        birthDate.setFullYear(currentDate.getFullYear() - years);
        birthDate.setMonth(currentDate.getMonth() - months);
        
        // Determine weight unit based on stored weight_kg
        let displayWeight = pet.weight;
        let weightUnit = 'lbs';
        
        // If we have weight_kg and it's different from weight, assume weight is in lbs
        if (pet.weight_kg && Math.abs(pet.weight_kg - pet.weight) > 0.1) {
          displayWeight = pet.weight; // Keep original weight value
          weightUnit = 'lbs';
        } else if (pet.weight_kg && Math.abs(pet.weight_kg - pet.weight) < 0.1) {
          // If weight and weight_kg are similar, it's probably stored in kg
          displayWeight = pet.weight;
          weightUnit = 'kg';
        }

        return {
          id: pet.id,
          name: pet.name,
          type: pet.type as 'dog' | 'cat',
          breed: pet.breed,
          dateOfBirth: birthDate,
          weight: Number(displayWeight),
          weightUnit: weightUnit,
          gender: pet.gender as 'male' | 'female',
          photo: pet.photo_url,
          nextVaccination: undefined, // Will be handled later
          preExistingConditions: pet.pre_existing_conditions || [],
          reproductiveStatus: pet.reproductive_status as 'spayed' | 'neutered' | 'not_yet' || 'not_yet'
        };
      }) || [];

      setPets(transformedPets);
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast({
        title: "Error",
        description: "Failed to load pets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      
      // Calculate age from date of birth more precisely
      const now = new Date();
      const birthDate = new Date(petData.dateOfBirth);
      
      let ageInYears = now.getFullYear() - birthDate.getFullYear();
      let ageInMonths = now.getMonth() - birthDate.getMonth();
      
      // Adjust for cases where birthday hasn't occurred this year
      if (ageInMonths < 0 || (ageInMonths === 0 && now.getDate() < birthDate.getDate())) {
        ageInYears--;
        ageInMonths += 12;
      }
      
      // Adjust for day of month
      if (now.getDate() < birthDate.getDate()) {
        ageInMonths--;
        if (ageInMonths < 0) {
          ageInMonths += 12;
          ageInYears--;
        }
      }

      // Convert weight to kg if needed for storage
      const weightInKg = petData.weightUnit === 'kg' ? petData.weight : petData.weight * 0.453592;

      const insertData = {
        name: petData.name,
        type: petData.type,
        breed: petData.breed || '',
        species: petData.type, // Map type to species
        age: ageInYears,
        age_years: ageInYears,
        age_months: ageInMonths,
        weight: petData.weight, // Store original weight
        weight_kg: weightInKg, // Store converted weight in kg
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

      // Add to local state
      const newPet: Pet = {
        id: data.id,
        name: data.name,
        type: data.type as 'dog' | 'cat',
        breed: data.breed,
        dateOfBirth: petData.dateOfBirth,
        weight: petData.weight, // Keep original weight and unit
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
    } catch (error) {
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
      
      // Calculate age from date of birth more precisely
      const now = new Date();
      const birthDate = new Date(updatedPet.dateOfBirth);
      
      let ageInYears = now.getFullYear() - birthDate.getFullYear();
      let ageInMonths = now.getMonth() - birthDate.getMonth();
      
      // Adjust for cases where birthday hasn't occurred this year
      if (ageInMonths < 0 || (ageInMonths === 0 && now.getDate() < birthDate.getDate())) {
        ageInYears--;
        ageInMonths += 12;
      }
      
      // Adjust for day of month
      if (now.getDate() < birthDate.getDate()) {
        ageInMonths--;
        if (ageInMonths < 0) {
          ageInMonths += 12;
          ageInYears--;
        }
      }

      // Convert weight to kg if needed for storage
      const weightInKg = updatedPet.weightUnit === 'kg' ? updatedPet.weight : updatedPet.weight * 0.453592;

      const updateData = {
        name: updatedPet.name,
        type: updatedPet.type,
        breed: updatedPet.breed || '',
        species: updatedPet.type, // Map type to species
        age: ageInYears,
        age_years: ageInYears,
        age_months: ageInMonths,
        weight: updatedPet.weight, // Store original weight
        weight_kg: weightInKg, // Store converted weight in kg
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
        .eq('user_id', user.id) // Ensure user can only update their own pets
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Pet updated successfully in database:', data);

      // Update local state
      setPets(prev => prev.map(pet => pet.id === updatedPet.id ? updatedPet : pet));

      toast({
        title: "Success",
        description: `${updatedPet.name}'s profile has been updated!`,
      });
    } catch (error) {
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
    } catch (error) {
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
    user,
    addPet,
    updatePet,
    deletePet,
    refetch: fetchPets
  };
};
