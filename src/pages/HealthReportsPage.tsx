
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, TrendingUp, Filter } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrends(!showTrends)}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Trends
              </Button>
              <Button
                onClick={() => setShowUpload(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Upload Report
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
              <CardTitle className="text-lg text-red-600">Failed Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {failedReports.map((report) => (
                <HealthReportCard
                  key={report.id}
                  report={report}
                  onDelete={() => refetch()}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {completedReports.length > 0 ? 'Analyzed Reports' : 'Health Reports'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading reports...</p>
              </div>
            ) : completedReports.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No health reports yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload {pet.name}'s first diagnostic report to get AI-powered insights in plain language
                </p>
                <Button onClick={() => setShowUpload(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload First Report
                </Button>
              </div>
            ) : (
              completedReports.map((report) => (
                <HealthReportCard
                  key={report.id}
                  report={report}
                  onDelete={() => refetch()}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <DirectHealthReportUpload
        open={showUpload}
        onOpenChange={setShowUpload}
      />
    </div>
  );
};

export default HealthReportsPage;
