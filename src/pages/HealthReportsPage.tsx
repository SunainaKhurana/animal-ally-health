
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, FileText, Calendar, Activity } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useHealthReports } from '@/hooks/useHealthReports';
import HealthReportCard from '@/components/health/HealthReportCard';
import ProcessingReportsSection from '@/components/health/ProcessingReportsSection';
import HealthReportUploadDialog from '@/components/health/HealthReportUploadDialog';
import HealthReportsFilters from '@/components/health/HealthReportsFilters';

const HealthReportsPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePetContext();
  const { healthReports, loading, refetch } = useHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);
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

  // Separate reports by status
  const processingReports = filteredReports.filter(report => report.status === 'processing');
  const completedReports = filteredReports.filter(report => report.status === 'completed');
  const failedReports = filteredReports.filter(report => report.status === 'failed');

  // Check for new reports (last 24h)
  const isNewReport = (reportDate: string) => {
    const now = new Date();
    const report = new Date(reportDate);
    const diffHours = (now.getTime() - report.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header with proper spacing */}
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

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowUpload(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-base font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Health Report
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Filters */}
        <HealthReportsFilters 
          filters={filters}
          onFiltersChange={setFilters}
          reports={healthReports}
        />

        {/* Processing Reports */}
        {processingReports.length > 0 && (
          <ProcessingReportsSection 
            reports={processingReports}
            onDelete={() => refetch()}
          />
        )}

        {/* Failed Reports */}
        {failedReports.length > 0 && (
          <Card className="border border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg text-red-700 flex items-center gap-3">
                <Activity className="h-5 w-5" />
                Failed Reports
                <Badge variant="destructive" className="ml-auto">{failedReports.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {failedReports.map((report) => (
                <div key={report.id} className="relative">
                  <HealthReportCard
                    report={report}
                    onDelete={() => refetch()}
                  />
                  <div className="absolute top-3 right-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowUpload(true)}
                      className="text-sm"
                    >
                      Retry Upload
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Reports Section */}
        <Card className="border-gray-200">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl flex items-center gap-3">
              <FileText className="h-6 w-6 text-green-500" />
              {completedReports.length > 0 ? 'Health Reports' : 'No Reports Yet'}
              {completedReports.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-sm">{completedReports.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading reports...</p>
              </div>
            ) : completedReports.length === 0 ? (
              // Empty State with better spacing
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  No health reports yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                  Upload {pet.name}'s first diagnostic report to get AI-powered insights in plain language. 
                  We support images and PDFs of blood work, x-rays, and other medical reports.
                </p>
                <Button 
                  onClick={() => setShowUpload(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-base font-medium"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Upload First Report
                </Button>
              </div>
            ) : (
              // Reports Grid with better spacing
              <div className="space-y-6">
                {completedReports
                  .sort((a, b) => new Date(b.actual_report_date || b.report_date).getTime() - new Date(a.actual_report_date || a.report_date).getTime())
                  .map((report) => (
                  <div key={report.id} className="relative">
                    <HealthReportCard
                      report={report}
                      onDelete={() => refetch()}
                    />
                    {/* New Badge with better positioning */}
                    {isNewReport(report.created_at || report.report_date) && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500 text-white px-3 py-1">New</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Summary with improved spacing */}
        {healthReports.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl flex items-center gap-3">
                <Calendar className="h-6 w-6 text-purple-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div>
                        <div className="font-medium text-base text-gray-900">
                          {report.report_label || report.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(report.actual_report_date || report.report_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={report.status === 'completed' ? 'default' : 'secondary'}
                      className="text-sm px-3 py-1"
                    >
                      {report.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <HealthReportUploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        onUploadSuccess={() => {
          refetch();
          setShowUpload(false);
        }}
      />
    </div>
  );
};

export default HealthReportsPage;
