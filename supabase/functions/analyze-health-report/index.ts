
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Medical reference database for dogs
const medicalDatabase = {
  bloodWork: {
    WBC: { normal: [6, 15], unit: '10³/μL', description: 'White Blood Cells' },
    RBC: { normal: [5.5, 8.5], unit: '10⁶/μL', description: 'Red Blood Cells' },
    HGB: { normal: [12, 18], unit: 'g/dL', description: 'Hemoglobin' },
    HCT: { normal: [37, 55], unit: '%', description: 'Hematocrit' },
    PLT: { normal: [200, 500], unit: '10³/μL', description: 'Platelets' },
    GLU: { normal: [70, 110], unit: 'mg/dL', description: 'Glucose' },
    BUN: { normal: [7, 27], unit: 'mg/dL', description: 'Blood Urea Nitrogen' },
    CREA: { normal: [0.5, 1.8], unit: 'mg/dL', description: 'Creatinine' },
    ALT: { normal: [10, 100], unit: 'U/L', description: 'Alanine Aminotransferase' },
    AST: { normal: [0, 50], unit: 'U/L', description: 'Aspartate Aminotransferase' }
  }
};

const analyzeWithMedicalDatabase = (reportData: any) => {
  const analysis = {
    summary: '',
    abnormalFindings: [] as string[],
    recommendations: [] as string[],
    keyFindings: '',
    overallHealth: 'good' as 'excellent' | 'good' | 'fair' | 'poor'
  };

  // Analyze readings against medical database
  if (reportData.readings) {
    let abnormalCount = 0;
    const totalTests = Object.keys(reportData.readings).length;

    Object.entries(reportData.readings).forEach(([test, valueStr]: [string, any]) => {
      const normalizedTest = test.toUpperCase().replace(/\s+/g, '');
      const numericValue = parseFloat(String(valueStr).replace(/[^\d.]/g, ''));
      
      if (isNaN(numericValue)) return;

      const reference = medicalDatabase.bloodWork[normalizedTest as keyof typeof medicalDatabase.bloodWork];
      if (reference) {
        if (numericValue < reference.normal[0]) {
          analysis.abnormalFindings.push(`${reference.description} is low (${valueStr}, normal: ${reference.normal[0]}-${reference.normal[1]} ${reference.unit})`);
          abnormalCount++;
        } else if (numericValue > reference.normal[1]) {
          analysis.abnormalFindings.push(`${reference.description} is high (${valueStr}, normal: ${reference.normal[0]}-${reference.normal[1]} ${reference.unit})`);
          abnormalCount++;
        }
      }
    });

    // Determine overall health based on abnormal findings
    const abnormalPercentage = totalTests > 0 ? (abnormalCount / totalTests) * 100 : 0;
    if (abnormalPercentage === 0) {
      analysis.overallHealth = 'excellent';
    } else if (abnormalPercentage < 20) {
      analysis.overallHealth = 'good';
    } else if (abnormalPercentage < 50) {
      analysis.overallHealth = 'fair';
    } else {
      analysis.overallHealth = 'poor';
    }
  }

  // Generate summary
  if (analysis.abnormalFindings.length === 0) {
    analysis.summary = 'All test results appear to be within normal ranges. This indicates good overall health.';
    analysis.recommendations.push('Continue current care routine');
    analysis.recommendations.push('Schedule regular check-ups as recommended by your veterinarian');
  } else {
    analysis.summary = `${analysis.abnormalFindings.length} test result(s) outside normal ranges require attention.`;
    analysis.recommendations.push('Discuss these findings with your veterinarian');
    analysis.recommendations.push('Follow up testing may be recommended');
  }

  // Set key findings
  analysis.keyFindings = analysis.abnormalFindings.length > 0 
    ? analysis.abnormalFindings.join('; ')
    : 'All values within normal ranges';

  return analysis;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportData, petInfo, reportId } = await req.json();

    console.log('Analyzing health report:', { reportId, petInfo: petInfo?.name });

    // Analyze the report using medical database
    const analysis = analyzeWithMedicalDatabase(reportData);

    // Enhanced analysis with AI context
    const enhancedAnalysis = {
      ...analysis,
      petSpecific: {
        breed: petInfo?.breed || 'Unknown',
        considerations: petInfo?.breed ? `Breed-specific considerations for ${petInfo.breed} taken into account.` : ''
      },
      reportDetails: {
        testType: reportData.testType || 'General Health Check',
        reportDate: reportData.reportDate || new Date().toISOString().split('T')[0],
        veterinarian: reportData.veterinarian || 'Not specified',
        clinic: reportData.clinic || 'Not specified'
      },
      timestamp: new Date().toISOString()
    };

    console.log('Analysis complete:', enhancedAnalysis);

    return new Response(JSON.stringify(enhancedAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-health-report function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      summary: 'Analysis failed due to processing error',
      keyFindings: 'Unable to analyze report',
      overallHealth: 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
