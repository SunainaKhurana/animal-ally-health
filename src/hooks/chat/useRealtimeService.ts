
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SymptomReport } from '@/hooks/useSymptomReports';

export const useRealtimeService = (
  petId: string | undefined,
  onResponseReceived: (report: SymptomReport) => void,
  lastPollTime: number,
  startPolling: () => void,
  pendingReportsCount: number
) => {
  const handleRealtimeUpdate = useCallback((payload: any) => {
    const updatedReport = payload.new;
    
    if (updatedReport.diagnosis || updatedReport.ai_response) {
      onResponseReceived(updatedReport);
    }
  }, [onResponseReceived]);

  const handleRealtimeInsert = useCallback((payload: any) => {
    const newReport = payload.new;
    if (newReport.diagnosis || newReport.ai_response) {
      onResponseReceived(newReport);
    }
  }, [onResponseReceived]);

  const handleBackupUpdate = useCallback((payload: any) => {
    // Only process if primary channel hasn't handled it recently
    const timeSinceLastPoll = Date.now() - lastPollTime;
    if (timeSinceLastPoll > 1000) {
      const updatedReport = payload.new;
      if (updatedReport.diagnosis || updatedReport.ai_response) {
        onResponseReceived(updatedReport);
      }
    }
  }, [onResponseReceived, lastPollTime]);

  useEffect(() => {
    if (!petId) return;

    // Primary channel for updates
    const updateChannel = supabase
      .channel(`symptom-reports-updates-${petId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'symptom_reports',
          filter: `pet_id=eq.${petId}`
        },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'symptom_reports',
          filter: `pet_id=eq.${petId}`
        },
        handleRealtimeInsert
      )
      .subscribe((status) => {
        console.log('Primary channel status:', status);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Fallback to aggressive polling
          if (pendingReportsCount > 0) {
            startPolling();
          }
        }
      });

    // Secondary backup channel for redundancy
    const backupChannel = supabase
      .channel(`symptom-backup-${petId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'symptom_reports',
          filter: `pet_id=eq.${petId}`
        },
        handleBackupUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(updateChannel);
      supabase.removeChannel(backupChannel);
    };
  }, [petId, handleRealtimeUpdate, handleRealtimeInsert, handleBackupUpdate, startPolling, pendingReportsCount]);
};
