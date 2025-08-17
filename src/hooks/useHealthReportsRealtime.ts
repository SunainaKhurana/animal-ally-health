
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HealthReport } from '@/hooks/useHealthReports';
import { useToast } from '@/hooks/use-toast';

export const useHealthReportsRealtime = (
  petId: string | undefined,
  onReportUpdate: (report: HealthReport) => void,
  onReportInsert: (report: HealthReport) => void,
  onReportDelete: (reportId: string) => void
) => {
  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('🔄 Health report real-time UPDATE received:', payload);
    
    if (!payload.new || !payload.new.id) {
      console.warn('Invalid real-time update payload:', payload);
      return;
    }

    const updatedReport = payload.new as HealthReport;
    console.log('📝 Report updated via realtime:', {
      id: updatedReport.id,
      status: updatedReport.status,
      hasAIAnalysis: !!updatedReport.ai_analysis,
      hasKeyFindings: !!updatedReport.key_findings
    });
    
    onReportUpdate(updatedReport);
    
    // Show toast when AI analysis completes
    if (updatedReport.status === 'completed' && updatedReport.ai_analysis && payload.old?.status !== 'completed') {
      toast({
        title: "AI Analysis Complete! 🎉",
        description: `${updatedReport.title || updatedReport.report_label} analysis is ready to view.`,
      });
    }
  }, [onReportUpdate, toast]);

  const handleRealtimeInsert = useCallback((payload: any) => {
    console.log('➕ Health report real-time INSERT received:', payload);
    
    if (!payload.new || !payload.new.id) {
      console.warn('Invalid real-time insert payload:', payload);
      return;
    }

    const newReport = payload.new as HealthReport;
    console.log('📝 New report inserted via realtime:', newReport.id);
    
    onReportInsert(newReport);
    
    if (newReport.status === 'completed') {
      toast({
        title: "Report Analysis Complete! 🎉",
        description: `${newReport.title || newReport.report_label} has been analyzed and is ready to view.`,
      });
    }
  }, [onReportInsert, toast]);

  const handleRealtimeDelete = useCallback((payload: any) => {
    console.log('🗑️ Health report real-time DELETE received:', payload);
    
    if (!payload.old || !payload.old.id) {
      console.warn('Invalid real-time delete payload:', payload);
      return;
    }

    onReportDelete(payload.old.id);
  }, [onReportDelete]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!petId) return;

    // Clean up existing subscription
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing health reports subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('🔗 Setting up health reports real-time subscription for pet:', petId);

    const channel = supabase
      .channel(`health-reports-${petId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'health_reports',
          filter: `pet_id=eq.${petId}`
        },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'health_reports',
          filter: `pet_id=eq.${petId}`
        },
        handleRealtimeInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'health_reports',
          filter: `pet_id=eq.${petId}`
        },
        handleRealtimeDelete
      )
      .subscribe((status) => {
        console.log('📡 Health reports real-time subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Health reports real-time subscription active');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('❌ Health reports real-time subscription failed, retrying...');
          scheduleRetry();
        }
      });

    channelRef.current = channel;
  }, [petId, handleRealtimeUpdate, handleRealtimeInsert, handleRealtimeDelete]);

  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    retryTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Retrying health reports real-time connection...');
      setupRealtimeSubscription();
    }, 5000);
  }, [setupRealtimeSubscription]);

  useEffect(() => {
    setupRealtimeSubscription();
    
    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up health reports real-time subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [setupRealtimeSubscription]);

  return {
    reconnect: setupRealtimeSubscription
  };
};
