
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { healthReportCache } from '@/lib/improvedHealthReportCache';
import { HealthReport } from '@/hooks/useHealthReports';

export const useHealthReportsData = (petId?: string) => {
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseFetched, setSupabaseFetched] = useState(false);
  const { toast } = useToast();

  const handleLoadingError = useCallback((error: any) => {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load health reports';
    setError(errorMessage);
    setLoading(false);
    
    toast({
      title: "Error Loading Reports",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  const fetchFreshReports = useCallback(async () => {
    if (!petId) return;

    console.log('📡 Fetching fresh health reports...');
    
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
      console.log('✅ Fresh reports fetched:', reports.length);
      
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
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  }, [petId]);

  const loadReports = useCallback(async () => {
    if (!petId) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Loading health reports for pet:', petId);
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cachedReports = healthReportCache.get(petId);
      const cachedPreviews = healthReportCache.getCachedPreviews(petId);
      
      if (cachedReports && cachedReports.length > 0) {
        console.log('✅ Using cached reports');
        setHealthReports(cachedReports);
        setLoading(false);
        
        // Background refresh if not recently fetched
        if (!supabaseFetched) {
          fetchFreshReports().catch(console.warn);
        }
        return;
      }
      
      if (cachedPreviews.length > 0) {
        console.log('✅ Converting cached previews to reports');
        const reportsFromPreviews = cachedPreviews.map(preview => ({
          id: preview.id,
          pet_id: preview.pet_id,
          user_id: '',
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
        fetchFreshReports().catch(console.warn);
        return;
      }

      // No cache, fetch from database
      await fetchFreshReports();
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      handleLoadingError(error);
    }
  }, [petId, supabaseFetched, fetchFreshReports, handleLoadingError]);

  return {
    healthReports,
    setHealthReports,
    loading,
    error,
    loadReports,
    fetchFreshReports
  };
};
