
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { healthReportCache } from '@/lib/healthReportCache';

export interface HealthReport {
  id: string;
  pet_id: string;
  user_id: string;
  title: string;
  report_type: string;
  report_date: string;
  actual_report_date: string | null;
  status: 'processing' | 'completed' | 'failed';
  image_url?: string;
  extracted_text?: string;
  key_findings?: string;
  ai_analysis?: string;
  created_at: string;
  updated_at: string;
  report_label?: string;
  vet_diagnosis?: string;
  parent_report_id?: string;
}

export const useImprovedHealthReports = (petId?: string) => {
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseFetched, setSupabaseFetched] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (petId) {
      loadReportsImproved();
      setupImprovedRealtimeSubscription();
    }
    
    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up improved health reports subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [petId]);

  const loadReportsImproved = async () => {
    if (!petId) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 [Improved] Loading health reports for pet:', petId);
      setLoading(true);
      setError(null);
      
      // Step 1: Check cache first for instant display
      const cachedReports = healthReportCache.get(petId);
      const cachedPreviews = healthReportCache.getCachedPreviews(petId);
      
      console.log('📦 Cache check:', {
        hasReports: !!cachedReports,
        reportCount: cachedReports?.length || 0,
        hasPreviews: cachedPreviews.length > 0,
        previewCount: cachedPreviews.length
      });
      
      if (cachedReports && cachedReports.length > 0) {
        console.log('✅ Using cached reports for instant display');
        setHealthReports(cachedReports);
        setLoading(false);
        
        // Background refresh
        fetchFreshReportsBackground();
        return;
      }
      
      if (cachedPreviews.length > 0) {
        console.log('✅ Converting cached previews to reports');
        const reportsFromPreviews = cachedPreviews.map(preview => ({
          id: preview.id,
          pet_id: preview.pet_id,
          user_id: '', // Will be filled from Supabase
          title: preview.title,
          report_type: preview.report_type,
          report_date: preview.report_date,
          actual_report_date: preview.report_date,
          status: preview.status,
          image_url: preview.image_url,
          ai_analysis: preview.ai_analysis,
          report_label: preview.report_label,
          vet_diagnosis: preview.vet_diagnosis,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          extracted_text: '',
          key_findings: '',
          parent_report_id: undefined
        })) as HealthReport[];
        
        setHealthReports(reportsFromPreviews);
        setLoading(false);
        
        // Background refresh
        fetchFreshReportsBackground();
        return;
      }

      // Step 2: No cache, fetch from Supabase
      console.log('🌐 No cache found, fetching from database...');
      await fetchFreshReportsImproved();
    } catch (error) {
      console.error('❌ Error in improved loading:', error);
      handleLoadingError(error);
    }
  };

  const fetchFreshReportsImproved = async () => {
    if (!petId) return;

    console.log('📡 Fetching fresh health reports with improved error handling...');
    
    try {
      const { data, error: fetchError } = await supabase
        .from('health_reports')
        .select('*')
        .eq('pet_id', petId)
        .order('actual_report_date', { ascending: false, nullsFirst: false })
        .order('report_date', { ascending: false });

      if (fetchError) {
        console.error('❌ Database fetch error:', fetchError);
        throw new Error(`Database error: ${fetchError.message}`);
      }
      
      const reports = (data || []) as HealthReport[];
      console.log('✅ Fresh reports fetched:', {
        count: reports.length,
        reports: reports.map(r => ({ id: r.id, title: r.title, status: r.status }))
      });
      
      setHealthReports(reports);
      setError(null);
      setSupabaseFetched(true);
      setLoading(false);
      
      // Cache the fresh data
      if (reports.length > 0) {
        healthReportCache.set(petId, reports);
        reports.forEach(report => {
          healthReportCache.cacheReportPreview(petId, report);
        });
        console.log('✅ Reports cached locally');
      } else {
        console.log('📭 No reports found in database');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  };

  const fetchFreshReportsBackground = async () => {
    if (!petId || supabaseFetched) return;
    
    console.log('🔄 Background refresh...');
    try {
      await fetchFreshReportsImproved();
    } catch (error) {
      console.warn('⚠️ Background refresh failed:', error);
    }
  };

  const setupImprovedRealtimeSubscription = () => {
    if (!petId) return;

    // Clean up existing subscription
    if (channelRef.current) {
      console.log('🧹 Removing existing subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('🔗 Setting up improved realtime subscription for pet:', petId);
    setConnectionStatus('connecting');

    const channel = supabase
      .channel(`improved-health-reports-${petId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_reports',
          filter: `pet_id=eq.${petId}`
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
          scheduleRetry();
        }
      });

    channelRef.current = channel;
  };

  const handleRealtimeUpdate = (payload: any) => {
    try {
      if (payload.eventType === 'INSERT') {
        const newReport = payload.new as HealthReport;
        console.log('➕ New report inserted via realtime:', newReport.id);
        
        setHealthReports(prev => {
          const updated = [newReport, ...prev.filter(r => r.id !== newReport.id)];
          // Update cache
          if (petId) {
            healthReportCache.set(petId, updated);
            healthReportCache.cacheReportPreview(petId, newReport);
          }
          return updated;
        });
        
        if (newReport.status === 'completed') {
          toast({
            title: "Report Analysis Complete! 🎉",
            description: `${newReport.title} has been analyzed and is ready to view.`,
          });
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedReport = payload.new as HealthReport;
        console.log('📝 Report updated via realtime:', updatedReport.id);
        
        setHealthReports(prev => {
          const updated = prev.map(report => 
            report.id === updatedReport.id ? updatedReport : report
          );
          // Update cache
          if (petId) {
            healthReportCache.set(petId, updated);
            healthReportCache.cacheReportPreview(petId, updatedReport);
          }
          return updated;
        });
        
        // Show toast when AI analysis completes
        if (updatedReport.status === 'completed' && updatedReport.ai_analysis && payload.old?.status !== 'completed') {
          if (petId) {
            healthReportCache.updatePreviewWithDiagnosis(petId, updatedReport.id, updatedReport.ai_analysis);
          }
          toast({
            title: "AI Analysis Complete! 🎉",
            description: `${updatedReport.title} analysis is ready to view.`,
          });
        }
      } else if (payload.eventType === 'DELETE') {
        console.log('🗑️ Report deleted via realtime:', payload.old.id);
        
        setHealthReports(prev => {
          const updated = prev.filter(report => report.id !== payload.old.id);
          // Update cache
          if (petId) {
            healthReportCache.set(petId, updated);
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('❌ Error handling realtime update:', error);
    }
  };

  const handleLoadingError = (error: any) => {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load health reports';
    setError(errorMessage);
    setLoading(false);
    
    toast({
      title: "Error Loading Reports",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const scheduleRetry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    retryTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Retrying realtime connection...');
      setupImprovedRealtimeSubscription();
    }, 5000);
  };

  const addReportToState = (newReport: HealthReport) => {
    console.log('✅ Adding report to state with improved tracking:', newReport.id);
    
    setHealthReports(prev => {
      const updated = [newReport, ...prev.filter(r => r.id !== newReport.id)];
      return updated;
    });
    
    // Cache immediately
    if (petId) {
      healthReportCache.addReportToCache(petId, newReport);
    }
  };

  const triggerAIAnalysis = async (reportId: string) => {
    console.log('🤖 Triggering AI analysis with improved error handling:', reportId);
    
    const report = healthReports.find(r => r.id === reportId);
    if (!report || !petId) {
      console.error('Report or petId not found for AI analysis');
      return;
    }

    try {
      // Update status optimistically
      setHealthReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'processing' as const } : r
      ));

      const { data: petData } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      const payload = {
        report_id: reportId,
        pet_id: petId,
        user_id: report.user_id,
        pet_name: petData?.name || '',
        pet_type: petData?.type || '',
        pet_breed: petData?.breed || '',
        report_url: report.image_url,
        report_type: report.report_type,
        report_date: report.report_date,
        report_label: report.report_label
      };

      console.log('📤 Sending AI analysis request:', payload);

      const response = await fetch('https://hook.eu2.make.com/ohpjbbdx10uxe4jowe72jsaz9tvf6znc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ AI analysis request sent successfully');

      toast({
        title: "AI Analysis Started! 🧠",
        description: "Analysis requested successfully. You'll be notified when complete.",
      });

    } catch (error) {
      console.error('❌ Error triggering AI analysis:', error);
      
      // Reset status on error
      setHealthReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'completed' as const } : r
      ));
      
      toast({
        title: "Analysis Failed",
        description: "Failed to request AI analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    healthReports,
    loading,
    error,
    connectionStatus,
    addReportToState,
    triggerAIAnalysis,
    refetch: loadReportsImproved
  };
};
