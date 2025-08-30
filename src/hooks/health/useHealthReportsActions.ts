
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { healthReportCache } from '@/lib/healthReportCache';
import { HealthReport } from '@/hooks/useHealthReports';

export const useHealthReportsActions = (
  petId?: string,
  healthReports?: HealthReport[],
  setHealthReports?: (reports: HealthReport[] | ((prev: HealthReport[]) => HealthReport[])) => void,
  loadReports?: () => Promise<void>
) => {
  const { toast } = useToast();

  const triggerAIAnalysis = useCallback(async (reportId: string) => {
    if (!healthReports || !setHealthReports || !petId) return;

    console.log('🤖 Triggering AI analysis:', reportId);
    
    const report = healthReports.find(r => r.id === reportId);
    if (!report) {
      console.error('Report not found for AI analysis');
      return;
    }

    try {
      // Update status optimistically
      setHealthReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'processing' as const } : r
      ));

      // Fetch pet data for enhanced analysis
      const { data: petData } = await supabase
        .from('pets')
        .select('name, type, breed, gender, age_years, age_months, weight, weight_kg, pre_existing_conditions')
        .eq('id', petId)
        .single();

      const payload = {
        report_id: reportId,
        pet_id: petId,
        user_id: report.user_id,
        pet_name: petData?.name || '',
        pet_type: petData?.type || '',
        pet_breed: petData?.breed || '',
        pet_gender: petData?.gender || '',
        pet_age_years: petData?.age_years || 0,
        pet_age_months: petData?.age_months || 0,
        pet_weight: petData?.weight || 0,
        pet_weight_kg: petData?.weight_kg || 0,
        pre_existing_conditions: petData?.pre_existing_conditions || [],
        report_url: report.image_url,
        report_type: report.report_type,
        report_date: report.report_date,
        report_label: report.report_label
      };

      const response = await fetch('https://hook.eu2.make.com/ohpjbbdx10uxe4jowe72jsaz9tvf6znc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  }, [healthReports, setHealthReports, petId, toast]);

  const deleteReport = useCallback(async (reportId: string) => {
    if (!petId || !setHealthReports || !loadReports) {
      console.error('Cannot delete report: missing dependencies');
      return;
    }

    console.log('🗑️ Deleting health report:', reportId);
    
    try {
      // Optimistically update UI
      setHealthReports(prev => prev.filter(r => r.id !== reportId));
      
      // Remove from cache
      healthReportCache.removeReportFromCache(petId, reportId);
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from('health_reports')
        .delete()
        .eq('id', reportId);

      if (deleteError) {
        console.error('❌ Error deleting report:', deleteError);
        
        // Revert optimistic update on error
        await loadReports();
        
        toast({
          title: "Delete Failed",
          description: "Failed to delete the health report. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Report deleted successfully');
      
      toast({
        title: "Report Deleted",
        description: "The health report has been deleted successfully.",
      });

    } catch (error) {
      console.error('❌ Error in deleteReport:', error);
      
      // Revert optimistic update on error
      await loadReports();
      
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }, [petId, setHealthReports, loadReports, toast]);

  return {
    triggerAIAnalysis,
    deleteReport
  };
};
