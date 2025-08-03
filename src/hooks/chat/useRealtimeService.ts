
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SymptomReport } from '@/hooks/useSymptomReports';

export const useRealtimeService = (
  petId: string | undefined,
  onResponseReceived: (report: SymptomReport) => void,
  lastPollTime: number,
  startPolling: () => void,
  pendingReportsCount: number
) => {
  const channelRefs = useRef<any[]>([]);

  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Real-time UPDATE received:', payload.new?.id);
    
    if (!payload.new || !payload.new.id) {
      console.warn('Invalid real-time update payload:', payload);
      return;
    }

    const updatedReport = payload.new;
    
    if (updatedReport.diagnosis || updatedReport.ai_response) {
      console.log('Real-time update contains response for report:', updatedReport.id);
      onResponseReceived(updatedReport);
    }
  }, [onResponseReceived]);

  const handleRealtimeInsert = useCallback((payload: any) => {
    console.log('Real-time INSERT received:', payload.new?.id);
    
    if (!payload.new || !payload.new.id) {
      console.warn('Invalid real-time insert payload:', payload);
      return;
    }

    const newReport = payload.new;
    if (newReport.diagnosis || newReport.ai_response) {
      console.log('Real-time insert contains response for report:', newReport.id);
      onResponseReceived(newReport);
    }
  }, [onResponseReceived]);

  const handleBackupUpdate = useCallback((payload: any) => {
    console.log('Backup real-time UPDATE received:', payload.new?.id);
    
    // Only process if primary channel hasn't handled it recently
    const timeSinceLastPoll = Date.now() - lastPollTime;
    if (timeSinceLastPoll > 1000) {
      if (!payload.new || !payload.new.id) {
        console.warn('Invalid backup real-time payload:', payload);
        return;
      }

      const updatedReport = payload.new;
      if (updatedReport.diagnosis || updatedReport.ai_response) {
        console.log('Backup channel processing response for report:', updatedReport.id);
        onResponseReceived(updatedReport);
      }
    } else {
      console.log('Skipping backup processing - primary channel recently active');
    }
  }, [onResponseReceived, lastPollTime]);

  useEffect(() => {
    if (!petId) {
      console.log('No petId provided, skipping real-time setup');
      return;
    }

    // Clean up existing channels
    channelRefs.current.forEach(channel => {
      console.log('Cleaning up existing symptom channel');
      supabase.removeChannel(channel);
    });
    channelRefs.current = [];

    console.log('Setting up real-time channels for pet:', petId);

    // Primary channel for updates
    const updateChannel = supabase
      .channel(`symptom-reports-updates-${petId}-${Date.now()}`)
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
        console.log('Primary real-time channel status:', status);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Primary channel failed, falling back to polling');
          // Fallback to aggressive polling
          if (pendingReportsCount > 0) {
            startPolling();
          }
        } else if (status === 'SUBSCRIBED') {
          console.log('Primary real-time channel connected successfully');
        }
      });

    // Secondary backup channel for redundancy
    const backupChannel = supabase
      .channel(`symptom-backup-${petId}-${Date.now()}`)
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
      .subscribe((status) => {
        console.log('Backup real-time channel status:', status);
      });

    // Store channel references for cleanup
    channelRefs.current = [updateChannel, backupChannel];

    return () => {
      console.log('Cleaning up real-time channels for pet:', petId);
      channelRefs.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelRefs.current = [];
    };
  }, [petId, handleRealtimeUpdate, handleRealtimeInsert, handleBackupUpdate, startPolling, pendingReportsCount]);
};
