
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PetCondition {
  id: string;
  pet_id: string;
  condition_name: string;
  diagnosed_date?: string;
  status: 'active' | 'resolved' | 'managed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const usePetConditions = (petId?: string) => {
  const [conditions, setConditions] = useState<PetCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConditions();
  }, [petId]);

  const fetchConditions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('pet_conditions')
        .select('*')
        .order('created_at', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setConditions(data || []);
    } catch (error) {
      console.error('Error fetching conditions:', error);
      toast({
        title: "Error",
        description: "Failed to load conditions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCondition = async (petId: string, conditionData: Partial<PetCondition>) => {
    try {
      const { data, error } = await supabase
        .from('pet_conditions')
        .insert({
          pet_id: petId,
          condition_name: conditionData.condition_name,
          diagnosed_date: conditionData.diagnosed_date,
          status: conditionData.status || 'active',
          notes: conditionData.notes
        })
        .select()
        .single();

      if (error) throw error;
      fetchConditions();
      return data;
    } catch (error) {
      console.error('Error adding condition:', error);
      throw error;
    }
  };

  return {
    conditions,
    loading,
    addCondition,
    refetch: fetchConditions
  };
};
