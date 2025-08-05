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

export const useHealthReports = (petId?: string) => {
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseFetched, setSupabaseFetched] = useState(false);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (petId) {
      loadReportsHybrid();
      setupRealtimeSubscription();
    }
    
    return () => {
      // Cleanup subscription on unmount or petId change
      if (channelRef.current) {
        console.log('🧹 Cleaning up health reports subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [petId]);

  // Hybrid loading: Cache first, then Supabase as backup
  const loadReportsHybrid = async () => {
    if (!petId) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🏠 Loading health reports (hybrid mode) for pet:', petId);
      setLoading(true);
      setError(null);
      
      // Step 1: Try to load from cache for instant display
      const cachedReports = healthReportCache.get(petId);
      const cachedPreviews = healthReportCache.getCachedPreviews(petId);
      
      if (cachedReports && cachedReports.length > 0) {
        console.log('📦 Displaying cached reports:', cachedReports.length);
        setHealthReports(cachedReports);
        setLoading(false);
        
        // Still fetch fresh data in background for updates
        fetchFreshReportsBackground();
        return;
      }
      
      if (cachedPreviews && cachedPreviews.length > 0) {
        console.log('📦 Converting cached previews to reports:', cachedPreviews.length);
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
        
        // Fetch from Supabase in background
        fetchFreshReportsBackground();
        return;
      }

      // Step 2: If no cache, fetch from Supabase
      console.log('🔍 No cached reports found, fetching from Supabase...');
      await fetchFreshReports();
    } catch (error) {
      console.error('❌ Error in hybrid loading:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load health reports';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshReports = async () => {
    if (!petId) return;

    console.log('📡 Fetching fresh health reports from Supabase...');
    
    try {
      const { data, error: fetchError } = await supabase
        .from('health_reports')
        .select('*')
        .eq('pet_id', petId)
        .order('actual_report_date', { ascending: false, nullsFirst: false })
        .order('report_date', { ascending: false });

      if (fetchError) {
        console.error('❌ Supabase fetch error:', fetchError);
        throw new Error(`Database fetch failed: ${fetchError.message}`);
      }
      
      const reports = (data || []) as HealthReport[];
      console.log('✅ Fresh reports fetched from Supabase:', reports.length);
      
      setHealthReports(reports);
      setError(null);
      setSupabaseFetched(true);
      
      // Cache the fresh data
      if (reports.length > 0) {
        healthReportCache.set(petId, reports);
        
        // Also update individual report previews
        reports.forEach(report => {
          healthReportCache.cacheReportPreview(petId, report);
        });
        
        console.log('💾 Reports cached locally');
      } else {
        console.log('📭 No reports found in Supabase');
      }
    } catch (error) {
      console.error('❌ Error fetching from Supabase:', error);
      throw error;
    }
  };

  const fetchFreshReportsBackground = async () => {
    if (!petId || supabaseFetched) return;
    
    console.log('🔄 Background fetch from Supabase...');
    try {
      await fetchFreshReports();
    } catch (error) {
      console.warn('⚠️ Background fetch failed, but cached data is available');
    }
  };

  const setupRealtimeSubscription = () => {
    if (!petId) return;

    // Clean up existing subscription first
    if (channelRef.current) {
      console.log('🧹 Removing existing health reports channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('🔗 Setting up health reports realtime subscription for pet:', petId);

    const channel = supabase
      .channel(`health-reports-${petId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_reports',
          filter: `pet_id=eq.${petId}`
        },
        (payload) => {
          console.log('🔄 Real-time health report update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newReport = payload.new as HealthReport;
            console.log('➕ New report inserted:', newReport.id);
            
            setHealthReports(prev => {
              const updated = [newReport, ...prev.filter(r => r.id !== newReport.id)];
              // Update cache
              healthReportCache.set(petId, updated);
              healthReportCache.cacheReportPreview(petId, newReport);
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
            console.log('📝 Report updated:', updatedReport.id, 'Status:', updatedReport.status);
            
            setHealthReports(prev => {
              const updated = prev.map(report => 
                report.id === updatedReport.id ? updatedReport : report
              );
              // Update cache
              healthReportCache.set(petId, updated);
              healthReportCache.cacheReportPreview(petId, updatedReport);
              return updated;
            });
            
            // Show toast when AI analysis completes
            if (updatedReport.status === 'completed' && updatedReport.ai_analysis && payload.old?.status !== 'completed') {
              healthReportCache.updatePreviewWithDiagnosis(petId, updatedReport.id, updatedReport.ai_analysis);
              toast({
                title: "AI Analysis Complete! 🎉",
                description: `${updatedReport.title} analysis is ready to view.`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Report deleted:', payload.old.id);
            
            setHealthReports(prev => {
              const updated = prev.filter(report => report.id !== payload.old.id);
              // Update cache
              healthReportCache.set(petId, updated);
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Health reports subscription status:', status);
      });

    // Store the channel reference for cleanup
    channelRef.current = channel;
  };

  // Add new report to local state and cache immediately
  const addReportToState = (newReport: HealthReport) => {
    console.log('✅ Adding report to state and cache:', newReport.id);
    
    setHealthReports(prev => {
      const updated = [newReport, ...prev.filter(r => r.id !== newReport.id)];
      return updated;
    });
    
    // Cache immediately
    if (petId) {
      healthReportCache.addReportToCache(petId, newReport);
    }
  };

  // Trigger AI analysis for a specific report
  const triggerAIAnalysis = async (reportId: string) => {
    console.log('🤖 Triggering AI analysis for report:', reportId);
    
    const report = healthReports.find(r => r.id === reportId);
    if (!report || !petId) {
      console.error('Report or petId not found for AI analysis');
      return;
    }

    try {
      // Update report status to processing
      setHealthReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'processing' as const } : r
      ));

      // Get pet info for the webhook
      const { data: petData } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      // Trigger Make.com webhook for AI analysis
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

      console.log('📤 Sending AI analysis request to Make.com:', payload);

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
        description: "Analysis has been requested. You'll be notified when it's complete.",
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

  const deleteReport = async (reportId: string) => {
    try {
      console.log('🗑️ Deleting health report:', reportId);
      
      // Get the report to find the image URL
      const { data: report } = await supabase
        .from('health_reports')
        .select('image_url')
        .eq('id', reportId)
        .single();

      // Delete from storage if image exists
      if (report?.image_url) {
        const path = report.image_url.split('/').pop();
        if (path) {
          await supabase.storage
            .from('health-reports')
            .remove([path]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('health_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Clear from cache
      if (petId) {
        const key = `health_reports_preview_${petId}_${reportId}`;
        localStorage.removeItem(key);
      }

      console.log('✅ Health report deleted successfully');

      toast({
        title: "Success",
        description: "Health report deleted successfully",
      });

      loadReportsHybrid();
    } catch (error) {
      console.error('❌ Error deleting health report:', error);
      toast({
        title: "Error",
        description: "Failed to delete health report",
        variant: "destructive",
      });
    }
  };

  const updateReport = async (reportId: string, updates: Partial<HealthReport>) => {
    try {
      console.log('📝 Updating health report:', reportId, updates);
      
      const { error } = await supabase
        .from('health_reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;

      // Update cache
      if (petId) {
        healthReportCache.cacheReportPreview(petId, { id: reportId, ...updates });
      }

      console.log('✅ Health report updated successfully');

      toast({
        title: "Success",
        description: "Health report updated successfully",
      });

      loadReportsHybrid();
    } catch (error) {
      console.error('❌ Error updating health report:', error);
      toast({
        title: "Error",
        description: "Failed to update health report",
        variant: "destructive",
      });
    }
  };

  return {
    healthReports,
    loading,
    error,
    deleteReport,
    updateReport,
    addReportToState,
    triggerAIAnalysis,
    refetch: loadReportsHybrid
  };
};
