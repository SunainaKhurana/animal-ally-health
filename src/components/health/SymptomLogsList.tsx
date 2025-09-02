
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, MessageSquare, Camera, ArrowRight } from 'lucide-react';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { format } from 'date-fns';

interface SymptomLogsListProps {
  petId: string;
  petName: string;
}

const SymptomLogsList = ({ petId, petName }: SymptomLogsListProps) => {
  const { reports, loading } = useSymptomReports(petId);
  const navigate = useNavigate();

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
          <p className="text-sm text-gray-500 mb-2">No health logs yet</p>
          <p className="text-xs text-gray-400">
            Use the "Quick Health Log" button above to start tracking {petName}'s health
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'mild': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Recent Health Logs
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/health-logs/${petId}`)}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.slice(0, 3).map((report) => (
          <div 
            key={report.id} 
            className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${report.is_resolved ? 'opacity-75' : ''}`}
            onClick={() => navigate(`/health-logs/${petId}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
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
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Eye className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {report.severity_level && (
                <Badge className={`text-xs ${getSeverityColor(report.severity_level)}`}>
                  {report.severity_level.charAt(0).toUpperCase() + report.severity_level.slice(1)}
                </Badge>
              )}
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
              {report.recurring_note && (
                <Badge className="text-xs bg-amber-100 text-amber-800">
                  Recurring
                </Badge>
              )}
            </div>
          </div>
        ))}
        
        {reports.length > 3 && (
          <Button 
            variant="outline" 
            className="w-full mt-3"
            onClick={() => navigate(`/health-logs/${petId}`)}
          >
            View All {reports.length} Logs
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomLogsList;
