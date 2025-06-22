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
      const transformedPets = data?.map(pet => ({
        id: pet.id,
        name: pet.name,
        type: pet.type as 'dog' | 'cat',
        breed: pet.breed,
        dateOfBirth: new Date(new Date().getFullYear() - pet.age_years, new Date().getMonth() - (pet.age_months || 0)),
        weight: Number(pet.weight),
        weightUnit: 'lbs', // Default for now
        gender: pet.gender as 'male' | 'female',
        photo: pet.photo_url,
        nextVaccination: undefined // Will be handled later
      })) || [];

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
      
      // Calculate age from date of birth
      const now = new Date();
      const birthDate = new Date(petData.dateOfBirth);
      const ageInYears = now.getFullYear() - birthDate.getFullYear();
      let ageInMonths = now.getMonth() - birthDate.getMonth();
      
      // Adjust for negative months
      if (ageInMonths < 0) {
        ageInMonths += 12;
      }

      // Convert weight to kg if needed
      const weightInKg = petData.weightUnit === 'kg' ? petData.weight : petData.weight * 0.453592;

      const insertData = {
        name: petData.name,
        type: petData.type,
        breed: petData.breed || '',
        species: petData.type, // Map type to species
        age: ageInYears,
        age_years: ageInYears,
        age_months: ageInMonths,
        weight: petData.weight,
        weight_kg: weightInKg,
        gender: petData.gender,
        photo_url: petData.photo || null,
        user_id: user.id,
        owner_id: user.id
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
        weight: Number(data.weight),
        weightUnit: petData.weightUnit,
        gender: data.gender as 'male' | 'female',
        photo: data.photo_url,
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
      
      // Calculate age from date of birth
      const now = new Date();
      const birthDate = new Date(updatedPet.dateOfBirth);
      const ageInYears = now.getFullYear() - birthDate.getFullYear();
      let ageInMonths = now.getMonth() - birthDate.getMonth();
      
      // Adjust for negative months
      if (ageInMonths < 0) {
        ageInMonths += 12;
      }

      // Convert weight to kg if needed
      const weightInKg = updatedPet.weightUnit === 'kg' ? updatedPet.weight : updatedPet.weight * 0.453592;

      const updateData = {
        name: updatedPet.name,
        type: updatedPet.type,
        breed: updatedPet.breed || '',
        species: updatedPet.type, // Map type to species
        age: ageInYears,
        age_years: ageInYears,
        age_months: ageInMonths,
        weight: updatedPet.weight,
        weight_kg: weightInKg,
        gender: updatedPet.gender,
        photo_url: updatedPet.photo || null,
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
