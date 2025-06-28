
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SymptomReport } from '@/hooks/useSymptomReports';
import { ConnectionHealth } from './types';

export const usePollingService = (
  onResponseReceived: (report: SymptomReport) => void
) => {
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingReportsRef = useRef<Set<number>>(new Set());
  const lastPollTimeRef = useRef<number>(0);
  const connectionHealthRef = useRef<ConnectionHealth>('connected');

  const startAggressivePolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let pollCount = 0;
    const maxPolls = 60; // Poll for 3 minutes max (3s * 60 = 180s)

    pollIntervalRef.current = setInterval(async () => {
      pollCount++;
      
      if (pendingReportsRef.current.size === 0 || pollCount > maxPolls) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        connectionHealthRef.current = 'connected';
        return;
      }

      connectionHealthRef.current = 'polling';
      
      try {
        const pendingIds = Array.from(pendingReportsRef.current);
        const { data: reports, error } = await supabase
          .from('symptom_reports')
          .select('*')
          .in('id', pendingIds);

        if (error) throw error;

        reports?.forEach((report: SymptomReport) => {
          if (report.diagnosis || report.ai_response) {
            onResponseReceived(report);
          }
        });

        lastPollTimeRef.current = Date.now();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds
  }, [onResponseReceived]);

  const addPendingReport = useCallback((reportId: number) => {
    pendingReportsRef.current.add(reportId);
    startAggressivePolling();
  }, [startAggressivePolling]);

  const removePendingReport = useCallback((reportId: number) => {
    pendingReportsRef.current.delete(reportId);
    
    // Stop polling if no more pending reports
    if (pendingReportsRef.current.size === 0 && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      connectionHealthRef.current = 'connected';
    }
  }, []);

  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return {
    addPendingReport,
    removePendingReport,
    startAggressivePolling,
    cleanup,
    connectionHealth: connectionHealthRef.current,
    pendingResponsesCount: pendingReportsRef.current.size,
    lastPollTime: lastPollTimeRef.current
  };
};
