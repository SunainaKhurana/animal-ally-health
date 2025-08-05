
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Sparkles, Calendar, Eye, AlertCircle, Loader2, Brain } from 'lucide-react';
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
  const [showUpload, setShowUpload] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [processingReports, setProcessingReports] = useState<Set<string>>(new Set());
  
  const { healthReports, loading, addReportToState, triggerAIAnalysis, refetch } = useHealthReports(petId);
  const { toast } = useToast();

  const handleUploadComplete = async (reportId: string, reportData: any) => {
    console.log('✅ Upload completed for report:', reportId, reportData);
    
    // Create a complete HealthReport object
    const newReport: HealthReport = {
      id: reportId,
      pet_id: petId,
      user_id: reportData.user_id || '',
      title: reportData.title || reportData.report_type,
      report_type: reportData.report_type,
      report_date: reportData.report_date,
      actual_report_date: reportData.report_date,
      status: 'completed',
      image_url: reportData.image_url,
      report_label: reportData.report_label,
      vet_diagnosis: reportData.vet_diagnosis,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      extracted_text: '',
      key_findings: '',
      ai_analysis: undefined,
      parent_report_id: undefined
    };
    
    // Add to state and cache immediately
    addReportToState(newReport);
    
    setShowUpload(false);
    
    toast({
      title: "Report Uploaded Successfully! 🎉",
      description: "Your health report has been saved and is ready for analysis.",
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
            {healthReports.length} {healthReports.length === 1 ? 'report' : 'reports'} uploaded
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

      {/* Reports List */}
      {healthReports.length === 0 ? (
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
          {healthReports.map((report) => (
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

export default HealthReportsHub;
