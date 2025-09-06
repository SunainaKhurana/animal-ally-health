import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HealthReport } from '@/hooks/useHealthReports';

interface HealthAnalysis {
  healthStatus: 'good' | 'attention' | 'unknown';
  recentReports: number;
  lastCheckup: string | null;
  concerns: string[];
  upcomingReminders: number;
}

export const useRealHealthStatus = (petId?: string) => {
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAnalysis>({
    healthStatus: 'unknown',
    recentReports: 0,
    lastCheckup: null,
    concerns: [],
    upcomingReminders: 0
  });
  const [loading, setLoading] = useState(true);

  const analyzeHealthStatus = (reports: HealthReport[]): 'good' | 'attention' | 'unknown' => {
    if (reports.length === 0) return 'unknown';

    // Get recent reports (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReports = reports.filter(report => 
      new Date(report.report_date) >= thirtyDaysAgo
    );

    if (recentReports.length === 0) return 'unknown';

    // Check for concerning conditions in recent reports
    const concerningKeywords = [
      'infection', 'bacterial', 'viral', 'parasite', 'abnormal', 'elevated',
      'decreased', 'deficiency', 'disease', 'disorder', 'inflammation',
      'tumor', 'mass', 'lesion', 'injury', 'fracture', 'diarrhea',
      'vomiting', 'fever', 'pain', 'seizure', 'emergency', 'urgent',
      'critical', 'severe', 'moderate concern', 'follow-up required'
    ];

    const hasHealthConcerns = recentReports.some(report => {
      const textToAnalyze = [
        report.ai_analysis,
        report.ai_diagnosis, 
        report.vet_diagnosis,
        report.key_findings
      ].filter(Boolean).join(' ').toLowerCase();

      return concerningKeywords.some(keyword => 
        textToAnalyze.includes(keyword.toLowerCase())
      );
    });

    return hasHealthConcerns ? 'attention' : 'good';
  };

  const extractConcerns = (reports: HealthReport[]): string[] => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReports = reports.filter(report => 
      new Date(report.report_date) >= thirtyDaysAgo
    );

    const concerns: string[] = [];

    recentReports.forEach(report => {
      if (report.ai_diagnosis && report.ai_diagnosis.toLowerCase().includes('infection')) {
        concerns.push('Recent infection detected');
      }
      if (report.vet_diagnosis && report.vet_diagnosis.toLowerCase().includes('bacterial')) {
        concerns.push('Bacterial condition diagnosed');
      }
      if (report.ai_analysis && (
        report.ai_analysis.toLowerCase().includes('abnormal') ||
        report.ai_analysis.toLowerCase().includes('concern')
      )) {
        concerns.push('Abnormal findings detected');
      }
    });

    return [...new Set(concerns)]; // Remove duplicates
  };

  useEffect(() => {
    const fetchHealthData = async () => {
      if (!petId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch health reports
        const { data: reports, error: reportsError } = await supabase
          .from('health_reports')
          .select('*')
          .eq('pet_id', petId)
          .order('report_date', { ascending: false });

        if (reportsError) {
          console.error('Error fetching health reports:', reportsError);
          setLoading(false);
          return;
        }

        const healthReports = reports || [];
        
        // Analyze health status based on actual data
        const status = analyzeHealthStatus(healthReports);
        const concerns = extractConcerns(healthReports);
        
        // Get most recent checkup date
        const lastCheckup = healthReports.length > 0 
          ? new Date(healthReports[0].report_date).toLocaleDateString()
          : null;

        // Count recent reports (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentReportCount = healthReports.filter(report => 
          new Date(report.report_date) >= thirtyDaysAgo
        ).length;

        // TODO: In future, fetch actual medication reminders and calculate upcoming ones
        const upcomingReminders = 0;

        setHealthAnalysis({
          healthStatus: status,
          recentReports: recentReportCount,
          lastCheckup,
          concerns,
          upcomingReminders
        });

      } catch (error) {
        console.error('Error analyzing health status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [petId]);

  return { healthAnalysis, loading };
};