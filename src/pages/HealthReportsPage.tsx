
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, FileText, Calendar, Brain, Eye, Loader2 } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useHealthReports } from '@/hooks/useHealthReports';
import HealthReportCard from '@/components/health/HealthReportCard';
import ImprovedHealthReportUpload from '@/components/health/ImprovedHealthReportUpload';
import HealthReportsFilters from '@/components/health/HealthReportsFilters';

const HealthReportsPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePetContext();
  const { healthReports, loading, refetch, addReportToState, triggerAIAnalysis } = useHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [processingReports, setProcessingReports] = useState(new Set());
  const [filters, setFilters] = useState({
    reportType: 'all',
    dateRange: 'all',
    status: 'all'
  });

  const pet = pets.find(p => p.id === petId);

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pet not found</h2>
          <Button onClick={() => navigate('/care')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Care
          </Button>
        </div>
      </div>
    );
  }

  // Filter reports based on current filters
  const filteredReports = healthReports.filter(report => {
    if (filters.reportType !== 'all' && report.report_type !== filters.reportType) return false;
    if (filters.status !== 'all' && report.status !== filters.status) return false;
    return true;
  });

  const handleUploadComplete = (reportId: string) => {
    console.log('✅ Upload completed for report:', reportId);
    setShowUpload(false);
    refetch();
  };

  const handleAIAnalysis = async (reportId: string) => {
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

  const hasAnyReports = healthReports.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Navigation */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/care')}
              className="mr-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {pet.name}'s Health Reports
            </h1>
            <p className="text-lg text-gray-600">
              {healthReports.length} {healthReports.length === 1 ? 'report' : 'reports'} uploaded
            </p>
          </div>

          {/* Upload Button */}
          {hasAnyReports && (
            <div className="flex justify-end">
              <Button
                onClick={() => setShowUpload(!showUpload)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-base font-medium"
              >
                {showUpload ? 'Hide Upload' : 'Upload Another Report'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Component */}
        {(showUpload || !hasAnyReports) && (
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
        )}

        {/* Filters and Reports List */}
        {hasAnyReports && (
          <>
            <HealthReportsFilters 
              filters={filters}
              onFiltersChange={setFilters}
              reports={healthReports}
            />

            {/* Reports List */}
            <Card className="border-gray-200">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-500" />
                  Health Reports
                  {filteredReports.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-sm">
                      {filteredReports.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading reports...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReports
                      .sort((a, b) => new Date(b.actual_report_date || b.report_date).getTime() - new Date(a.actual_report_date || a.report_date).getTime())
                      .map((report) => (
                      <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900 cursor-pointer hover:text-blue-600" 
                                  onClick={() => setSelectedReport(report)}>
                                {report.report_label || report.title}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {report.report_type}
                              </Badge>
                              {report.ai_analysis && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  AI Analyzed
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(report.actual_report_date || report.report_date).toLocaleDateString()}
                              </div>
                            </div>

                            {/* Report preview image */}
                            {report.image_url && (
                              <img 
                                src={report.image_url}
                                alt={report.title}
                                className="w-full max-w-xs h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() => setSelectedReport(report)}
                              />
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {!report.ai_analysis ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAIAnalysis(report.id)}
                                disabled={processingReports.has(report.id)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                {processingReports.has(report.id) ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Brain className="h-3 w-3 mr-1" />
                                )}
                                {processingReports.has(report.id) ? 'Analyzing...' : 'AI Analyse Report'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAIAnalysis(report.id)}
                                disabled={processingReports.has(report.id)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                {processingReports.has(report.id) ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Brain className="h-3 w-3 mr-1" />
                                )}
                                {processingReports.has(report.id) ? 'Re-analyzing...' : 'Re-analyze Report'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Report Detail Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {selectedReport.report_label || selectedReport.title}
                <div className="flex gap-2">
                  {!selectedReport.ai_analysis ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAIAnalysis(selectedReport.id)}
                      disabled={processingReports.has(selectedReport.id)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      {processingReports.has(selectedReport.id) ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Brain className="h-3 w-3 mr-1" />
                      )}
                      {processingReports.has(selectedReport.id) ? 'Analyzing...' : 'AI Analyse Report'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAIAnalysis(selectedReport.id)}
                      disabled={processingReports.has(selectedReport.id)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      {processingReports.has(selectedReport.id) ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Brain className="h-3 w-3 mr-1" />
                      )}
                      {processingReports.has(selectedReport.id) ? 'Re-analyzing...' : 'Re-analyze Report'}
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Report Image */}
              {selectedReport.image_url && (
                <div className="text-center">
                  <img 
                    src={selectedReport.image_url}
                    alt={selectedReport.title}
                    className="max-w-full h-auto rounded-lg border shadow-lg mx-auto"
                  />
                </div>
              )}

              {/* AI Analysis Results */}
              {selectedReport.ai_analysis && (
                <div className="mt-6">
                  <HealthReportCard
                    report={selectedReport}
                    onDelete={() => {}}
                    autoExpand={true}
                  />
                </div>
              )}

              {/* Processing State */}
              {processingReports.has(selectedReport.id) && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="text-gray-600">Analyzing report... This may take a moment.</p>
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
