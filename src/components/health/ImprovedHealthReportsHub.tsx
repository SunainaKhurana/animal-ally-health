import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Sparkles, Calendar, Eye, AlertCircle, Loader2, Brain, RefreshCw } from 'lucide-react';
import { useHealthReports, HealthReport } from '@/hooks/useHealthReports';
import { healthReportCache } from '@/lib/healthReportCache';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImprovedHealthReportUpload from './ImprovedHealthReportUpload';
import HealthReportDisplay from './HealthReportDisplay';

interface ImprovedHealthReportsHubProps {
  petId: string;
  petInfo: {
    name: string;
    type: string;
    breed?: string;
  };
}

const ImprovedHealthReportsHub = ({ petId, petInfo }: ImprovedHealthReportsHubProps) => {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [processingReports, setProcessingReports] = useState<Set<string>>(new Set());
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const { healthReports, loading, addReportToState, triggerAIAnalysis, refetch } = useHealthReports(petId);
  const { toast } = useToast();

  // Debug effect to monitor cache and reports state
  useEffect(() => {
    const debug = {
      timestamp: new Date().toISOString(),
      petId,
      reportsCount: healthReports.length,
      loading,
      hasCache: healthReportCache.hasReports(petId),
      cachedReports: healthReportCache.get(petId)?.length || 0,
      cachedPreviews: healthReportCache.getCachedPreviews(petId).length,
      reports: healthReports.map(r => ({
        id: r.id,
        title: r.title,
        status: r.status,
        created_at: r.created_at
      }))
    };
    
    console.log('🔍 HealthReportsHub Debug Info:', debug);
    setDebugInfo(debug);
  }, [petId, healthReports, loading]);

  const handleUploadComplete = async (reportId: string) => {
    console.log('✅ Upload completed for report:', reportId);
    
    setShowUpload(false);
    
    toast({
      title: "Report Uploaded Successfully! 🎉",
      description: "Your health report has been saved and cached locally.",
    });
  };

  const handleGetAIAnalysis = async (reportId: string) => {
    console.log('🤖 Starting AI analysis for report:', reportId);
    
    setProcessingReports(prev => new Set(prev).add(reportId));
    
    try {
      await triggerAIAnalysis(reportId);
    } catch (error) {
      console.error('❌ Failed to trigger AI analysis:', error);
    } finally {
      setProcessingReports(prev => {
        const updated = new Set(prev);
        updated.delete(reportId);
        return updated;
      });
    }
  };

  const handleForceRefresh = async () => {
    console.log('🔄 Force refreshing reports...');
    try {
      await refetch();
      toast({
        title: "Refreshed",
        description: "Health reports have been refreshed from the server.",
      });
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh reports. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAnalysisStatus = (report: HealthReport) => {
    if (processingReports.has(report.id) || report.status === 'processing') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing...
        </Badge>
      );
    }
    
    if (report.ai_analysis) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Analysis Complete
        </Badge>
      );
    }
    
    return null;
  };

  const getAnalysisButton = (report: HealthReport) => {
    const isProcessing = processingReports.has(report.id) || report.status === 'processing';
    
    if (report.ai_analysis) {
      return (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI Diagnosis on {formatDate(report.updated_at)}
        </div>
      );
    }
    
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleGetAIAnalysis(report.id)}
        disabled={isProcessing}
        className="text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Brain className="h-3 w-3 mr-1" />
        {isProcessing ? 'Analyzing...' : 'Get AI Analysis'}
      </Button>
    );
  };

  if (loading && healthReports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-orange-500" />
          <p className="text-gray-600">Loading health reports...</p>
          <p className="text-xs text-gray-500 mt-2">
            Cache has {healthReportCache.hasReports(petId) ? 'data' : 'no data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - Show in development */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <details className="text-xs">
              <summary>Debug Info (Dev Mode)</summary>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Upload and Refresh Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Health Reports</h2>
          <p className="text-sm text-gray-600">
            {healthReports.length} {healthReports.length === 1 ? 'report' : 'reports'} for {petInfo.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceRefresh}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Upload Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Health Report for {petInfo.name}</DialogTitle>
              </DialogHeader>
              <ImprovedHealthReportUpload
                petId={petId}
                petInfo={petInfo}
                onUploadComplete={handleUploadComplete}
                addReportToState={addReportToState}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reports List */}
      {healthReports.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No health reports yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload {petInfo.name}'s first diagnostic report to get started
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
          {healthReports
            .sort((a, b) => new Date(b.actual_report_date || b.report_date).getTime() - new Date(a.actual_report_date || a.report_date).getTime())
            .map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                      {getAnalysisStatus(report)}
                      {report.ai_analysis && (
                        <span className="text-xs text-gray-500">
                          on {formatDate(report.updated_at)}
                        </span>
                      )}
                    </div>
                    
                    {/* Analysis Button/Status */}
                    <div className="mb-3">
                      {getAnalysisButton(report)}
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

export default ImprovedHealthReportsHub;
