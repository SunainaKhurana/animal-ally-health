
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
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (petId) {
      fetchReports();
      setupRealtimeSubscription();
    }
    
    return () => {
      // Cleanup subscription on unmount or petId change
      if (channelRef.current) {
        console.log('Cleaning up health reports subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [petId]);

  const fetchReports = async () => {
    if (!petId) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Fetching health reports for pet:', petId);
      setLoading(true);
      setError(null);
      
      // First, try to load from cache for instant display
      const cachedReports = healthReportCache.get(petId);
      if (cachedReports && cachedReports.length > 0) {
        console.log('📦 Loading health reports from cache:', cachedReports.length);
        setHealthReports(cachedReports);
        setLoading(false);
        
        // Still fetch fresh data in background
        fetchFreshReports();
        return;
      }

      // If no cache, fetch from Supabase
      console.log('🔍 No cached reports found, fetching from database...');
      await fetchFreshReports();
    } catch (error) {
      console.error('❌ Error fetching health reports:', error);
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

    console.log('📡 Fetching fresh health reports from database...');

    const { data, error: fetchError } = await supabase
      .from('health_reports')
      .select('*')
      .eq('pet_id', petId)
      .order('actual_report_date', { ascending: false, nullsFirst: false })
      .order('report_date', { ascending: false });

    if (fetchError) {
      console.error('❌ Database fetch error:', fetchError);
      throw new Error(`Database fetch failed: ${fetchError.message}`);
    }
    
    const reports = (data || []) as HealthReport[];
    console.log('✅ Fresh reports fetched from database:', reports.length);
    
    setHealthReports(reports);
    setError(null);
    
    // Cache the fresh data
    if (reports.length > 0) {
      healthReportCache.set(petId, reports);
      
      // Also update individual report previews
      reports.forEach(report => {
        healthReportCache.cacheReportPreview(petId, report);
      });
      
      console.log('💾 Reports cached locally');
    } else {
      console.log('📭 No reports found in database');
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
              const updated = [newReport, ...prev];
              // Update cache
              healthReportCache.set(petId, updated);
              return updated;
            });
            
            // Cache the new report preview
            healthReportCache.cacheReportPreview(petId, newReport);
            
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
              return updated;
            });
            
            // Update cached preview
            healthReportCache.cacheReportPreview(petId, updatedReport);
            
            // Show toast when AI analysis completes
            if (updatedReport.status === 'completed' && updatedReport.ai_analysis && payload.old?.status === 'processing') {
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

      fetchReports();
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

      fetchReports();
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
    refetch: fetchReports
  };
};
