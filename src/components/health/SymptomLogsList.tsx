
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, MessageSquare, Camera } from 'lucide-react';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SymptomLogsListProps {
  petId: string;
  petName: string;
}

const SymptomLogsList = ({ petId, petName }: SymptomLogsListProps) => {
  const { reports, loading } = useSymptomReports(petId);
  const [selectedReport, setSelectedReport] = useState(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Loading symptom logs...</p>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-gray-500 mb-2">No symptom logs yet</p>
          <p className="text-xs text-gray-400">
            Use the "Quick Health Log" button above to report symptoms for {petName}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Symptom Logs ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.slice(0, 3).map((report) => (
            <div 
              key={report.id} 
              className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {format(new Date(report.reported_on), 'MMM dd, yyyy')}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
              
              {report.symptoms && report.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {report.symptoms.slice(0, 2).map((symptom, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {symptom}
                    </Badge>
                  ))}
                  {report.symptoms.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{report.symptoms.length - 2} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {report.photo_url && (
                    <Camera className="h-4 w-4 text-gray-400" />
                  )}
                  {report.notes && (
                    <span className="text-xs text-gray-500">Has notes</span>
                  )}
                </div>
                {report.ai_response && (
                  <Badge className="text-xs bg-green-100 text-green-800">
                    AI Analyzed
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          {reports.length > 3 && (
            <Button variant="outline" className="w-full mt-3">
              View All {reports.length} Logs
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Symptom Log - {format(new Date(selectedReport.reported_on), 'MMM dd, yyyy')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedReport.symptoms && selectedReport.symptoms.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Symptoms:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.symptoms.map((symptom, index) => (
                      <Badge key={index} variant="secondary">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.notes && (
                <div>
                  <h4 className="font-medium mb-2">Additional Notes:</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedReport.notes}
                  </p>
                </div>
              )}

              {selectedReport.photo_url && (
                <div>
                  <h4 className="font-medium mb-2">Photo:</h4>
                  <img 
                    src={selectedReport.photo_url} 
                    alt="Symptom photo"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              {selectedReport.ai_response && (
                <div>
                  <h4 className="font-medium mb-2">AI Analysis:</h4>
                  <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border">
                    {selectedReport.ai_response}
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ This is AI analysis only. Consult a veterinarian for professional advice.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SymptomLogsList;
