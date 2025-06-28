
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
    console.log('Starting aggressive polling for pending reports:', pendingReportsRef.current.size);
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let pollCount = 0;
    const maxPolls = 60; // Poll for 3 minutes max (3s * 60 = 180s)

    pollIntervalRef.current = setInterval(async () => {
      pollCount++;
      
      if (pendingReportsRef.current.size === 0 || pollCount > maxPolls) {
        console.log('Stopping polling:', { 
          pendingReports: pendingReportsRef.current.size, 
          pollCount, 
          maxPolls 
        });
        
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
        console.log(`Polling attempt ${pollCount}/${maxPolls} for reports:`, pendingIds);
        
        const { data: reports, error } = await supabase
          .from('symptom_reports')
          .select('*')
          .in('id', pendingIds);

        if (error) {
          console.error('Polling error:', error);
          throw error;
        }

        console.log('Polling results:', reports?.length || 0, 'reports');

        reports?.forEach((report: SymptomReport) => {
          if (report.diagnosis || report.ai_response) {
            console.log('Found response during polling for report:', report.id);
            onResponseReceived(report);
          }
        });

        lastPollTimeRef.current = Date.now();
      } catch (error) {
        console.error('Polling error:', error);
        // Don't stop polling on single errors, just log them
      }
    }, 2000); // Poll every 2 seconds
  }, [onResponseReceived]);

  const addPendingReport = useCallback((reportId: number) => {
    console.log('Adding pending report:', reportId);
    pendingReportsRef.current.add(reportId);
    startAggressivePolling();
  }, [startAggressivePolling]);

  const removePendingReport = useCallback((reportId: number) => {
    console.log('Removing pending report:', reportId);
    const wasRemoved = pendingReportsRef.current.delete(reportId);
    
    if (wasRemoved) {
      console.log('Remaining pending reports:', pendingReportsRef.current.size);
    }
    
    // Stop polling if no more pending reports
    if (pendingReportsRef.current.size === 0 && pollIntervalRef.current) {
      console.log('No more pending reports, stopping polling');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      connectionHealthRef.current = 'connected';
    }
  }, []);

  const cleanup = useCallback(() => {
    console.log('Cleaning up polling service');
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pendingReportsRef.current.clear();
    connectionHealthRef.current = 'connected';
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
