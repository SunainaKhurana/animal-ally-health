
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
      
      // Type assertion and filtering to ensure proper status values
      const typedPrescriptions = (data || []).map(prescription => ({
        ...prescription,
        status: ['active', 'completed', 'discontinued'].includes(prescription.status)
          ? prescription.status as 'active' | 'completed' | 'discontinued'
          : 'active' as const
      })) as Prescription[];
      
      setPrescriptions(typedPrescriptions);
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

  const markAsTaken = async (prescriptionId: string, medicationName: string, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('medication_logs')
        .insert({
          prescription_id: prescriptionId,
          medication_name: medicationName,
          given_at: new Date().toISOString(),
          given_by: user.id,
          notes: notes
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medication marked as taken",
      });
      
      fetchPrescriptions();
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      toast({
        title: "Error",
        description: "Failed to mark medication as taken",
        variant: "destructive",
      });
    }
  };

  const getLastTaken = async (prescriptionId: string) => {
    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('prescription_id', prescriptionId)
        .order('given_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting last taken:', error);
      return null;
    }
  };

  return {
    prescriptions,
    loading,
    uploadPrescription,
    markAsTaken,
    getLastTaken,
    refetch: fetchPrescriptions
  };
};
