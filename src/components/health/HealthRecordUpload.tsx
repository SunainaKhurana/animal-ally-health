
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, FileText, Loader2 } from "lucide-react";
import { useHealthReports } from "@/hooks/useHealthReports";
import { extractHealthReportData } from "@/lib/ocrService";

interface HealthRecordUploadProps {
  petId: string;
  petInfo: {
    name: string;
    type: string;
    breed?: string;
  };
  onUploadComplete?: (reportId: string) => void;
}

const HealthRecordUpload = ({ petId, petInfo, onUploadComplete }: HealthRecordUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const { uploadReport, analyzeReport } = useHealthReports(petId);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress('Processing file...');

    try {
      // Extract data from the image/PDF
      setUploadProgress('Extracting text from file...');
      const reportData = await extractHealthReportData(file);
      
      console.log('Extracted report data:', reportData);

      // Upload the report
      setUploadProgress('Uploading report...');
      const reportId = await uploadReport(file, petId, reportData);

      // Analyze with AI
      setUploadProgress('Analyzing with AI...');
      await analyzeReport(reportId, reportData, petInfo);

      setUploadProgress('Complete!');
      onUploadComplete?.(reportId);
    } catch (error) {
      console.error('Error processing health record:', error);
    } finally {
      setIsProcessing(false);
      setUploadProgress('');
    }
  };

  const handleFileSelection = (accept: string, capture?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) {
      input.setAttribute('capture', capture);
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };
    input.click();
  };

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-600">{uploadProgress}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Health Record
        </CardTitle>
        <CardDescription>
          Upload diagnostic test results, lab reports, or veterinary records for {petInfo.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleFileSelection('image/*', 'environment')}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Take Photo</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleFileSelection('image/*')}
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Upload Image</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleFileSelection('.pdf')}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs">Upload PDF</span>
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Supported formats: JPG, PNG, PDF</p>
          <p>• AI will analyze the report and provide insights</p>
          <p>• Maximum file size: 10MB</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthRecordUpload;
