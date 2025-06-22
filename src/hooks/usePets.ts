
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
      return;
    }

    try {
      const ageInYears = new Date().getFullYear() - petData.dateOfBirth.getFullYear();
      const ageInMonths = new Date().getMonth() - petData.dateOfBirth.getMonth();

      const { data, error } = await supabase
        .from('pets')
        .insert({
          name: petData.name,
          type: petData.type,
          breed: petData.breed || '',
          species: petData.type,
          age: ageInYears,
          age_years: ageInYears,
          age_months: ageInMonths >= 0 ? ageInMonths : 12 + ageInMonths,
          weight: petData.weight,
          weight_kg: petData.weightUnit === 'kg' ? petData.weight : petData.weight * 0.453592,
          gender: petData.gender,
          photo_url: petData.photo,
          user_id: user.id,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

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
    } catch (error) {
      console.error('Error adding pet:', error);
      toast({
        title: "Error",
        description: "Failed to add pet",
        variant: "destructive",
      });
    }
  };

  const updatePet = async (updatedPet: Pet) => {
    if (!user) return;

    try {
      const ageInYears = new Date().getFullYear() - updatedPet.dateOfBirth.getFullYear();
      const ageInMonths = new Date().getMonth() - updatedPet.dateOfBirth.getMonth();

      const { error } = await supabase
        .from('pets')
        .update({
          name: updatedPet.name,
          type: updatedPet.type,
          breed: updatedPet.breed || '',
          age: ageInYears,
          age_years: ageInYears,
          age_months: ageInMonths >= 0 ? ageInMonths : 12 + ageInMonths,
          weight: updatedPet.weight,
          weight_kg: updatedPet.weightUnit === 'kg' ? updatedPet.weight : updatedPet.weight * 0.453592,
          gender: updatedPet.gender,
          photo_url: updatedPet.photo,
        })
        .eq('id', updatedPet.id);

      if (error) throw error;

      setPets(prev => prev.map(pet => pet.id === updatedPet.id ? updatedPet : pet));

      toast({
        title: "Success",
        description: `${updatedPet.name}'s profile has been updated!`,
      });
    } catch (error) {
      console.error('Error updating pet:', error);
      toast({
        title: "Error",
        description: "Failed to update pet",
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
