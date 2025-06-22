import Tesseract from 'tesseract.js';
import { preprocessImage } from './imagePreprocessing';

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
  confidence?: number;
  rawText?: string;
}

// Enhanced medical terminology dictionary for fuzzy matching
const medicalTerms = {
  parameters: [
    'glucose', 'protein', 'creatinine', 'bun', 'cholesterol', 'triglycerides',
    'hemoglobin', 'hematocrit', 'white blood cell', 'red blood cell', 'platelet',
    'sodium', 'potassium', 'chloride', 'co2', 'calcium', 'phosphorus',
    'alt', 'ast', 'alkaline phosphatase', 'bilirubin', 'albumin', 'globulin'
  ],
  reportTypes: [
    'blood chemistry', 'complete blood count', 'cbc', 'comprehensive metabolic panel',
    'lipid panel', 'thyroid panel', 'urinalysis', 'fecal examination',
    'radiograph', 'x-ray', 'ultrasound', 'ecg', 'echocardiogram'
  ],
  units: ['mg/dl', 'g/dl', 'mmol/l', 'u/l', 'iu/l', 'ng/ml', 'pg/ml', 'ml/min', '%']
};

// Fuzzy string matching function
const fuzzyMatch = (input: string, targets: string[], threshold = 0.6): string | null => {
  const inputLower = input.toLowerCase();
  
  for (const target of targets) {
    const targetLower = target.toLowerCase();
    
    // Exact match
    if (inputLower === targetLower) return target;
    
    // Contains match
    if (inputLower.includes(targetLower) || targetLower.includes(inputLower)) {
      return target;
    }
    
    // Simple Levenshtein-like distance
    const maxLen = Math.max(inputLower.length, targetLower.length);
    const similarity = 1 - (levenshteinDistance(inputLower, targetLower) / maxLen);
    
    if (similarity >= threshold) {
      return target;
    }
  }
  
  return null;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Enhanced OCR with multiple passes
export const extractHealthReportData = async (file: File): Promise<HealthReportData> => {
  try {
    console.log('Starting enhanced OCR processing...');
    
    // Preprocess image for better OCR
    const processedFile = await preprocessImage(file);
    
    // Multiple OCR passes with different configurations
    const ocrConfigs = [
      {
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:/()- ',
      },
      {
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
      },
      {
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_COLUMN,
      }
    ];

    let bestResult = '';
    let bestConfidence = 0;

    // Try multiple OCR configurations and pick the best result
    for (const config of ocrConfigs) {
      try {
        const { data } = await Tesseract.recognize(processedFile, 'eng', {
          logger: m => console.log(`OCR Progress (${JSON.stringify(config)}):`, m),
          ...config
        });

        if (data.confidence > bestConfidence) {
          bestResult = data.text;
          bestConfidence = data.confidence;
        }
      } catch (error) {
        console.warn('OCR pass failed:', error);
      }
    }

    if (!bestResult) {
      // Fallback to original file with basic OCR
      const { data } = await Tesseract.recognize(file, 'eng');
      bestResult = data.text;
      bestConfidence = data.confidence;
    }

    console.log('OCR completed with confidence:', bestConfidence);
    console.log('Extracted text:', bestResult);

    // Parse the extracted text with enhanced logic
    const reportData = parseHealthReportTextEnhanced(bestResult);
    reportData.confidence = bestConfidence;
    reportData.rawText = bestResult;

    return reportData;
  } catch (error) {
    console.error('Enhanced OCR processing failed:', error);
    throw error;
  }
};

const parseHealthReportTextEnhanced = (text: string): HealthReportData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const reportData: HealthReportData = {
    parameters: [],
    findings: [],
    recommendations: []
  };

  // Enhanced report type detection with fuzzy matching
  const fullText = text.toLowerCase();
  for (const reportType of medicalTerms.reportTypes) {
    if (fullText.includes(reportType.toLowerCase())) {
      reportData.reportType = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      break;
    }
  }

  // Enhanced parameter extraction patterns
  const enhancedParameterPatterns = [
    // Standard format: "Parameter: Value Unit (Range)"
    /([a-zA-Z\s]+)\s*:?\s*([0-9.,]+)\s*([a-zA-Z/%]*)\s*(?:\(([0-9.,-\s]+)\))?/gi,
    // Table format: "Parameter  Value  Unit  Range"
    /([a-zA-Z\s]+)\s+([0-9.,]+)\s+([a-zA-Z/%]*)\s+([0-9.,-\s]+)/gi,
    // Simple format: "Parameter Value"
    /([a-zA-Z\s]+)\s+([0-9.,]+)/gi
  ];

  // Date patterns (enhanced)
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
    /(?:date|collected|tested)[\s:]*(\d{1,2}\/\d{1,2}\/\d{4})/i
  ];

  // Extract date with enhanced patterns
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      reportData.reportDate = match[1] || match[0];
      break;
    }
  }

  // Enhanced veterinarian extraction
  const vetPatterns = [
    /(?:dr\.?|doctor|veterinarian)[\s:]*([a-zA-Z\s.]+)/i,
    /(?:examined by|reviewed by)[\s:]*([a-zA-Z\s.]+)/i,
    /dvm[\s:]*([a-zA-Z\s.]+)/i
  ];

  for (const pattern of vetPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      reportData.veterinarian = match[1].trim();
      break;
    }
  }

  // Enhanced parameter extraction with fuzzy matching
  for (const pattern of enhancedParameterPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const rawName = match[1].trim();
      const value = match[2];
      const unit = match[3] || '';
      const range = match[4] || '';

      // Use fuzzy matching to identify known parameters
      const matchedParameter = fuzzyMatch(rawName, medicalTerms.parameters);
      const parameterName = matchedParameter || rawName;

      // Skip if parameter name is too short or looks invalid
      if (parameterName.length < 3 || /^\d+$/.test(parameterName)) {
        continue;
      }

      const parameter: HealthParameter = {
        name: parameterName,
        value: value,
        unit: unit,
        referenceRange: range
      };

      // Enhanced status determination
      if (range) {
        const rangeMatch = range.match(/([0-9.]+)\s*[-–]\s*([0-9.]+)/);
        if (rangeMatch) {
          const min = parseFloat(rangeMatch[1]);
          const max = parseFloat(rangeMatch[2]);
          const val = parseFloat(value);
          
          if (!isNaN(val) && !isNaN(min) && !isNaN(max)) {
            if (val < min) parameter.status = 'low';
            else if (val > max) parameter.status = 'high';
            else parameter.status = 'normal';
          }
        }
      }

      reportData.parameters.push(parameter);
    }
  }

  // Enhanced findings extraction
  const findingsSections = [
    /(?:findings?|results?|observations?|comments?)[\s:]*([^]+?)(?=recommendations?|conclusion|notes?|$)/is,
    /(?:abnormal|normal|interpretation)[\s:]*([^]+?)(?=recommendations?|conclusion|$)/is
  ];

  for (const pattern of findingsSections) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 10) {
      reportData.findings = [match[1].trim()];
      break;
    }
  }

  // Enhanced recommendations extraction
  const recommendationPatterns = [
    /(?:recommendations?|treatment|plan|follow.?up)[\s:]*([^]+?)$/is,
    /(?:suggested|advised|recommended)[\s:]*([^]+?)$/is
  ];

  for (const pattern of recommendationPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 10) {
      reportData.recommendations = [match[1].trim()];
      break;
    }
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
