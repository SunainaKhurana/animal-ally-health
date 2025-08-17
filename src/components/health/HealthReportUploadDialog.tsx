
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePetContext } from '@/contexts/PetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HealthReportUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

const REPORT_TYPES = [
  'Blood Work',
  'CBC',
  'KFT',
  'LFT', 
  'X-Ray',
  'Ultrasound',
  'Urinalysis',
  'Thyroid Panel',
  'Allergy Test',
  'Fecal Exam',
  'Heartworm Test',
  'Other'
];

const HealthReportUploadDialog = ({ open, onOpenChange, onUploadSuccess }: HealthReportUploadDialogProps) => {
  const { selectedPet } = usePetContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<string>('');
  const [reportDate, setReportDate] = useState<Date>();
  const [reportLabel, setReportLabel] = useState('');
  const [vetDiagnosis, setVetDiagnosis] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an image or PDF file.",
          variant: "destructive",
        });
      }
    }
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Uploading file to Supabase Storage:', filePath);

    const { data, error } = await supabase.storage
      .from('health-reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('health-reports')
      .getPublicUrl(filePath);

    console.log('File uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  };

  const createHealthReportRecord = async (fileUrl: string): Promise<string> => {
    if (!selectedPet || !user || !reportDate) {
      throw new Error('Missing required data for creating health report');
    }

    const title = reportLabel || `${reportType} - ${format(reportDate, 'MMM dd, yyyy')}`;
    
    console.log('Creating health report record in database...');
    
    const { data, error } = await supabase
      .from('health_reports')
      .insert({
        pet_id: selectedPet.id,
        user_id: user.id,
        title: title,
        report_type: reportType,
        report_date: format(reportDate, 'yyyy-MM-dd'),
        actual_report_date: format(reportDate, 'yyyy-MM-dd'),
        status: 'processing',
        image_url: fileUrl,
        report_label: reportLabel || null,
        vet_diagnosis: vetDiagnosis || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Failed to create health report: ${error.message}`);
    }

    console.log('Health report record created:', data.id);
    return data.id;
  };

  const triggerAIAnalysis = async (reportId: string, fileUrl: string) => {
    try {
      const calculateAge = (dateOfBirth: Date): number => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      };

      const payload = {
        report_id: reportId,
        pet_id: selectedPet!.id,
        user_id: user!.id,
        report_type: reportType,
        report_date: format(reportDate!, 'yyyy-MM-dd'),
        report_label: reportLabel || null,
        vet_diagnosis: vetDiagnosis || null,
        file_url: fileUrl,
        pet_name: selectedPet!.name,
        pet_breed: selectedPet!.breed,
        pet_age: calculateAge(selectedPet!.dateOfBirth)
      };

      console.log('Triggering AI analysis via webhook...');

      await fetch('https://hook.eu2.make.com/ohpjbbdx10uxe4jowe72jsaz9tvf6znc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('AI analysis webhook triggered successfully');
    } catch (error) {
      console.warn('AI analysis webhook failed, but report was created:', error);
      // Don't throw error here as the report was successfully created
    }
  };

  const resetForm = () => {
    setFile(null);
    setReportType('');
    setReportDate(undefined);
    setReportLabel('');
    setVetDiagnosis('');
    
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPet || !user || !file || !reportType || !reportDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    if (isUploading) return;

    setIsUploading(true);

    try {
      // Step 1: Upload file to Supabase Storage
      const fileUrl = await uploadFileToSupabase(file);
      
      // Step 2: Create health report record in database
      const reportId = await createHealthReportRecord(fileUrl);
      
      // Step 3: Trigger AI analysis (non-blocking)
      triggerAIAnalysis(reportId, fileUrl);

      toast({
        title: "Report uploaded successfully!",
        description: "Your health report has been uploaded and AI analysis is processing.",
      });

      resetForm();
      onUploadSuccess?.();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your report. Please try again.",
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
          <DialogTitle>Upload Health Report</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Report File *</Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium"
            />
            {file && (
              <p className="text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type *</Label>
            <Select value={reportType} onValueChange={setReportType} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Date */}
          <div className="space-y-2">
            <Label>Report Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isUploading}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !reportDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reportDate ? format(reportDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reportDate}
                  onSelect={setReportDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Report Label */}
          <div className="space-y-2">
            <Label htmlFor="report-label">Report Label (Optional)</Label>
            <Input
              id="report-label"
              placeholder="e.g., Cortisol, Annual Checkup..."
              value={reportLabel}
              onChange={(e) => setReportLabel(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Vet Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="vet-diagnosis">Vet's Diagnosis (Optional)</Label>
            <Textarea
              id="vet-diagnosis"
              placeholder="Enter your vet's diagnosis or notes..."
              value={vetDiagnosis}
              onChange={(e) => setVetDiagnosis(e.target.value)}
              disabled={isUploading}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isUploading || !file || !reportType || !reportDate}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HealthReportUploadDialog;
