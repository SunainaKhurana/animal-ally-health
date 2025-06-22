
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, FileText, Loader2, CheckCircle } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { extractMedicalReportData } from "@/lib/medicalOcrService";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionUploadProps {
  petId: string;
  petInfo: {
    name: string;
    type: string;
    breed?: string;
  };
  onUploadComplete?: (prescriptionId: string) => void;
}

const PrescriptionUpload = ({ petId, petInfo, onUploadComplete }: PrescriptionUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { uploadPrescription } = usePrescriptions(petId);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setIsComplete(false);
    setUploadProgress('Processing prescription...');

    try {
      // Extract data from the image/PDF
      setUploadProgress('Extracting text from prescription...');
      const prescriptionData = await extractMedicalReportData(file);
      
      console.log('Extracted prescription data:', prescriptionData);

      // Upload the prescription
      setUploadProgress('Uploading prescription...');
      const prescriptionId = await uploadPrescription(file, petId, {
        title: prescriptionData.testType || 'Prescription',
        prescribedDate: prescriptionData.reportDate || new Date().toISOString().split('T')[0],
        medications: prescriptionData.medications || []
      });

      setUploadProgress('Upload complete!');
      setIsComplete(true);
      
      toast({
        title: "Success!",
        description: "Prescription uploaded successfully.",
        duration: 5000,
      });

      // Auto-close after a brief delay
      setTimeout(() => {
        onUploadComplete?.(prescriptionId);
        setIsProcessing(false);
        setUploadProgress('');
        setIsComplete(false);
      }, 2000);

    } catch (error) {
      console.error('Error processing prescription:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error processing your prescription. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setUploadProgress('');
      setIsComplete(false);
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
            {isComplete ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            )}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">{uploadProgress}</p>
              {isComplete && (
                <p className="text-xs text-green-600">Prescription saved successfully!</p>
              )}
            </div>
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
          Upload Prescription
        </CardTitle>
        <CardDescription>
          Upload prescription documents for {petInfo.name}
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
          <p>• AI will analyze prescriptions and extract medication details</p>
          <p>• Maximum file size: 10MB</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionUpload;
