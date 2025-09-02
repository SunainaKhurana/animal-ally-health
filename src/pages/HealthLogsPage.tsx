
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Calendar, Camera, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { usePetContext } from '@/contexts/PetContext';
import SymptomLogger from '@/components/assistant/SymptomLogger';
import { format } from 'date-fns';
import FloatingActionButton from '@/components/ui/FloatingActionButton';

const HealthLogsPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { selectedPet } = usePetContext();
  const { reports, loading, addSymptomReport, markAsResolved } = useSymptomReports(petId);
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const handleSubmitSymptoms = async (symptoms: string[], notes: string, image?: File) => {
    if (!petId) return;
    
    try {
      await addSymptomReport(petId, symptoms, notes, image);
      setShowSymptomLogger(false);
    } catch (error) {
      console.error('Failed to submit symptoms:', error);
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'severe': return <AlertTriangle className="h-4 w-4" />;
      case 'moderate': return <Info className="h-4 w-4" />;
      case 'mild': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Health Logs</h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-4">
          <p className="text-center text-gray-500">Loading health logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Health Logs</h1>
            <p className="text-sm text-gray-600">{selectedPet?.name}</p>
          </div>
          <Button 
            onClick={() => setShowSymptomLogger(true)}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Log
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Health Logs Yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start tracking {selectedPet?.name}'s health by adding your first log entry.
              </p>
              <Button 
                onClick={() => setShowSymptomLogger(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Log
              </Button>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card 
              key={report.id} 
              className={`cursor-pointer transition-all ${report.is_resolved ? 'opacity-75' : ''}`}
              onClick={() => setSelectedReport(report)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(report.reported_on), 'MMM dd, yyyy')}
                      </span>
                      {report.is_resolved && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    {report.severity_level && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs flex items-center gap-1 ${getSeverityColor(report.severity_level)}`}>
                          {getSeverityIcon(report.severity_level)}
                          {report.severity_level.charAt(0).toUpperCase() + report.severity_level.slice(1)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {report.symptoms && report.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {report.symptoms.slice(0, 3).map((symptom, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {symptom}
                      </Badge>
                    ))}
                    {report.symptoms.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{report.symptoms.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {report.recurring_note && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {report.recurring_note}
                    </p>
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
                  {!report.is_resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsResolved(report.id);
                      }}
                      className="text-xs h-7"
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={() => setShowSymptomLogger(true)}
        className="bg-orange-500 hover:bg-orange-600"
      >
        <Plus className="h-6 w-6" />
      </FloatingActionButton>

      {/* Symptom Logger Dialog */}
      {showSymptomLogger && (
        <Dialog open={showSymptomLogger} onOpenChange={setShowSymptomLogger}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Health Log</DialogTitle>
            </DialogHeader>
            <SymptomLogger
              onSubmit={handleSubmitSymptoms}
              onCancel={() => setShowSymptomLogger(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Report Detail Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Health Log - {format(new Date(selectedReport.reported_on), 'MMM dd, yyyy')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedReport.severity_level && (
                <div className="flex items-center gap-2">
                  <Badge className={`flex items-center gap-1 ${getSeverityColor(selectedReport.severity_level)}`}>
                    {getSeverityIcon(selectedReport.severity_level)}
                    {selectedReport.severity_level.charAt(0).toUpperCase() + selectedReport.severity_level.slice(1)} Severity
                  </Badge>
                  {selectedReport.is_resolved && (
                    <Badge className="bg-green-100 text-green-800">
                      Resolved on {format(new Date(selectedReport.resolved_at), 'MMM dd, yyyy')}
                    </Badge>
                  )}
                </div>
              )}

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

              {selectedReport.recurring_note && (
                <div>
                  <h4 className="font-medium mb-2">Recurring Issue Alert:</h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {selectedReport.recurring_note}
                    </p>
                  </div>
                </div>
              )}

              {selectedReport.photo_url && (
                <div>
                  <h4 className="font-medium mb-2">Photo:</h4>
                  <img 
                    src={selectedReport.photo_url} 
                    alt="Health log photo"
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

              {!selectedReport.is_resolved && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      markAsResolved(selectedReport.id);
                      setSelectedReport(null);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HealthLogsPage;
