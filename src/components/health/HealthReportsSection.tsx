
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { useHealthReports } from '@/hooks/useHealthReports';
import { usePetContext } from '@/contexts/PetContext';
import HealthReportCard from './HealthReportCard';
import ProcessingReportsSection from './ProcessingReportsSection';
import CompletedReportsSection from './CompletedReportsSection';
import DirectHealthReportUpload from './DirectHealthReportUpload';

const HealthReportsSection = () => {
  const { selectedPet } = usePetContext();
  const { healthReports, loading, refetch } = useHealthReports(selectedPet?.id);
  const [showUpload, setShowUpload] = useState(false);
  const [recentlyUploadedId, setRecentlyUploadedId] = useState<string | null>(null);

  // Separate reports by status
  const processingReports = healthReports.filter(report => report.status === 'processing');
  const completedReports = healthReports.filter(report => report.status === 'completed');
  const failedReports = healthReports.filter(report => report.status === 'failed');

  // Auto-refresh every 30 seconds to check for new reports from Make.com
  useEffect(() => {
    if (!selectedPet?.id) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing health reports...');
      refetch();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedPet?.id, refetch]);

  const handleRefresh = () => {
    console.log('Manual refresh of health reports');
    refetch();
  };

  if (!selectedPet) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Health Reports ({healthReports.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowUpload(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Processing Reports */}
          {processingReports.length > 0 && (
            <ProcessingReportsSection 
              reports={processingReports}
              onDelete={() => refetch()}
            />
          )}

          {/* Failed Reports */}
          {failedReports.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-4">Failed Reports</h3>
              <div className="space-y-4">
                {failedReports.map((report) => (
                  <HealthReportCard
                    key={report.id}
                    report={report}
                    onDelete={() => refetch()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Reports */}
          <CompletedReportsSection
            reports={completedReports}
            loading={loading}
            onDelete={() => refetch()}
            onShowUpload={() => setShowUpload(true)}
            recentlyUploadedId={recentlyUploadedId}
          />

          {/* Empty State */}
          {healthReports.length === 0 && !loading && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No health reports yet</h3>
              <p className="text-gray-600 mb-4">
                Upload your first health report to get AI-powered insights
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DirectHealthReportUpload
        open={showUpload}
        onOpenChange={setShowUpload}
      />
    </>
  );
};

export default HealthReportsSection;
