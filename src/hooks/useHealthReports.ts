
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export const useHealthReports = (petId?: string) => {
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
    
    // Set up real-time subscription for new reports from Make.com
    if (petId) {
      const channel = supabase
        .channel('health-reports-changes')
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
              
              // Show toast for new completed reports
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
              
              // Show toast when processing completes
              if (updatedReport.status === 'completed' && payload.old?.status === 'processing') {
                toast({
                  title: "Report Analysis Complete",
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [petId, toast]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('health_reports')
        .select('*')
        .order('actual_report_date', { ascending: false, nullsFirst: false })
        .order('report_date', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setHealthReports((data || []) as HealthReport[]);
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

  return {
    healthReports,
    loading,
    deleteReport,
    refetch: fetchReports
  };
};
