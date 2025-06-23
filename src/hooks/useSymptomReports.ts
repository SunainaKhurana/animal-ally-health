
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SymptomReport {
  id: number;
  pet_id: string;
  symptoms: string[];
  notes?: string;
  photo_url?: string;
  reported_on: string;
  created_at: string;
}

export const useSymptomReports = (petId?: string) => {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [petId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('symptom_reports')
        .select('*')
        .order('reported_on', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setReports((data || []) as SymptomReport[]);
    } catch (error) {
      console.error('Error fetching symptom reports:', error);
      toast({
        title: "Error",
        description: "Failed to load symptom reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSymptomReport = async (
    petId: string,
    symptoms: string[],
    notes?: string,
    photo?: File
  ) => {
    try {
      let photoUrl: string | undefined;

      // Upload photo if provided
      if (photo) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('symptom-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('symptom-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('symptom_reports')
        .insert({
          pet_id: petId,
          symptoms,
          notes,
          photo_url: photoUrl
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Symptom report submitted successfully",
      });

      fetchReports();
      return data;
    } catch (error) {
      console.error('Error adding symptom report:', error);
      toast({
        title: "Error",
        description: "Failed to submit symptom report",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    reports,
    loading,
    addSymptomReport,
    refetch: fetchReports
  };
};
