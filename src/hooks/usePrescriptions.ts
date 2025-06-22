
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Prescription {
  id: string;
  pet_id: string;
  user_id: string;
  title: string;
  prescribed_date: string;
  image_url?: string;
  extracted_text?: string;
  ai_analysis?: string;
  medications?: any;
  status: 'active' | 'completed' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export const usePrescriptions = (petId?: string) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrescriptions();
  }, [petId]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('prescriptions')
        .select('*')
        .order('prescribed_date', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadPrescription = async (file: File, petId: string, prescriptionData: any): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

      // Create prescription record
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          pet_id: petId,
          user_id: user.id,
          title: prescriptionData.title || 'Prescription',
          prescribed_date: prescriptionData.prescribedDate || new Date().toISOString().split('T')[0],
          image_url: publicUrl,
          extracted_text: JSON.stringify(prescriptionData),
          medications: prescriptionData.medications || []
        })
        .select()
        .single();

      if (error) throw error;
      fetchPrescriptions();
      return data.id;
    } catch (error) {
      console.error('Error uploading prescription:', error);
      throw new Error(`Failed to upload prescription: ${error.message || 'Unknown error'}`);
    }
  };

  return {
    prescriptions,
    loading,
    uploadPrescription,
    refetch: fetchPrescriptions
  };
};
