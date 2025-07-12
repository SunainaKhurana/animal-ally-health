
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Camera, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePetContext } from '@/contexts/PetContext';
import { useAuth } from '@/contexts/AuthContext';

interface DirectHealthReportUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DirectHealthReportUpload = ({ open, onOpenChange }: DirectHealthReportUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { selectedPet } = usePetContext();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image (JPG, PNG) or PDF file",
          variant: "destructive",
        });
        return;
      }

      if (selectedFile.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSubmit = async () => {
    if (!file || !reportType || !selectedPet || !user) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const base64Data = await convertFileToBase64(file);

      // Calculate pet age from dateOfBirth
      const petAge = calculateAge(selectedPet.dateOfBirth);

      // Prepare webhook payload
      const webhookPayload = {
        pet_id: selectedPet.id,
        user_id: user.id,
        report_type: reportType,
        report_date: reportDate,
        file_data: base64Data,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        pet_name: selectedPet.name,
        pet_breed: selectedPet.breed,
        pet_age: petAge,
        timestamp: new Date().toISOString()
      };

      console.log('Sending health report to Make.com webhook:', {
        pet_id: webhookPayload.pet_id,
        report_type: webhookPayload.report_type,
        file_name: webhookPayload.file_name,
        file_size: webhookPayload.file_size
      });

      // Send to Make.com webhook
      const response = await fetch('https://hook.eu2.make.com/ohpjbbdx10uxe4jowe72jsaz9tvf6znc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      // Success toast
      toast({
        title: "Report uploaded!",
        description: "Your health report is being processed and will appear shortly.",
      });

      // Reset form and close dialog
      setFile(null);
      setReportType('');
      setReportDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);

    } catch (error) {
      console.error('Error uploading health report:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload health report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Health Report
          </DialogTitle>
          <DialogDescription>
            Upload a health report for {selectedPet?.name}. The report will be processed and analyzed automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Health Report File *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                {file ? (
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-sm font-medium text-green-600">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex justify-center space-x-4 mb-2">
                      <Camera className="h-8 w-8 text-gray-400" />
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Click to upload image or PDF
                    </p>
                    <p className="text-xs text-gray-400">
                      Max 10MB • JPG, PNG, PDF
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type *</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Blood Work">Blood Work</SelectItem>
                <SelectItem value="Urine Test">Urine Test</SelectItem>
                <SelectItem value="X-Ray">X-Ray</SelectItem>
                <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                <SelectItem value="General Checkup">General Checkup</SelectItem>
                <SelectItem value="Vaccination Record">Vaccination Record</SelectItem>
                <SelectItem value="Specialist Report">Specialist Report</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Date */}
          <div className="space-y-2">
            <Label htmlFor="report-date">Report Date *</Label>
            <Input
              id="report-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!file || !reportType || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectHealthReportUpload;
