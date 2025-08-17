
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, FileText, Calendar, Brain, Eye, Loader2, Plus, Filter } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useHealthReports } from '@/hooks/useHealthReports';
import HealthReportCard from '@/components/health/HealthReportCard';
import ImprovedHealthReportUpload from '@/components/health/ImprovedHealthReportUpload';

const HealthReportsPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePetContext();
  const { healthReports, loading, refetch, addReportToState, triggerAIAnalysis } = useHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [processingReports, setProcessingReports] = useState(new Set());

  const pet = pets.find(p => p.id === petId);

  console.log('HealthReportsPage Debug:', {
    petId,
    pet: pet ? { id: pet.id, name: pet.name } : null,
    reportsCount: healthReports.length,
    loading,
    selectedReport: selectedReport ? selectedReport.id : null
  });

  if (!pet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-semibold mb-4">Pet not found</h2>
          <Button onClick={() => navigate('/care')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Care
          </Button>
        </div>
      </div>
    );
  }

  const handleUploadComplete = (reportId: string) => {
    console.log('✅ Upload completed for report:', reportId);
    setShowUpload(false);
    refetch();
  };

  const handleAIAnalysis = async (reportId: string) => {
    console.log('🤖 Starting AI analysis for report:', reportId);
    setProcessingReports(prev => new Set(prev).add(reportId));
    try {
      await triggerAIAnalysis(reportId);
    } catch (error) {
      console.error('❌ AI Analysis failed:', error);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (report: any) => {
    if (report.ai_analysis) {
      return <Badge className="bg-green-100 text-green-800 text-xs">AI Analyzed</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Uploaded</Badge>;
  };

  const sortedReports = healthReports.sort((a, b) => 
    new Date(b.actual_report_date || b.report_date).getTime() - 
    new Date(a.actual_report_date || a.report_date).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/care')}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold truncate">
                  {pet.name}'s Reports
                </h1>
                <p className="text-xs text-muted-foreground">
                  {healthReports.length} {healthReports.length === 1 ? 'report' : 'reports'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowUpload(true)}
              size="sm"
              className="h-8 px-3 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-20">
        {/* Upload Section */}
        {showUpload && (
          <div className="py-4">
            <ImprovedHealthReportUpload
              petId={petId!}
              petInfo={{
                name: pet.name,
                type: pet.type,
                breed: pet.breed
              }}
              onUploadComplete={handleUploadComplete}
              addReportToState={addReportToState}
            />
          </div>
        )}

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading reports...</p>
            </div>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Upload your first health report to get started
            </p>
            <Button onClick={() => setShowUpload(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Report
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {sortedReports.map((report) => (
              <div key={report.id}>
                <HealthReportCard
                  report={report}
                  onDelete={() => {}}
                  onTriggerAI={handleAIAnalysis}
                  autoExpand={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="w-full h-full md:max-w-4xl md:h-auto md:max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="text-base font-medium truncate pr-8">
                {selectedReport.report_label || selectedReport.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto p-4">
              {/* Report Image */}
              {selectedReport.image_url && (
                <div className="mb-6">
                  <img 
                    src={selectedReport.image_url}
                    alt={selectedReport.title}
                    className="w-full h-auto rounded-lg border shadow-sm"
                  />
                </div>
              )}

              {/* Health Report Card in Detail View */}
              <HealthReportCard
                report={selectedReport}
                onDelete={() => {}}
                onTriggerAI={handleAIAnalysis}
                autoExpand={true}
              />

              {/* Processing State */}
              {processingReports.has(selectedReport.id) && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing report... This may take a moment.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HealthReportsPage;
