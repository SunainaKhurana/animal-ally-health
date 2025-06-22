
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Sparkles } from "lucide-react";
import { useHealthReports } from "@/hooks/useHealthReports";
import EnhancedHealthRecordUpload from "@/components/health/EnhancedHealthRecordUpload";
import HealthReportCard from "@/components/health/HealthReportCard";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
}

interface PetHealthRecordsTabProps {
  petId: string;
  petInfo: Pet;
}

const PetHealthRecordsTab = ({ petId, petInfo }: PetHealthRecordsTabProps) => {
  const { reports, loading, deleteReport, refetch } = useHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = (reportIds: string[]) => {
    setShowUpload(false);
    refetch();
  };

  const completedReports = reports.filter(r => r.status === 'completed');
  const processingReports = reports.filter(r => r.status === 'processing');

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {showUpload && (
        <EnhancedHealthRecordUpload
          petId={petId}
          petInfo={{
            name: petInfo.name,
            type: petInfo.type,
            breed: petInfo.breed
          }}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Add Record Button */}
      {!showUpload && (
        <Button 
          onClick={() => setShowUpload(true)}
          className="w-full bg-orange-500 hover:bg-orange-600 h-12"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Health Record
        </Button>
      )}

      {/* Processing Reports */}
      {processingReports.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            Processing Reports
          </h3>
          <div className="space-y-4">
            {processingReports.map((report) => (
              <HealthReportCard
                key={report.id}
                report={report}
                onDelete={deleteReport}
              />
            ))}
          </div>
        </div>
      )}

      {/* Health Records */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {completedReports.length > 0 && <Sparkles className="h-5 w-5 text-green-500" />}
          {completedReports.length > 0 ? 'Analyzed Reports' : 'Health Records'}
        </h3>

        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">Loading reports...</p>
              </CardContent>
            </Card>
          ) : completedReports.length === 0 && processingReports.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">📋</div>
                <h4 className="font-medium text-gray-900 mb-2">No health records yet</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your first diagnostic report to get AI-powered insights
                </p>
                <Button 
                  onClick={() => setShowUpload(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            completedReports.map((report) => (
              <HealthReportCard
                key={report.id}
                report={report}
                onDelete={deleteReport}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PetHealthRecordsTab;
