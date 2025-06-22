
import { useState } from "react";
import { useHealthReports } from "@/hooks/useHealthReports";
import { extractMedicalReportData } from "@/lib/medicalOcrService";
import { useToast } from "@/hooks/use-toast";
import MultipleFileUpload from "./MultipleFileUpload";

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  reportId?: string;
}

interface EnhancedHealthRecordUploadProps {
  petId: string;
  petInfo: {
    name: string;
    type: string;
    breed?: string;
  };
  onUploadComplete?: (reportIds: string[]) => void;
}

const EnhancedHealthRecordUpload = ({ petId, petInfo, onUploadComplete }: EnhancedHealthRecordUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const { uploadReport, analyzeReport } = useHealthReports(petId);
  const { toast } = useToast();

  const updateFileStatus = (id: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  const processFile = async (uploadFile: UploadFile): Promise<string | null> => {
    try {
      updateFileStatus(uploadFile.id, { status: 'processing', progress: 20 });

      // Extract data from the image/PDF with enhanced medical OCR
      console.log('Starting enhanced medical OCR for:', uploadFile.file.name);
      const reportData = await extractMedicalReportData(uploadFile.file);
      
      updateFileStatus(uploadFile.id, { progress: 50 });
      console.log('Enhanced medical OCR completed for:', uploadFile.file.name, reportData);

      // Upload the report
      const reportId = await uploadReport(uploadFile.file, petId, reportData);
      updateFileStatus(uploadFile.id, { progress: 75 });

      // Analyze with AI using medical database
      await analyzeReport(reportId, reportData, petInfo);
      
      updateFileStatus(uploadFile.id, { 
        status: 'completed', 
        progress: 100, 
        reportId 
      });

      return reportId;
    } catch (error) {
      console.error('Error processing file:', uploadFile.file.name, error);
      updateFileStatus(uploadFile.id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0 
      });
      return null;
    }
  };

  const handleFilesProcessed = async (files: UploadFile[]) => {
    setIsProcessing(true);
    setUploadFiles(files);

    try {
      // Process files sequentially to avoid overwhelming the system
      const reportIds: string[] = [];

      for (const file of files) {
        const reportId = await processFile(file);
        if (reportId) {
          reportIds.push(reportId);
        }
        
        // Small delay between files
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const successful = reportIds.length;
      const failed = files.length - successful;

      if (successful > 0) {
        toast({
          title: "Upload Complete! 🎉",
          description: `${successful} medical report${successful !== 1 ? 's' : ''} uploaded and analyzed with medical database integration.${failed > 0 ? ` ${failed} failed.` : ''}`,
          duration: 5000,
        });
        
        onUploadComplete?.(reportIds);
      } else {
        toast({
          title: "Upload Failed",
          description: "All reports failed to process. Please check the files and try again.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing your medical reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MultipleFileUpload
      onFilesProcessed={handleFilesProcessed}
      isProcessing={isProcessing}
      maxFiles={5}
      uploadFiles={uploadFiles}
    />
  );
};

export default EnhancedHealthRecordUpload;
