
import { Sparkles } from "lucide-react";
import HealthReportCard from "./HealthReportCard";
import { HealthReport } from "@/hooks/useHealthReports";

interface ProcessingReportsSectionProps {
  reports: HealthReport[];
  onDelete: (reportId: string) => void;
}

const ProcessingReportsSection = ({ reports, onDelete }: ProcessingReportsSectionProps) => {
  if (reports.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-orange-500" />
        Processing Reports
      </h3>
      <div className="space-y-4">
        {reports.map((report) => (
          <HealthReportCard
            key={report.id}
            report={report}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default ProcessingReportsSection;
