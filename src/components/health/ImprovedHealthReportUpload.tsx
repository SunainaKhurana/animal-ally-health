
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { healthReportCache } from '@/lib/healthReportCache';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ImprovedHealthReportUploadProps {
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

interface UploadStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const ImprovedHealthReportUpload = ({ petId, petInfo, onUploadComplete }: ImprovedHealthReportUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<string>('Blood Work');
  const [reportDate, setReportDate] = useState<Date>();
  const [reportLabel, setReportLabel] = useState('');
  const [vetDiagnosis, setVetDiagnosis] = useState('');
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initializeUploadSteps = (): UploadStep[] => [
    { id: 'validation', label: 'Validating upload data', status: 'pending' },
    { id: 'storage', label: 'Uploading file to storage', status: 'pending' },
    { id: 'database', label: 'Saving report to database', status: 'pending' },
    { id: 'cache', label: 'Updating local cache', status: 'pending' },
    { id: 'verification', label: 'Verifying upload success', status: 'pending' }
  ];

  const updateStep = (stepId: string, status: UploadStep['status'], error?: string) => {
    setUploadSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, error }
        : step
    ));
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    updateStep('storage', 'processing');
    console.log('🔄 Starting file upload to Supabase Storage');
    
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${petInfo.name.toLowerCase().replace(/\s+/g, '_')}_report_${timestamp}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    console.log('📤 Uploading file to path:', filePath);

    const { data, error } = await supabase.storage
      .from('health-reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      updateStep('storage', 'failed', error.message);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('health-reports')
      .getPublicUrl(filePath);

    console.log('✅ File uploaded successfully. Public URL:', publicUrl);
    updateStep('storage', 'completed');
    return publicUrl;
  };

  const insertReportToDatabase = async (reportData: any): Promise<any> => {
    updateStep('database', 'processing');
    console.log('💾 Inserting report data to database:', reportData);

    const { data: insertedReport, error: insertError } = await supabase
      .from('health_reports')
      .insert(reportData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insertion error:', insertError);
      updateStep('database', 'failed', insertError.message);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log('✅ Report successfully inserted into database:', insertedReport);
    updateStep('database', 'completed');
    return insertedReport;
  };

  const verifyUploadSuccess = async (reportId: string): Promise<boolean> => {
    updateStep('verification', 'processing');
    console.log('🔍 Verifying upload success for report:', reportId);

    try {
      const { data: verificationReport, error } = await supabase
        .from('health_reports')
        .select('id, title, status, image_url')
        .eq('id', reportId)
        .single();

      if (error || !verificationReport) {
        console.error('❌ Verification failed:', error);
        updateStep('verification', 'failed', 'Report not found in database');
        return false;
      }

      console.log('✅ Upload verification successful:', verificationReport);
      updateStep('verification', 'completed');
      return true;
    } catch (error) {
      console.error('❌ Verification error:', error);
      updateStep('verification', 'failed', 'Verification check failed');
      return false;
    }
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
    console.log('📁 File selected:', selectedFile.name, 'Size:', (selectedFile.size / 1024 / 1024).toFixed(2), 'MB');
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

    console.log('🚀 Starting comprehensive upload process...');
    setIsUploading(true);
    setUploadSteps(initializeUploadSteps());

    try {
      // Step 1: Validation
      updateStep('validation', 'processing');
      console.log('✅ Validation passed - all required data present');
      updateStep('validation', 'completed');

      // Step 2: Upload file to Supabase Storage
      const fileUrl = await uploadFileToSupabase(file);

      // Step 3: Get pet data for additional context
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('age, weight, gender')
        .eq('id', petId)
        .single();

      if (petError) {
        console.warn('⚠️ Could not fetch pet data:', petError);
      }

      // Step 4: Create report record in database
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

      const insertedReport = await insertReportToDatabase(reportData);

      // Step 5: Update cache
      updateStep('cache', 'processing');
      healthReportCache.addReportToCache(petId, insertedReport);
      console.log('✅ Local cache updated with new report');
      updateStep('cache', 'completed');

      // Step 6: Verify upload success
      const verified = await verifyUploadSuccess(insertedReport.id);
      
      if (!verified) {
        throw new Error('Upload verification failed');
      }

      // Success!
      toast({
        title: "Report Uploaded Successfully! 🎉",
        description: "Your health report has been saved and is ready for analysis.",
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
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getStepIcon = (status: UploadStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Health Report
        </CardTitle>
        <CardDescription>
          Upload diagnostic reports, lab results, or veterinary documents for {petInfo.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Progress Steps */}
        {isUploading && uploadSteps.length > 0 && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm">Upload Progress</h4>
            {uploadSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                {getStepIcon(step.status)}
                <span className={cn(
                  step.status === 'completed' ? 'text-green-700' : 
                  step.status === 'failed' ? 'text-red-700' :
                  step.status === 'processing' ? 'text-blue-700' :
                  'text-gray-600'
                )}>
                  {step.label}
                </span>
                {step.status === 'processing' && (
                  <Badge variant="outline" className="text-xs">Processing...</Badge>
                )}
                {step.error && (
                  <Badge variant="destructive" className="text-xs">{step.error}</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {file && (
              <div className="text-xs text-gray-600 space-y-1">
                <p>File: {file.name}</p>
                <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>Type: {file.type}</p>
              </div>
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
      </CardContent>
    </Card>
  );
};

export default ImprovedHealthReportUpload;
