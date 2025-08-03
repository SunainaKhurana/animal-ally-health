
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Sparkles, Calendar, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { useHealthReports, HealthReport } from '@/hooks/useHealthReports';
import { healthReportCache } from '@/lib/healthReportCache';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HealthReportUpload from './HealthReportUpload';
import HealthReportDisplay from './HealthReportDisplay';

interface HealthReportsHubProps {
  petId: string;
  petInfo: {
    name: string;
    type: string;
    breed?: string;
  };
}

const HealthReportsHub = ({ petId, petInfo }: HealthReportsHubProps) => {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [processingDiagnosis, setProcessingDiagnosis] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  const { healthReports, loading: dbLoading, refetch } = useHealthReports(petId);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, [petId]);

  const loadReports = async () => {
    console.log('🔄 Loading reports for pet:', petId);
    setLoading(true);
    setLoadingError(null);
    
    try {
      // Step 1: Try to load from cache first for instant display
      const cachedPreviews = healthReportCache.getCachedPreviews(petId);
      console.log('📦 Found cached reports:', cachedPreviews.length);
      
      if (cachedPreviews.length > 0) {
        console.log('✅ Loading reports from cache previews');
        const cachedReports = cachedPreviews.map(preview => ({
          ...preview,
          user_id: '',
          actual_report_date: preview.report_date,
          extracted_text: '',
          key_findings: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })) as HealthReport[];
        setReports(cachedReports);
        setLoading(false);
      }

      // Step 2: Always try to fetch fresh data from Supabase in background
      console.log('🔄 Fetching fresh data from database...');
      await refetch();
      
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      setLoadingError(error instanceof Error ? error.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Update reports when Supabase data changes
  useEffect(() => {
    if (healthReports.length > 0) {
      console.log('✅ Database reports loaded:', healthReports.length);
      setReports(healthReports);
    } else if (!dbLoading && healthReports.length === 0) {
      // If database load is complete and no reports found, check cache one more time
      const cachedPreviews = healthReportCache.getCachedPreviews(petId);
      if (cachedPreviews.length === 0) {
        console.log('📭 No reports found in database or cache');
        setReports([]);
      }
    }
  }, [healthReports, dbLoading, petId]);

  const handleUploadComplete = (reportId: string) => {
    console.log('✅ Upload completed for report:', reportId);
    setShowUpload(false);
    
    // Immediately refresh the reports list
    loadReports();
    
    toast({
      title: "Report Uploaded Successfully! 🎉",
      description: "Your health report has been saved and is ready for analysis.",
    });
  };

  const handleGetAIAnalysis = async (reportId: string) => {
    console.log('🤖 Starting AI analysis for report:', reportId);
    setProcessingDiagnosis(reportId);
    
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Trigger Make.com webhook for AI analysis
      const payload = {
        report_id: reportId,
        pet_id: petId,
        user_id: report.user_id,
        pet_name: petInfo.name,
        pet_type: petInfo.type,
        pet_breed: petInfo.breed,
        report_url: report.image_url,
        report_type: report.report_type,
        report_date: report.report_date
      };

      console.log('📤 Sending AI analysis request:', payload);

      const response = await fetch('https://hook.eu2.make.com/ohpjbbdx10uxe4jowe72jsaz9tvf6znc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ AI analysis request sent successfully');

      toast({
        title: "AI Analysis Started! 🧠",
        description: "Analysis has been requested. You'll be notified when it's complete.",
      });

      // Update report status to processing
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'processing' as const } : r
      ));

      // Update cache
      healthReportCache.cacheReportPreview(petId, {
        id: reportId,
        status: 'processing'
      });

    } catch (error) {
      console.error('❌ Error requesting AI analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to request AI analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingDiagnosis(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading health reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Health Reports</h2>
          <p className="text-sm text-gray-600">
            {reports.length} {reports.length === 1 ? 'report' : 'reports'} uploaded
          </p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Upload Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Health Report</DialogTitle>
            </DialogHeader>
            <HealthReportUpload
              petId={petId}
              petInfo={petInfo}
              onUploadComplete={handleUploadComplete}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading Error */}
      {loadingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error loading reports:</strong> {loadingError}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadReports}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No health reports yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload your first diagnostic report to get started
            </p>
            <Button 
              onClick={() => setShowUpload(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {report.report_label || report.title || report.report_type}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {report.report_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.actual_report_date || report.report_date)}
                      </div>
                      {report.vet_diagnosis && (
                        <Badge variant="secondary" className="text-xs">
                          Vet Diagnosed
                        </Badge>
                      )}
                    </div>

                    {/* AI Analysis Status */}
                    <div className="flex items-center gap-2 mb-3">
                      {report.ai_analysis ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Analysis Complete
                          </Badge>
                          <span className="text-xs text-gray-500">
                            on {formatDate(report.updated_at || report.created_at)}
                          </span>
                        </div>
                      ) : report.status === 'processing' ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGetAIAnalysis(report.id)}
                          disabled={processingDiagnosis === report.id}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {processingDiagnosis === report.id ? 'Analyzing...' : 'Get AI Analysis'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {report.report_label || report.title || report.report_type}
                          </DialogTitle>
                        </DialogHeader>
                        <HealthReportDisplay 
                          report={report}
                          onAskAI={() => handleGetAIAnalysis(report.id)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Report Preview Image */}
                {report.image_url && (
                  <div className="mt-3">
                    <img 
                      src={report.image_url}
                      alt={report.title || 'Health Report'}
                      className="w-full h-32 object-cover rounded-md border"
                      onError={(e) => {
                        console.error('Error loading report image:', report.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthReportsHub;
