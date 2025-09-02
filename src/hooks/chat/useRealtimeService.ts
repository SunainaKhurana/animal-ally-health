
import { useEffect, useRef } from 'react';
import { usePollingService } from './usePollingService';
import { realtimeManager } from '@/lib/realtimeSubscriptionManager';

interface SymptomReport {
  id: number;
  pet_id: string;
  symptoms: string[] | null;
  notes?: string | null;
  ai_response: string | null;
  diagnosis: string | null;
  created_at: string;
}

export const useRealtimeService = (
  petId: string | undefined,
  onResponseReceived: (report: SymptomReport) => void,
  pendingResponsesCount: number
) => {
  const lastActivityRef = useRef(Date.now());
  const { startAggressivePolling } = usePollingService(onResponseReceived);

  const handleRealtimeUpdate = (payload: any) => {
    console.log('Real-time UPDATE received:', payload);
    lastActivityRef.current = Date.now();
    
    if (payload.eventType !== 'UPDATE' || !payload.new) {
      console.warn('Invalid real-time update payload:', payload);
      return;
    }

    const updatedReport = payload.new;
    if (updatedReport.diagnosis || updatedReport.ai_response) {
      console.log('Real-time update contains response for report:', updatedReport.id);
      onResponseReceived(updatedReport);
    }
  };

  const handleRealtimeInsert = (payload: any) => {
    console.log('Real-time INSERT received:', payload);
    lastActivityRef.current = Date.now();
    
    if (payload.eventType !== 'INSERT' || !payload.new) {
      console.warn('Invalid real-time insert payload:', payload);
      return;
    }

    const newReport = payload.new;
    if (newReport.diagnosis || newReport.ai_response) {
      console.log('Real-time insert contains response for report:', newReport.id);
      onResponseReceived(newReport);
    }
  };

  const handleBackupUpdate = (payload: any) => {
    console.log('Backup real-time UPDATE received:', payload);
    
    // Only process if primary channel hasn't been active recently
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    if (timeSinceActivity > 2000) {
      if (payload.eventType !== 'UPDATE' || !payload.new) {
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
  };

  useEffect(() => {
    if (!petId) return;

    console.log('Setting up realtime subscription for pet:', petId);
    
    // Use the centralized realtime manager for better performance
    const unsubscribe = realtimeManager.subscribe(
      'symptom_reports',
      (payload) => {
        console.log('Realtime symptom_reports change:', payload);
        
        if (payload.eventType === 'UPDATE') {
          handleRealtimeUpdate(payload);
        } else if (payload.eventType === 'INSERT') {
          handleRealtimeInsert(payload);
        }
      },
      `pet_id=eq.${petId}`
    );

    // Create backup subscription for redundancy
    const backupUnsubscribe = realtimeManager.subscribe(
      'symptom_reports',
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          handleBackupUpdate(payload);
        }
      },
      `pet_id=eq.${petId}`
    );

    // Set up fallback polling for critical scenarios
    const fallbackTimer = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity > 30000 && pendingResponsesCount > 0) {
        console.log('No realtime activity for 30s, starting aggressive polling');
        startAggressivePolling();
      }
    }, 15000);

    // Cleanup function
    return () => {
      console.log('Cleaning up realtime subscriptions');
      unsubscribe();
      backupUnsubscribe();
      clearInterval(fallbackTimer);
    };
  }, [petId, pendingResponsesCount, startAggressivePolling]);
};
