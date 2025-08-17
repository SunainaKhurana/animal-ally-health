
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, ArrowLeft, Stethoscope, Brain, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HealthReport } from "@/hooks/useHealthReports";
import { useHealthReportsRealtime } from "@/hooks/useHealthReportsRealtime";
import HealthReportCard from "./HealthReportCard";
import HealthReportsRefreshButton from "./HealthReportsRefreshButton";

interface CompletedReportsSectionProps {
  reports: HealthReport[];
  loading: boolean;
  onDelete: (reportId: string) => void;
  onShowUpload: () => void;
  onRefresh: () => Promise<void>;
  recentlyUploadedId?: string | null;
  petId?: string;
}

const CompletedReportsSection = ({ 
  reports, 
  loading, 
  onDelete, 
  onShowUpload, 
  onRefresh,
  recentlyUploadedId,
  petId
}: CompletedReportsSectionProps) => {
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [isDeletingFromDetail, setIsDeletingFromDetail] = useState(false);
  const [localReports, setLocalReports] = useState(reports);

  // Update local reports when reports prop changes
  React.useEffect(() => {
    setLocalReports(reports);
  }, [reports]);

  // Set up real-time subscription
  useHealthReportsRealtime(
    petId,
    (updatedReport) => {
      console.log('📝 CompletedReportsSection: Real-time update received');
      setLocalReports(prev => prev.map(r => 
        r.id === updatedReport.id ? updatedReport : r
      ));
    },
    (newReport) => {
      console.log('➕ CompletedReportsSection: Real-time insert received');
      setLocalReports(prev => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
    },
    (deletedReportId) => {
      console.log('🗑️ CompletedReportsSection: Real-time delete received');
      setLocalReports(prev => prev.filter(r => r.id !== deletedReportId));
    }
  );

  const handleReportClick = (report: HealthReport) => {
    console.log('📋 Report selected:', report.id);
    setSelectedReport(report);
  };

  const handleDeleteReport = async (reportId: string) => {
    console.log('🗑️ Deleting health report from CompletedReportsSection:', reportId);
    
    const deletingFromDetail = selectedReport && selectedReport.id === reportId;
    
    if (deletingFromDetail) {
      setIsDeletingFromDetail(true);
      
      setTimeout(() => {
        setSelectedReport(null);
        setIsDeletingFromDetail(false);
      }, 500);
    }
    
    await onDelete(reportId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Health Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Health Reports
            </CardTitle>
            <div className="flex items-center gap-2">
              <HealthReportsRefreshButton 
                onRefresh={onRefresh} 
                isLoading={loading}
              />
              <Button onClick={onShowUpload} size="sm" className="h-8 px-3 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add Report
              </Button>
            </div>
          </div>
          <CardDescription>
            {localReports.length === 0 ? 'No reports yet' : `${localReports.length} report${localReports.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {localReports.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Health Reports Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Upload your first health report to get started with AI-powered insights.
              </p>
              <Button onClick={onShowUpload}>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Report
              </Button>
            </div>
          ) : (
            localReports.map((report) => (
              <HealthReportCard
                key={report.id}
                report={report}
                onDelete={handleDeleteReport}
                onTap={handleReportClick}
                showAsListItem={true}
              />
            ))
          )}
        </CardContent>
      </Card>

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
                showAsListItem={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CompletedReportsSection;
