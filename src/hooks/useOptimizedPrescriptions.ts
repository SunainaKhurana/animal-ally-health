import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PerformanceOptimizer, useOptimizedFetch } from '@/lib/performanceOptimizer';
import { PerformanceMonitor } from '@/lib/performanceMonitor';

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

interface MedicationLog {
  id: string;
  prescription_id: string;
  medication_name: string;
  given_at: string;
  given_by: string;
  notes?: string;
}

export const useOptimizedPrescriptions = (petId?: string) => {
  const { toast } = useToast();
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);

  // Optimized data fetching with caching
  const fetchPrescriptions = useCallback(async () => {
    let query = supabase
      .from('prescriptions')
      .select('*')
      .order('prescribed_date', { ascending: false });

    if (petId) {
      query = query.eq('pet_id', petId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(prescription => ({
      ...prescription,
      status: ['active', 'completed', 'discontinued'].includes(prescription.status)
        ? prescription.status as 'active' | 'completed' | 'discontinued'
        : 'active' as const
    })) as Prescription[];
  }, [petId]);

  const cacheKey = `prescriptions-${petId || 'all'}`;
  const { data: prescriptions, loading, error } = useOptimizedFetch(
    cacheKey,
    fetchPrescriptions,
    [petId],
    { cacheTime: 300000 } // 5 minutes cache
  );

  // Memoized filtered prescriptions
  const activePrescriptions = useMemo(() => 
    prescriptions?.filter(p => p.status === 'active') || [], 
    [prescriptions]
  );

  const overduePrescriptions = useMemo(() => {
    if (!prescriptions) return [];
    
    return prescriptions.filter(prescription => {
      // Simple logic: check if medication should have been taken today
      const today = new Date().toDateString();
      const lastTaken = medicationLogs.find(log => 
        log.prescription_id === prescription.id
      );
      
      if (!lastTaken) return true; // Never taken = overdue
      
      const lastTakenDate = new Date(lastTaken.given_at).toDateString();
      return lastTakenDate !== today;
    });
  }, [prescriptions, medicationLogs]);

  // Optimized upload with performance monitoring
  const uploadPrescription = useCallback(async (file: File, petId: string, prescriptionData: any): Promise<string> => {
    const stopTimer = PerformanceMonitor.startTimer('prescription-upload');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

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
      
      // Clear cache to refresh data
      PerformanceOptimizer.setCached(cacheKey, null, 0);
      
      const duration = stopTimer();
      console.log(`Prescription upload took ${duration}ms`);
      
      return data.id;
    } catch (error) {
      const duration = stopTimer();
      console.error('Error uploading prescription:', error);
      throw new Error(`Failed to upload prescription: ${error.message || 'Unknown error'}`);
    }
  }, [cacheKey]);

  // Optimized mark as taken
  const markAsTaken = useCallback(async (prescriptionId: string, medicationName: string, notes?: string) => {
    const stopTimer = PerformanceMonitor.startTimer('mark-as-taken');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newLog = {
        prescription_id: prescriptionId,
        medication_name: medicationName,
        given_at: new Date().toISOString(),
        given_by: user.id,
        notes: notes
      };

      const { error } = await supabase
        .from('medication_logs')
        .insert(newLog);

      if (error) throw error;

      // Update local state immediately for better UX
      setMedicationLogs(prev => [...prev, { ...newLog, id: Date.now().toString() }]);

      toast({
        title: "Success",
        description: "Medication marked as taken",
      });
      
      // Clear cache to refresh data
      PerformanceOptimizer.setCached(cacheKey, null, 0);
      
      const duration = stopTimer();
      console.log(`Mark as taken took ${duration}ms`);
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      toast({
        title: "Error",
        description: "Failed to mark medication as taken",
        variant: "destructive",
      });
    }
  }, [toast, cacheKey]);

  // Fetch medication logs for due date calculations
  useEffect(() => {
    if (!petId) return;

    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('medication_logs')
          .select('*')
          .in('prescription_id', prescriptions?.map(p => p.id) || [])
          .order('given_at', { ascending: false });

        if (error) throw error;
        setMedicationLogs(data || []);
      } catch (error) {
        console.error('Error fetching medication logs:', error);
      }
    };

    if (prescriptions?.length) {
      fetchLogs();
    }
  }, [prescriptions, petId]);

  const refetch = useCallback(() => {
    PerformanceOptimizer.setCached(cacheKey, null, 0);
    // The useOptimizedFetch will automatically refetch when cache is cleared
  }, [cacheKey]);

  return {
    prescriptions: prescriptions || [],
    activePrescriptions,
    overduePrescriptions,
    loading,
    error,
    uploadPrescription,
    markAsTaken,
    refetch,
    medicationLogs
  };
};