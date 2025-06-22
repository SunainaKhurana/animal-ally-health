
import Tesseract from 'tesseract.js';

export interface MedicalReportData {
  reportDate?: string;
  testType?: string;
  readings?: Record<string, string>;
  veterinarian?: string;
  clinic?: string;
  petDetails?: {
    name?: string;
    age?: string;
    weight?: string;
  };
  findings?: string[];
  recommendations?: string[];
  rawText?: string;
}

export const extractMedicalReportData = async (file: File): Promise<MedicalReportData> => {
  try {
    console.log('Starting medical OCR extraction for:', file.name);
    
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => console.log('OCR Progress:', m)
    });

    console.log('Extracted text:', text);

    // Enhanced pattern matching for medical reports
    const reportData: MedicalReportData = {
      rawText: text
    };

    // Extract report date with multiple patterns
    const datePatterns = [
      /(?:date|dated?)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /(?:report date|test date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    ];

    for (const pattern of datePatterns) {
      const dateMatch = text.match(pattern);
      if (dateMatch) {
        reportData.reportDate = dateMatch[1];
        break;
      }
    }

    // Extract test type
    const testTypePatterns = [
      /(?:test type|examination|report type)[:\s]*([^\n\r]+)/i,
      /(?:blood work|blood test|urinalysis|x-ray|ultrasound|checkup)/i,
      /(?:CBC|chemistry panel|heartworm|fecal)/i
    ];

    for (const pattern of testTypePatterns) {
      const testMatch = text.match(pattern);
      if (testMatch) {
        reportData.testType = testMatch[0].replace(/^(test type|examination|report type)[:\s]*/i, '').trim();
        break;
      }
    }

    // Extract veterinarian
    const vetPatterns = [
      /(?:dr\.?|doctor|veterinarian)[:\s]*([a-z\s]+)/i,
      /(?:attending|examined by)[:\s]*([a-z\s]+)/i
    ];

    for (const pattern of vetPatterns) {
      const vetMatch = text.match(pattern);
      if (vetMatch) {
        reportData.veterinarian = vetMatch[1].trim();
        break;
      }
    }

    // Extract clinic/hospital
    const clinicPatterns = [
      /(?:clinic|hospital|veterinary)[:\s]*([^\n\r]+)/i,
      /([a-z\s]+(?:animal hospital|veterinary clinic|vet clinic))/i
    ];

    for (const pattern of clinicPatterns) {
      const clinicMatch = text.match(pattern);
      if (clinicMatch) {
        reportData.clinic = clinicMatch[1].trim();
        break;
      }
    }

    // Extract numerical readings (lab values)
    const readings: Record<string, string> = {};
    const readingPatterns = [
      /([a-z\s]+)[\s:]*(\d+\.?\d*)\s*([a-z\/]+)?/gi,
      /(WBC|RBC|HGB|HCT|PLT|GLU|BUN|CREA|ALT|AST)[\s:]*(\d+\.?\d*)/gi,
      /(white blood cells?|red blood cells?|hemoglobin|hematocrit|platelets?)[\s:]*(\d+\.?\d*)/gi
    ];

    for (const pattern of readingPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const testName = match[1].trim();
        const value = match[2];
        const unit = match[3] || '';
        
        if (testName && value && testName.length > 2) {
          readings[testName] = `${value}${unit ? ' ' + unit : ''}`;
        }
      }
    }

    if (Object.keys(readings).length > 0) {
      reportData.readings = readings;
    }

    // Extract findings and recommendations
    const findingsMatch = text.match(/(?:findings?|results?|impression)[:\s]*([^\n\r]+(?:\n[^\n\r]+)*)/i);
    if (findingsMatch) {
      reportData.findings = findingsMatch[1].split(/[.\n]/).filter(f => f.trim().length > 5);
    }

    const recommendationsMatch = text.match(/(?:recommendations?|treatment|plan)[:\s]*([^\n\r]+(?:\n[^\n\r]+)*)/i);
    if (recommendationsMatch) {
      reportData.recommendations = recommendationsMatch[1].split(/[.\n]/).filter(r => r.trim().length > 5);
    }

    console.log('Extracted medical data:', reportData);
    return reportData;

  } catch (error) {
    console.error('Error extracting medical report data:', error);
    throw new Error(`Medical OCR extraction failed: ${error.message}`);
  }
};

// Medical reference database for common canine health metrics
export const medicalReferenceDatabase = {
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
  },
  vitalSigns: {
    temperature: { normal: [101, 102.5], unit: '°F' },
    heartRate: { normal: [70, 160], unit: 'bpm' },
    respiratoryRate: { normal: [10, 30], unit: 'breaths/min' }
  }
};

export const analyzeMedicalReadings = (readings: Record<string, string>) => {
  const analysis: Array<{
    test: string;
    value: string;
    status: 'normal' | 'high' | 'low' | 'unknown';
    reference: string;
    description: string;
  }> = [];

  Object.entries(readings).forEach(([test, valueStr]) => {
    const normalizedTest = test.toUpperCase().replace(/\s+/g, '');
    const numericValue = parseFloat(valueStr.replace(/[^\d.]/g, ''));
    
    if (isNaN(numericValue)) return;

    const reference = medicalReferenceDatabase.bloodWork[normalizedTest];
    if (reference) {
      let status: 'normal' | 'high' | 'low' = 'normal';
      
      if (numericValue < reference.normal[0]) {
        status = 'low';
      } else if (numericValue > reference.normal[1]) {
        status = 'high';
      }

      analysis.push({
        test: reference.description,
        value: valueStr,
        status,
        reference: `${reference.normal[0]}-${reference.normal[1]} ${reference.unit}`,
        description: reference.description
      });
    }
  });

  return analysis;
};
