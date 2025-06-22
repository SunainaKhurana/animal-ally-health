
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Walk {
  id: string;
  pet_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  distance_meters?: number;
  route_data?: any;
  notes?: string;
  weather?: string;
  created_at: string;
}

export const useWalks = (petId?: string) => {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalks();
  }, [petId]);

  const fetchWalks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('walks')
        .select('*')
        .order('start_time', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWalks(data || []);
    } catch (error) {
      console.error('Error fetching walks:', error);
      toast({
        title: "Error",
        description: "Failed to load walks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startWalk = async (petId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('walks')
        .insert({
          pet_id: petId,
          user_id: user.id,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      fetchWalks();
      return data.id;
    } catch (error) {
      console.error('Error starting walk:', error);
      throw error;
    }
  };

  const endWalk = async (walkId: string, duration: number, distance?: number, routeData?: any) => {
    try {
      const { error } = await supabase
        .from('walks')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: duration,
          distance_meters: distance,
          route_data: routeData
        })
        .eq('id', walkId);

      if (error) throw error;
      fetchWalks();
    } catch (error) {
      console.error('Error ending walk:', error);
      throw error;
    }
  };

  return {
    walks,
    loading,
    startWalk,
    endWalk,
    refetch: fetchWalks
  };
};
