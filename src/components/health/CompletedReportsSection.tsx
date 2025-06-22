
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles } from "lucide-react";
import HealthReportCard from "./HealthReportCard";
import { HealthReport } from "@/hooks/useHealthReports";
import EmptyStateCard from "./EmptyStateCard";

interface CompletedReportsSectionProps {
  reports: HealthReport[];
  loading: boolean;
  onDelete: (reportId: string) => void;
  onShowUpload: () => void;
  recentlyUploadedId: string | null;
}

const CompletedReportsSection = ({ 
  reports, 
  loading, 
  onDelete, 
  onShowUpload, 
  recentlyUploadedId 
}: CompletedReportsSectionProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {reports.length > 0 && <Sparkles className="h-5 w-5 text-green-500" />}
          {reports.length > 0 ? 'Analyzed Reports' : 'Reports'}
        </h3>
        {reports.length > 1 && (
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            View Trends
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <EmptyStateCard 
            title="Loading reports..." 
            description=""
            showButton={false}
            onButtonClick={() => {}}
          />
        ) : reports.length === 0 ? (
          <EmptyStateCard 
            title="No health records yet"
            description="Upload your first diagnostic report to get AI-powered insights in plain language"
            showButton={true}
            onButtonClick={onShowUpload}
          />
        ) : (
          reports.map((report) => (
            <HealthReportCard
              key={report.id}
              report={report}
              onDelete={onDelete}
              autoExpand={report.id === recentlyUploadedId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CompletedReportsSection;
