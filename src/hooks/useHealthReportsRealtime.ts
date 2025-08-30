
import { useEffect } from 'react';
import { realtimeManager } from '@/lib/realtimeSubscriptionManager';
import { HealthReport } from '@/hooks/useHealthReports';

export const useHealthReportsRealtime = (
  petId?: string,
  onUpdate?: (report: HealthReport) => void,
  onInsert?: (report: HealthReport) => void,
  onDelete?: (reportId: string) => void
) => {
  useEffect(() => {
    if (!petId || (!onUpdate && !onInsert && !onDelete)) {
      return;
    }

    console.log('🔄 Setting up realtime subscription for pet:', petId);

    const unsubscribe = realtimeManager.subscribe(
      'health_reports',
      (payload) => {
        console.log('📡 Realtime event received:', payload.eventType, payload);

        try {
          switch (payload.eventType) {
            case 'UPDATE':
              if (onUpdate && payload.new) {
                onUpdate(payload.new as HealthReport);
              }
              break;
            case 'INSERT':
              if (onInsert && payload.new) {
                onInsert(payload.new as HealthReport);
              }
              break;
            case 'DELETE':
              if (onDelete && payload.old) {
                onDelete(payload.old.id);
              }
              break;
          }
        } catch (error) {
          console.error('❌ Error processing realtime event:', error);
        }
      },
      `pet_id=eq.${petId}`
    );

    return () => {
      console.log('🔄 Cleaning up realtime subscription for pet:', petId);
      unsubscribe();
    };
  }, [petId, onUpdate, onInsert, onDelete]);
};
