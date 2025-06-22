import Tesseract from 'tesseract.js';

export interface VaccinationData {
  vaccine?: string;
  date?: string;
  veterinarian?: string;
  nextDue?: string;
}

export interface HealthParameter {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status?: 'normal' | 'high' | 'low' | 'critical';
}

export interface HealthReportData {
  reportType?: string;
  reportDate?: string;
  veterinarian?: string;
  clinic?: string;
  parameters: HealthParameter[];
  findings?: string[];
  recommendations?: string[];
}

// Enhanced OCR for health reports
export const extractHealthReportData = async (file: File): Promise<HealthReportData> => {
  try {
    console.log('Starting OCR processing for health report...');
    
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => console.log('OCR Progress:', m)
    });

    console.log('Extracted text:', text);

    // Parse the extracted text for health report information
    const reportData = parseHealthReportText(text);
    
    return reportData;
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
};

const parseHealthReportText = (text: string): HealthReportData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const reportData: HealthReportData = {
    parameters: [],
    findings: [],
    recommendations: []
  };

  // Common lab test patterns
  const parameterPatterns = [
    /(\w+(?:\s+\w+)*)\s*:?\s*([0-9.]+)\s*([a-zA-Z\/\%]*)\s*(?:ref|reference|normal)?\s*:?\s*([0-9.-]+\s*-\s*[0-9.]+)/gi,
    /(\w+(?:\s+\w+)*)\s+([0-9.]+)\s*([a-zA-Z\/\%]*)\s+([0-9.-]+\s*-\s*[0-9.]+)/gi
  ];

  // Date patterns
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w+\s+\d{4})/;

  // Report type detection
  const reportTypePatterns = [
    { pattern: /blood\s*(work|test|panel|chemistry)/i, type: 'Blood Work' },
    { pattern: /complete\s*blood\s*count|cbc/i, type: 'Complete Blood Count' },
    { pattern: /urinalysis|urine\s*test/i, type: 'Urinalysis' },
    { pattern: /x-?ray|radiograph/i, type: 'X-Ray' },
    { pattern: /ultrasound|sonogram/i, type: 'Ultrasound' },
    { pattern: /fecal|stool\s*sample/i, type: 'Fecal Examination' }
  ];

  // Extract report type
  for (const { pattern, type } of reportTypePatterns) {
    if (pattern.test(text)) {
      reportData.reportType = type;
      break;
    }
  }

  // Extract date
  const dateMatch = text.match(datePattern);
  if (dateMatch) {
    reportData.reportDate = dateMatch[0];
  }

  // Extract veterinarian name
  const vetPattern = /(?:dr\.?|doctor)\s+([a-zA-Z\s]+)/i;
  const vetMatch = text.match(vetPattern);
  if (vetMatch) {
    reportData.veterinarian = vetMatch[1].trim();
  }

  // Extract parameters
  for (const pattern of parameterPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const parameter: HealthParameter = {
        name: match[1].trim(),
        value: match[2],
        unit: match[3] || '',
        referenceRange: match[4]
      };

      // Determine status based on reference range
      if (parameter.referenceRange) {
        const [min, max] = parameter.referenceRange.split('-').map(v => parseFloat(v.trim()));
        const value = parseFloat(parameter.value);
        
        if (!isNaN(value) && !isNaN(min) && !isNaN(max)) {
          if (value < min) parameter.status = 'low';
          else if (value > max) parameter.status = 'high';
          else parameter.status = 'normal';
        }
      }

      reportData.parameters.push(parameter);
    }
  }

  // Extract findings and recommendations
  const findingsPattern = /(?:findings?|results?|observations?)\s*:?\s*(.*?)(?=recommendations?|conclusion|$)/is;
  const findingsMatch = text.match(findingsPattern);
  if (findingsMatch) {
    reportData.findings = [findingsMatch[1].trim()];
  }

  const recommendationsPattern = /(?:recommendations?|treatment|plan)\s*:?\s*(.*?)$/is;
  const recommendationsMatch = text.match(recommendationsPattern);
  if (recommendationsMatch) {
    reportData.recommendations = [recommendationsMatch[1].trim()];
  }

  return reportData;
};

// Keep the existing vaccination extraction for backward compatibility
export const extractVaccinationData = async (file: File): Promise<VaccinationData> => {
  try {
    const { data: { text } } = await Tesseract.recognize(file, 'eng');
    
    const vaccinePattern = /(DHPP|Rabies|FVRCP|Bordetella|Lyme|FeLV)/i;
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/;
    
    const vaccine = text.match(vaccinePattern)?.[1];
    const date = text.match(datePattern)?.[0];
    
    return {
      vaccine,
      date,
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
};
