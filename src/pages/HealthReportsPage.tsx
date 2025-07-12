
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, TrendingUp, FileText, Calendar, Activity } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useHealthReports } from '@/hooks/useHealthReports';
import HealthReportCard from '@/components/health/HealthReportCard';
import ProcessingReportsSection from '@/components/health/ProcessingReportsSection';
import DirectHealthReportUpload from '@/components/health/DirectHealthReportUpload';
import HealthReportsTrends from '@/components/health/HealthReportsTrends';
import HealthReportsFilters from '@/components/health/HealthReportsFilters';

const HealthReportsPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePetContext();
  const { healthReports, loading, refetch } = useHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [filters, setFilters] = useState({
    reportType: 'all',
    dateRange: 'all',
    status: 'all'
  });

  const pet = pets.find(p => p.id === petId);

  // Cache the last 10 reports
  const [cachedReports, setCachedReports] = useState(healthReports.slice(0, 10));
  
  useEffect(() => {
    setCachedReports(healthReports.slice(0, 10));
  }, [healthReports]);

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
      {/* Sticky Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/care')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {pet.name}'s Health Reports
                </h1>
                <p className="text-sm text-gray-600">
                  {healthReports.length} reports total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {completedReports.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTrends(!showTrends)}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Trends
                </Button>
              )}
              <Button
                onClick={() => setShowUpload(true)}
                className="sticky"
              >
                <Plus className="h-4 w-4 mr-1" />
                Upload New Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Trends Section */}
        {showTrends && completedReports.length > 1 && (
          <HealthReportsTrends 
            reports={completedReports} 
            petName={pet.name}
          />
        )}

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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Failed Reports
                <Badge variant="destructive" className="ml-2">{failedReports.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {failedReports.map((report) => (
                <div key={report.id} className="relative">
                  <HealthReportCard
                    report={report}
                    onDelete={() => refetch()}
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowUpload(true)}
                    >
                      Retry Upload
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Report Summary Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              {completedReports.length > 0 ? 'Health Reports' : 'No Reports Yet'}
              {completedReports.length > 0 && (
                <Badge variant="secondary" className="ml-2">{completedReports.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading reports...</p>
              </div>
            ) : completedReports.length === 0 ? (
              // Empty State
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No health reports yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Upload {pet.name}'s first diagnostic report to get AI-powered insights in plain language. 
                  We support images and PDFs of blood work, x-rays, and other medical reports.
                </p>
                <Button 
                  onClick={() => setShowUpload(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Upload First Report
                </Button>
              </div>
            ) : (
              // Reports Grid
              <div className="space-y-4">
                {completedReports.map((report) => (
                  <div key={report.id} className="relative">
                    <HealthReportCard
                      report={report}
                      onDelete={() => refetch()}
                    />
                    {/* New Badge */}
                    {isNewReport(report.created_at || report.report_date) && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">New</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        {healthReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cachedReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">
                          {report.report_label || report.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(report.actual_report_date || report.report_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={report.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
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

      {/* Upload Modal */}
      <DirectHealthReportUpload
        open={showUpload}
        onOpenChange={setShowUpload}
      />
    </div>
  );
};

export default HealthReportsPage;
