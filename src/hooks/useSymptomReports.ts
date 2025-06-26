
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
  diagnosis?: string;
  ai_response?: string;
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
        
        // First create the storage bucket if it doesn't exist
        const { error: bucketError } = await supabase.storage
          .createBucket('symptom-photos', { public: true });
        
        // Ignore error if bucket already exists
        if (bucketError && !bucketError.message.includes('already exists')) {
          console.log('Bucket creation info:', bucketError);
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('symptom-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('symptom-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Insert symptom report without diagnosis or ai_response - let Make.com handle those
      const { data, error } = await supabase
        .from('symptom_reports')
        .insert({
          pet_id: petId,
          symptoms: symptoms.length > 0 ? symptoms : null,
          notes,
          photo_url: photoUrl,
          // Leave diagnosis and ai_response empty for Make.com to populate
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request submitted successfully",
      });

      fetchReports();
      return data;
    } catch (error) {
      console.error('Error adding symptom report:', error);
      toast({
        title: "Error",
        description: "Failed to submit request",
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
