
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { healthReportCache } from '@/lib/healthReportCache';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HealthReportUploadProps {
  petId: string;
  petInfo: {
    name: string;
    type: string;
    breed?: string;
  };
  onUploadComplete?: (reportId: string) => void;
}

const REPORT_TYPES = [
  'Blood Work',
  'Urinalysis', 
  'X-Ray',
  'Ultrasound',
  'CBC',
  'Chemistry Panel',
  'Thyroid Panel',
  'Allergy Test',
  'Fecal Exam',
  'Heartworm Test',
  'Other'
];

const HealthReportUpload = ({ petId, petInfo, onUploadComplete }: HealthReportUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<string>('Blood Work');
  const [reportDate, setReportDate] = useState<Date>();
  const [reportLabel, setReportLabel] = useState('');
  const [vetDiagnosis, setVetDiagnosis] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    setUploadStep('Uploading file to storage...');
    console.log('Starting file upload to Supabase Storage');
    
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${petInfo.name.toLowerCase()}_report_${timestamp}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    console.log('Uploading file to Supabase Storage:', filePath);

    const { data, error } = await supabase.storage
      .from('health-reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('health-reports')
      .getPublicUrl(filePath);

    console.log('File uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const fileType = selectedFile.type;
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPG, PNG, or PDF file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!petInfo || !user || !file || !reportType || !reportDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadStep('Starting upload...');

    try {
      // Step 1: Upload file to Supabase Storage
      const fileUrl = await uploadFileToSupabase(file);
      console.log('✅ File upload completed, URL:', fileUrl);
      
      // Step 2: Get pet data for additional context
      setUploadStep('Getting pet information...');
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('age, weight, gender')
        .eq('id', petId)
        .single();

      if (petError) {
        console.error('Error fetching pet data:', petError);
        // Continue without pet data
      }

      // Step 3: Create report record in Supabase
      setUploadStep('Saving report to database...');
      const reportId = crypto.randomUUID();
      
      const reportData = {
        id: reportId,
        pet_id: petId,
        user_id: user.id,
        title: reportLabel || `${reportType} - ${format(reportDate, 'MMM dd, yyyy')}`,
        report_type: reportType,
        report_date: format(reportDate, 'yyyy-MM-dd'),
        actual_report_date: format(reportDate, 'yyyy-MM-dd'),
        report_label: reportLabel || null,
        vet_diagnosis: vetDiagnosis || null,
        image_url: fileUrl,
        status: 'processing' as const
      };

      console.log('Inserting report data:', reportData);

      const { data: insertedReport, error: insertError } = await supabase
        .from('health_reports')
        .insert(reportData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Database insertion error:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log('✅ Report successfully inserted into database:', insertedReport);

      // Step 4: Cache the report immediately for instant display
      setUploadStep('Caching report locally...');
      healthReportCache.cacheReportPreview(petId, {
        id: insertedReport.id,
        title: insertedReport.title,
        report_type: insertedReport.report_type,
        report_date: insertedReport.report_date,
        report_label: insertedReport.report_label,
        vet_diagnosis: insertedReport.vet_diagnosis,
        image_url: insertedReport.image_url,
        status: 'processing'
      });

      console.log('✅ Report cached locally');

      // Step 5: Prepare webhook payload for future AI analysis
      setUploadStep('Preparing AI analysis...');
      const webhookPayload = {
        pet_id: petId,
        user_id: user.id,
        report_id: insertedReport.id,
        report_type: reportType,
        report_date: format(reportDate, 'yyyy-MM-dd'),
        report_label: reportLabel || null,
        vet_diagnosis: vetDiagnosis || null,
        file_url: fileUrl,
        pet_name: petInfo.name,
        pet_breed: petInfo.breed,
        pet_age: petData?.age || 0,
        pet_gender: petData?.gender || 'unknown',
        pet_weight: petData?.weight || 0
      };

      console.log('✅ Webhook payload prepared:', webhookPayload);

      toast({
        title: "Report uploaded successfully!",
        description: "Your health report has been saved. Tap 'Get AI Analysis' to analyze it.",
      });

      // Reset form
      setFile(null);
      setReportType('Blood Work');
      setReportDate(undefined);
      setReportLabel('');
      setVetDiagnosis('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadComplete) {
        onUploadComplete(insertedReport.id);
      }
      
    } catch (error) {
      console.error('❌ Upload process failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setUploadError(errorMessage);
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Upload Failed:</strong> {uploadError}
            <br />
            <small>Last step: {uploadStep}</small>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Step Display */}
      {isUploading && uploadStep && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{uploadStep}</AlertDescription>
        </Alert>
      )}

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="file-upload">Report File *</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileUpload}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {file ? `Selected: ${file.name}` : 'Choose File (Image or PDF)'}
          </Button>
        </div>
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
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Report Label */}
      <div className="space-y-2">
        <Label htmlFor="report-label">Report Label (Optional)</Label>
        <Input
          id="report-label"
          placeholder="e.g., Annual Checkup, Pre-Surgery..."
          value={reportLabel}
          onChange={(e) => setReportLabel(e.target.value)}
          disabled={isUploading}
        />
      </div>

      {/* Vet's Diagnosis */}
      <div className="space-y-2">
        <Label htmlFor="vet-diagnosis">Vet's Diagnosis (Optional)</Label>
        <Textarea
          id="vet-diagnosis"
          placeholder="Enter any diagnosis or notes from your veterinarian..."
          value={vetDiagnosis}
          onChange={(e) => setVetDiagnosis(e.target.value)}
          disabled={isUploading}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600"
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
    </form>
  );
};

export default HealthReportUpload;
