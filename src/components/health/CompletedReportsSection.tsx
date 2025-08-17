
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, ArrowLeft, Stethoscope, Brain, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HealthReport } from "@/hooks/useHealthReports";
import HealthReportCard from "./HealthReportCard";

interface CompletedReportsSectionProps {
  reports: HealthReport[];
  loading: boolean;
  onDelete: (reportId: string) => void;
  onShowUpload: () => void;
  recentlyUploadedId?: string | null;
}

const CompletedReportsSection = ({ 
  reports, 
  loading, 
  onDelete, 
  onShowUpload, 
  recentlyUploadedId 
}: CompletedReportsSectionProps) => {
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [processingReports, setProcessingReports] = useState(new Set<string>());

  const handleReportClick = (report: HealthReport) => {
    console.log('📋 Report selected:', report.id);
    setSelectedReport(report);
  };

  const handleTriggerAI = async (reportId: string) => {
    console.log('🤖 Triggering AI analysis for report:', reportId);
    setProcessingReports(prev => new Set(prev).add(reportId));
    
    try {
      // This would typically call the AI analysis function
      // For now, we'll just simulate the processing state
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
    } finally {
      setProcessingReports(prev => {
        const updated = new Set(prev);
        updated.delete(reportId);
        return updated;
      });
    }
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
            <Button onClick={onShowUpload} size="sm" className="h-8 px-3 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Report
            </Button>
          </div>
          <CardDescription>
            {reports.length === 0 ? 'No reports yet' : `${reports.length} report${reports.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? (
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
            reports.map((report) => (
              <HealthReportCard
                key={report.id}
                report={report}
                onDelete={onDelete}
                onTriggerAI={handleTriggerAI}
                onTap={handleReportClick}
                showAsListItem={true}
                isProcessing={processingReports.has(report.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="w-full max-w-4xl h-[95vh] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  className="h-8 w-8 p-0"
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
                onDelete={(reportId) => {
                  onDelete(reportId);
                  setSelectedReport(null); // Close dialog after delete
                }}
                onTriggerAI={handleTriggerAI}
                showAsListItem={false}
                isProcessing={processingReports.has(selectedReport.id)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CompletedReportsSection;
