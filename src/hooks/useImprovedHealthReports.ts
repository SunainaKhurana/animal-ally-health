
import { useEffect } from 'react';
import { useHealthReportsData } from './health/useHealthReportsData';
import { useHealthReportsActions } from './health/useHealthReportsActions';
import { useHealthReportsRealtime } from './useHealthReportsRealtime';

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
  ai_diagnosis?: string;
  ocr_parameters?: any;
  created_at: string;
  updated_at: string;
  report_label?: string;
  vet_diagnosis?: string;
  parent_report_id?: string;
}

export const useImprovedHealthReports = (petId?: string) => {
  const {
    healthReports,
    setHealthReports,
    loading,
    error,
    loadReports
  } = useHealthReportsData(petId);

  const { triggerAIAnalysis, deleteReport } = useHealthReportsActions(
    petId,
    healthReports,
    setHealthReports,
    loadReports
  );

  // Set up real-time subscription
  useHealthReportsRealtime(
    petId,
    (report) => {
      setHealthReports(prev => prev.map(r => r.id === report.id ? report : r));
    },
    (report) => {
      setHealthReports(prev => [report, ...prev.filter(r => r.id !== report.id)]);
    },
    (reportId) => {
      setHealthReports(prev => prev.filter(r => r.id !== reportId));
    }
  );

  // Load reports when petId changes
  useEffect(() => {
    if (petId) {
      loadReports();
    }
  }, [petId, loadReports]);

  return {
    healthReports,
    loading,
    error,
    connectionStatus: 'connected' as const,
    triggerAIAnalysis,
    deleteReport,
    refetch: loadReports
  };
};
