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

export const extractMedicalReportData = async (file: File): Promise<any> => {
  try {
    console.log('Starting enhanced medical OCR processing...');
    
    // Use Tesseract for OCR
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => console.log('OCR Progress:', m)
    });
    
    console.log('Raw OCR text:', text);
    
    // Enhanced parsing for medical reports
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract report date (look for various date formats)
    let reportDate = null;
    let actualDate = null;
    const datePatterns = [
      /(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/g,
      /(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/g,
      /(\w+\s+\d{1,2},?\s+\d{4})/g,
      /(\d{1,2}\s+\w+\s+\d{4})/g
    ];
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const matches = line.match(pattern);
        if (matches) {
          const dateStr = matches[0];
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime()) && parsedDate > new Date('2000-01-01')) {
            actualDate = parsedDate.toISOString().split('T')[0];
            reportDate = actualDate;
            break;
          }
        }
      }
      if (actualDate) break;
    }
    
    // Extract test type
    let testType = 'Health Report';
    const testTypeKeywords = [
      'blood test', 'blood work', 'chemistry panel', 'cbc', 'complete blood count',
      'urinalysis', 'urine test', 'fecal exam', 'heartworm test', 'vaccination',
      'x-ray', 'radiograph', 'ultrasound', 'biopsy', 'allergy test',
      'electrolyte', 'liver panel', 'kidney function', 'thyroid'
    ];
    
    const textLower = text.toLowerCase();
    for (const keyword of testTypeKeywords) {
      if (textLower.includes(keyword)) {
        testType = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }
    
    // Enhanced electrolyte extraction for Addison's disease detection
    const electrolytes = extractElectrolytes(text);
    const abnormalValues = extractAbnormalValues(text);
    const medications = extractMedications(text);
    
    console.log('Extracted data:', {
      testType,
      reportDate,
      actualDate,
      electrolytes,
      abnormalValues,
      medications
    });
    
    return {
      testType,
      reportType: testType,
      reportDate,
      actualDate,
      extractedText: text,
      electrolytes,
      abnormalValues,
      medications,
      rawData: {
        lines,
        fullText: text
      }
    };
  } catch (error) {
    console.error('Enhanced medical OCR error:', error);
    throw new Error('Failed to process medical report with enhanced OCR');
  }
};

const extractElectrolytes = (text: string): any => {
  const electrolytes: any = {};
  const electrolytePatterns = {
    sodium: /sodium[:\s]*(\d+(?:\.\d+)?)/gi,
    potassium: /potassium[:\s]*(\d+(?:\.\d+)?)/gi,
    chloride: /chloride[:\s]*(\d+(?:\.\d+)?)/gi,
    co2: /co2[:\s]*(\d+(?:\.\d+)?)/gi,
    bun: /bun[:\s]*(\d+(?:\.\d+)?)/gi,
    creatinine: /creatinine[:\s]*(\d+(?:\.\d+)?)/gi,
    glucose: /glucose[:\s]*(\d+(?:\.\d+)?)/gi
  };
  
  for (const [name, pattern] of Object.entries(electrolytePatterns)) {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      electrolytes[name] = {
        value: parseFloat(matches[1]),
        unit: extractUnit(text, matches[0])
      };
    }
  }
  
  return electrolytes;
};

const extractAbnormalValues = (text: string): string[] => {
  const abnormalIndicators = ['high', 'low', 'elevated', 'decreased', 'abnormal', '*', 'H', 'L'];
  const lines = text.split('\n');
  const abnormalValues: string[] = [];
  
  for (const line of lines) {
    for (const indicator of abnormalIndicators) {
      if (line.toLowerCase().includes(indicator.toLowerCase())) {
        abnormalValues.push(line.trim());
        break;
      }
    }
  }
  
  return abnormalValues;
};

const extractMedications = (text: string): any[] => {
  const medications: any[] = [];
  const medicationKeywords = [
    'prednisone', 'fludrocortisone', 'florinef', 'insulin', 'thyroid',
    'metacam', 'rimadyl', 'gabapentin', 'tramadol', 'antibiotics'
  ];
  
  const lines = text.split('\n');
  for (const line of lines) {
    for (const med of medicationKeywords) {
      if (line.toLowerCase().includes(med)) {
        medications.push({
          name: med,
          details: line.trim()
        });
      }
    }
  }
  
  return medications;
};

const extractUnit = (text: string, context: string): string => {
  const unitPatterns = ['mg/dl', 'mmol/l', 'meq/l', 'g/dl', '%'];
  const contextIndex = text.toLowerCase().indexOf(context.toLowerCase());
  const surrounding = text.slice(Math.max(0, contextIndex - 50), contextIndex + 100);
  
  for (const unit of unitPatterns) {
    if (surrounding.toLowerCase().includes(unit)) {
      return unit;
    }
  }
  
  return '';
};

export const analyzeMedicalReadings = (readings: Record<string, string>) => {
  const analysis: Array<{
    test: string;
    value: string;
    status: 'normal' | 'high' | 'low' | 'unknown';
    reference: string;
    description: string;
    significance?: string;
  }> = [];

  Object.entries(readings).forEach(([test, valueStr]) => {
    const normalizedTest = test.toUpperCase().replace(/\s+/g, '');
    const numericValue = parseFloat(valueStr.replace(/[^\d.]/g, ''));
    
    if (isNaN(numericValue)) return;

    const reference = medicalReferenceDatabase.bloodWork[normalizedTest];
    if (reference) {
      let status: 'normal' | 'high' | 'low' = 'normal';
      let significance = '';
      
      if (numericValue < reference.normal[0]) {
        status = 'low';
        if (normalizedTest === 'SODIUM' && numericValue < 140) {
          significance = 'Low sodium may indicate Addison\'s disease, especially if combined with high potassium.';
        }
      } else if (numericValue > reference.normal[1]) {
        status = 'high';
        if (normalizedTest === 'POTASSIUM' && numericValue > 5.8) {
          significance = 'High potassium may indicate Addison\'s disease, especially if combined with low sodium.';
        }
      }

      analysis.push({
        test: reference.description,
        value: valueStr,
        status,
        reference: `${reference.normal[0]}-${reference.normal[1]} ${reference.unit}`,
        description: reference.description,
        significance
      });
    }
  });

  return analysis;
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
    AST: { normal: [0, 50], unit: 'U/L', description: 'Aspartate Aminotransferase' },
    // Electrolytes - critical for Addison's disease detection
    SODIUM: { normal: [140, 155], unit: 'mEq/L', description: 'Sodium' },
    POTASSIUM: { normal: [3.5, 5.8], unit: 'mEq/L', description: 'Potassium' },
    CHLORIDE: { normal: [105, 115], unit: 'mEq/L', description: 'Chloride' },
    // Additional markers
    PROTEIN: { normal: [5.2, 8.2], unit: 'g/dL', description: 'Total Protein' },
    ALBUMIN: { normal: [2.3, 4.0], unit: 'g/dL', description: 'Albumin' }
  },
  vitalSigns: {
    temperature: { normal: [101, 102.5], unit: '°F' },
    heartRate: { normal: [70, 160], unit: 'bpm' },
    respiratoryRate: { normal: [10, 30], unit: 'breaths/min' }
  }
};
