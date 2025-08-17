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
import { calculateAge } from '@/lib/dateUtils';

interface HealthReportUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
  petId?: string; // Add petId prop to ensure correct pet association
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

const HealthReportUploadDialog = ({ open, onOpenChange, onUploadSuccess, petId }: HealthReportUploadDialogProps) => {
  const { selectedPet, pets } = usePetContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<string>('');
  const [reportDate, setReportDate] = useState<Date>();
  const [reportLabel, setReportLabel] = useState('');
  const [vetDiagnosis, setVetDiagnosis] = useState('');

  // Use petId from props if provided, otherwise fall back to selectedPet
  const targetPet = petId ? pets.find(p => p.id === petId) : selectedPet;

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

  const insertHealthReport = async (reportData: any): Promise<string> => {
    console.log('📝 Creating health report record in database:', reportData);

    const { data: insertedReport, error } = await supabase
      .from('health_reports')
      .insert(reportData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Database insertion error:', error);
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log('✅ Health report record created with ID:', insertedReport.id);
    return insertedReport.id;
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
    
    if (!targetPet || !user || !file || !reportType || !reportDate) {
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
      console.log('🚀 Starting enhanced upload process for pet:', { id: targetPet.id, name: targetPet.name });
      
      // Step 1: Upload file to Supabase Storage
      const fileUrl = await uploadFileToSupabase(file);
      
      // Step 2: Create database record first to get the ID
      const title = reportLabel || `${reportType} - ${format(reportDate, 'MMM dd, yyyy')}`;
      
      const reportData = {
        pet_id: targetPet.id,
        user_id: user.id,
        title: title,
        report_type: reportType,
        report_date: format(reportDate, 'yyyy-MM-dd'),
        actual_report_date: format(reportDate, 'yyyy-MM-dd'),
        status: 'processing',
        image_url: fileUrl,
        report_label: reportLabel || null,
        vet_diagnosis: vetDiagnosis || null
      };

      const healthReportId = await insertHealthReport(reportData);
      
      // Step 3: Send complete payload to Make.com webhook with the health report ID
      const payload = {
        health_report_id: healthReportId, // Include the database record ID
        pet_id: targetPet.id,
        user_id: user.id,
        title: title,
        report_type: reportType,
        report_date: format(reportDate, 'yyyy-MM-dd'),
        actual_report_date: format(reportDate, 'yyyy-MM-dd'),
        status: 'processing',
        image_url: fileUrl,
        report_label: reportLabel || null,
        vet_diagnosis: vetDiagnosis || null,
        file_url: fileUrl,
        report_url: fileUrl,
        pet_name: targetPet.name,
        pet_breed: targetPet.breed,
        pet_age: calculateAge(targetPet.dateOfBirth),
        pet_type: targetPet.type,
        pet_gender: targetPet.gender,
        pet_weight: targetPet.weight,
        pre_existing_conditions: targetPet.preExistingConditions || []
      };

      console.log('📤 Sending enhanced payload to Make.com webhook with health_report_id:', payload);

      const response = await fetch('https://hook.eu2.make.com/ohpjbbdx10uxe4jowe72jsaz9tvf6znc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('⚠️ Make.com webhook failed, but database record exists:', response.status);
        // Don't throw error here - the record is already created and visible to user
      } else {
        console.log('✅ Webhook call successful');
      }

      toast({
        title: "Report uploaded successfully!",
        description: `Your health report for ${targetPet.name} has been uploaded and AI analysis is processing.`,
      });

      resetForm();
      onUploadSuccess?.();
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!targetPet) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No Pet Selected</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please select a pet to upload health reports.
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Health Report</DialogTitle>
          <p className="text-sm text-muted-foreground">For {targetPet.name}</p>
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
