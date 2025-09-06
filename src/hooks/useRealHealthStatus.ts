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

    // Filter for recent reports (last 2 weeks for most concerns, 4 weeks for persistent issues)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const recentReports = reports.filter(report => 
      new Date(report.report_date) >= twoWeeksAgo
    );
    
    const recentAndMediumReports = reports.filter(report => 
      new Date(report.report_date) >= fourWeeksAgo
    );

    // Check for concerning keywords in recent reports
    const concerningKeywords = [
      'abnormal', 'elevated', 'high', 'low', 'infection', 'bacterial', 'viral',
      'inflammation', 'pain', 'tumor', 'mass', 'growth', 'disease', 'disorder',
      'emergency', 'urgent', 'critical', 'severe', 'concerning', 'worrying'
    ];

    // Persistent condition keywords that may require longer monitoring
    const persistentKeywords = [
      'chronic', 'arthritis', 'diabetes', 'kidney', 'heart', 'liver', 'cancer',
      'thyroid', 'epilepsy', 'allergies'
    ];

    // Check recent reports (2 weeks) for any concerning findings
    for (const report of recentReports) {
      const textToSearch = [
        report.ai_analysis,
        report.ai_diagnosis,
        report.vet_diagnosis,
        report.key_findings
      ].filter(Boolean).join(' ').toLowerCase();

      // Check if any concerning keywords are present
      if (concerningKeywords.some(keyword => textToSearch.includes(keyword))) {
        return 'attention';
      }
    }

    // For persistent conditions, check 4-week window
    for (const report of recentAndMediumReports) {
      const textToSearch = [
        report.ai_analysis,
        report.ai_diagnosis,
        report.vet_diagnosis,
        report.key_findings
      ].filter(Boolean).join(' ').toLowerCase();

      // Only flag persistent conditions if they're still showing up in the 4-week window
      if (persistentKeywords.some(keyword => textToSearch.includes(keyword))) {
        return 'attention';
      }
    }

    // If we have recent reports but no concerning findings, status is good
    if (recentReports.length > 0) {
      return 'good';
    }

    // If no recent reports, status is unknown
    return 'unknown';
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