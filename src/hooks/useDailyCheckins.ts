
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DailyCheckin {
  id: string;
  pet_id: string;
  user_id: string;
  energy_level: 'low' | 'normal' | 'hyper';
  hunger_level: 'not eating' | 'normal' | 'overeating';
  thirst_level: 'less' | 'normal' | 'more';
  stool_consistency: 'normal' | 'soft' | 'diarrhea';
  notes?: string;
  checkin_date: string;
  created_at: string;
}

export const useDailyCheckins = (petId?: string) => {
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCheckins();
  }, [petId]);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('daily_checkins')
        .select('*')
        .order('checkin_date', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setCheckins((data || []) as DailyCheckin[]);
    } catch (error) {
      console.error('Error fetching daily checkins:', error);
      toast({
        title: "Error",
        description: "Failed to load daily checkins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDailyCheckin = async (checkinData: Omit<DailyCheckin, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('daily_checkins')
        .insert({
          ...checkinData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily check-in saved successfully",
      });

      fetchCheckins();
      return data;
    } catch (error) {
      console.error('Error adding daily checkin:', error);
      toast({
        title: "Error",
        description: "Failed to save daily check-in",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    checkins,
    loading,
    addDailyCheckin,
    refetch: fetchCheckins
  };
};
