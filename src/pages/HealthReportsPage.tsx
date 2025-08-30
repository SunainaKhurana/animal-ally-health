
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Search, Plus, Loader2 } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useImprovedHealthReports } from '@/hooks/useImprovedHealthReports';
import HealthReportCard from '@/components/health/HealthReportCard';
import HealthReportUploadDialog from '@/components/health/HealthReportUploadDialog';
import HealthReportsRefreshButton from '@/components/health/HealthReportsRefreshButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const HealthReportsPageContent = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets, setSelectedPet } = usePetContext();
  const { healthReports, loading, refetch, deleteReport } = useImprovedHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeletingFromDetail, setIsDeletingFromDetail] = useState(false);

  const pet = pets.find(p => p.id === petId);

  // Set the selected pet when component mounts
  useEffect(() => {
    if (pet && petId) {
      setSelectedPet(pet);
    }
  }, [pet, petId, setSelectedPet]);

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

  const handleUploadSuccess = () => {
    console.log('✅ Upload completed successfully');
    setShowUpload(false);
    refetch();
  };

  const handleDeleteReport = async (reportId: string) => {
    console.log('🗑️ Deleting health report:', reportId);
    
    const deletingFromDetail = selectedReport && selectedReport.id === reportId;
    
    if (deletingFromDetail) {
      setIsDeletingFromDetail(true);
      
      setTimeout(() => {
        setSelectedReport(null);
        setIsDeletingFromDetail(false);
      }, 500);
    }
    
    await deleteReport(reportId);
  };

  const handleReportTap = (report: any) => {
    console.log('📋 Report tapped:', report.id);
    setSelectedReport(report);
  };

  // Simple search filtering only
  const filteredReports = healthReports.filter(report => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return report.title.toLowerCase().includes(searchLower) ||
           (report.report_label || '').toLowerCase().includes(searchLower) ||
           report.report_type.toLowerCase().includes(searchLower);
  });

  const sortedReports = filteredReports.sort((a, b) => 
    new Date(b.actual_report_date || b.report_date).getTime() - 
    new Date(a.actual_report_date || a.report_date).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
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
                <h1 className="text-lg font-semibold">Health Reports</h1>
                <p className="text-sm text-muted-foreground">{pet.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HealthReportsRefreshButton 
                onRefresh={refetch} 
                isLoading={loading}
              />
              <Button
                onClick={() => setShowUpload(true)}
                size="sm"
                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-20">
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
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No matching reports' : 'No Reports Yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : `Upload your first health report for ${pet.name} to get started`
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowUpload(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Report
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {sortedReports.map((report) => (
              <HealthReportCard
                key={report.id}
                report={report}
                onDelete={handleDeleteReport}
                onTap={handleReportTap}
                showAsListItem={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <HealthReportUploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        onUploadSuccess={handleUploadSuccess}
        petId={petId}
      />

      {/* Report Detail Dialog */}
      {selectedReport && (
        <Dialog 
          open={!!selectedReport && !isDeletingFromDetail} 
          onOpenChange={() => {
            if (!isDeletingFromDetail) {
              setSelectedReport(null);
            }
          }}
        >
          <DialogContent className={`w-full max-w-4xl h-[95vh] p-0 overflow-hidden flex flex-col transition-all duration-300 ${isDeletingFromDetail ? 'animate-fade-out' : 'animate-fade-in'}`}>
            <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  className="h-8 w-8 p-0"
                  disabled={isDeletingFromDetail}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-base font-medium">
                  Report Details
                </DialogTitle>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <HealthReportCard
                report={selectedReport}
                onDelete={handleDeleteReport}
                onTap={handleReportTap}
                showAsListItem={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const HealthReportsPage = () => {
  return (
    <ErrorBoundary>
      <HealthReportsPageContent />
    </ErrorBoundary>
  );
};

export default HealthReportsPage;
