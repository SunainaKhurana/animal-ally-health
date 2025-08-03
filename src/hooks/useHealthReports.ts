
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
    if (!petId) return;
    
    try {
      setLoading(true);
      
      // First, try to load from cache for instant display
      const cachedReports = healthReportCache.get(petId);
      if (cachedReports && cachedReports.length > 0) {
        console.log('Loading health reports from cache');
        setHealthReports(cachedReports);
        setLoading(false);
        
        // Still fetch fresh data in background
        fetchFreshReports();
        return;
      }

      // If no cache, fetch from Supabase
      await fetchFreshReports();
    } catch (error) {
      console.error('Error fetching health reports:', error);
      toast({
        title: "Error",
        description: "Failed to load health reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshReports = async () => {
    if (!petId) return;

    const { data, error } = await supabase
      .from('health_reports')
      .select('*')
      .eq('pet_id', petId)
      .order('actual_report_date', { ascending: false, nullsFirst: false })
      .order('report_date', { ascending: false });

    if (error) throw error;
    
    const reports = (data || []) as HealthReport[];
    setHealthReports(reports);
    
    // Cache the fresh data
    if (reports.length > 0) {
      healthReportCache.set(petId, reports);
      
      // Also update individual report previews
      reports.forEach(report => {
        healthReportCache.cacheReportPreview(petId, report);
      });
    }
  };

  const setupRealtimeSubscription = () => {
    if (!petId) return;

    // Clean up existing subscription first
    if (channelRef.current) {
      console.log('Removing existing health reports channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('Setting up health reports realtime subscription for pet:', petId);

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
          console.log('Real-time health report update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newReport = payload.new as HealthReport;
            setHealthReports(prev => [newReport, ...prev]);
            
            // Cache the new report preview
            healthReportCache.cacheReportPreview(petId, newReport);
            
            if (newReport.status === 'completed') {
              toast({
                title: "Report Analysis Complete",
                description: `${newReport.title} has been analyzed and is ready to view.`,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedReport = payload.new as HealthReport;
            setHealthReports(prev => 
              prev.map(report => 
                report.id === updatedReport.id ? updatedReport : report
              )
            );
            
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
            setHealthReports(prev => 
              prev.filter(report => report.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Health reports subscription status:', status);
      });

    // Store the channel reference for cleanup
    channelRef.current = channel;
  };

  const deleteReport = async (reportId: string) => {
    try {
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

      toast({
        title: "Success",
        description: "Health report deleted successfully",
      });

      fetchReports();
    } catch (error) {
      console.error('Error deleting health report:', error);
      toast({
        title: "Error",
        description: "Failed to delete health report",
        variant: "destructive",
      });
    }
  };

  const updateReport = async (reportId: string, updates: Partial<HealthReport>) => {
    try {
      const { error } = await supabase
        .from('health_reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;

      // Update cache
      if (petId) {
        healthReportCache.cacheReportPreview(petId, { id: reportId, ...updates });
      }

      toast({
        title: "Success",
        description: "Health report updated successfully",
      });

      fetchReports();
    } catch (error) {
      console.error('Error updating health report:', error);
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
    deleteReport,
    updateReport,
    refetch: fetchReports
  };
};
