
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
  status: 'processing' | 'completed' | 'failed';
  image_url?: string;
  extracted_text?: string;
  key_findings?: string;
  ai_analysis?: string;
  created_at: string;
  updated_at: string;
}

export const useHealthReports = (petId?: string) => {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [petId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('health_reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
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

  const uploadReport = async (file: File, petId: string, reportData: any): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('health-reports')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health-reports')
        .getPublicUrl(fileName);

      // Create health report record
      const { data, error } = await supabase
        .from('health_reports')
        .insert({
          pet_id: petId,
          user_id: user.id,
          title: reportData.testType || reportData.reportType || 'Health Report',
          report_type: reportData.testType || reportData.reportType || 'General',
          report_date: reportData.reportDate || new Date().toISOString().split('T')[0],
          image_url: publicUrl,
          extracted_text: JSON.stringify(reportData),
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      fetchReports();
      return data.id;
    } catch (error) {
      console.error('Error uploading health report:', error);
      throw new Error(`Failed to upload health report: ${error.message || 'Unknown error'}`);
    }
  };

  const analyzeReport = async (reportId: string, reportData: any, petInfo: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-health-report', {
        body: { reportData, petInfo, reportId }
      });

      if (error) throw error;

      // Update report with analysis
      const { error: updateError } = await supabase
        .from('health_reports')
        .update({
          ai_analysis: JSON.stringify(data),
          key_findings: data.keyFindings || '',
          status: 'completed'
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      fetchReports();
      return data;
    } catch (error) {
      console.error('Error analyzing health report:', error);
      
      // Update status to failed
      await supabase
        .from('health_reports')
        .update({ status: 'failed' })
        .eq('id', reportId);

      toast({
        title: "Analysis Failed",
        description: "Failed to analyze health report. The report was saved but analysis couldn't be completed.",
        variant: "destructive",
      });
      
      fetchReports();
      throw error;
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
    reports,
    loading,
    uploadReport,
    analyzeReport,
    deleteReport,
    refetch: fetchReports
  };
};
