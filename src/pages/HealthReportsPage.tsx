
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

const HealthReportsPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePetContext();
  const { healthReports, loading, refetch, deleteReport } = useImprovedHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDeletingFromDetail, setIsDeletingFromDetail] = useState(false);

  const pet = pets.find(p => p.id === petId);

  // Category mapping
  const getReportCategory = (reportType: string) => {
    const type = reportType.toLowerCase();
    if (type.includes('checkup') || type.includes('exam') || type.includes('wellness')) {
      return 'checkups';
    } else if (type.includes('lab') || type.includes('blood') || type.includes('urine') || type.includes('test')) {
      return 'lab';
    } else if (type.includes('x-ray') || type.includes('ultrasound') || type.includes('mri') || type.includes('imaging') || type.includes('scan')) {
      return 'imaging';
    }
    return 'other';
  };

  const categories = [
    { id: 'all', label: 'All', count: healthReports.length },
    { id: 'checkups', label: 'Checkups', count: healthReports.filter(r => getReportCategory(r.report_type) === 'checkups').length },
    { id: 'lab', label: 'Lab Tests', count: healthReports.filter(r => getReportCategory(r.report_type) === 'lab').length },
    { id: 'imaging', label: 'Imaging', count: healthReports.filter(r => getReportCategory(r.report_type) === 'imaging').length }
  ];

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

  const filteredReports = healthReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.report_label || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      getReportCategory(report.report_type) === selectedCategory;
    
    return matchesSearch && matchesCategory;
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
              <h1 className="text-lg font-semibold">Health Reports</h1>
            </div>
            <Button
              onClick={() => setShowUpload(true)}
              size="sm"
              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`h-8 px-3 text-xs whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category.label} ({category.count})
              </Button>
            ))}
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
              {searchQuery || selectedCategory !== 'all' ? 'No matching reports' : 'No Reports Yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search terms or filters'
                : 'Upload your first health report to get started'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
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

export default HealthReportsPage;
