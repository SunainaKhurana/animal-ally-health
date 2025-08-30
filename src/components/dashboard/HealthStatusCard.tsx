
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, FileText, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HealthStatusCardProps {
  petId: string;
  petName: string;
  recentReports: number;
  lastCheckup: string | null;
  healthStatus: 'good' | 'attention' | 'unknown';
  upcomingReminders: number;
}

const HealthStatusCard = ({ 
  petId, 
  petName, 
  recentReports, 
  lastCheckup, 
  healthStatus,
  upcomingReminders 
}: HealthStatusCardProps) => {
  const navigate = useNavigate();

  const getHealthBadge = () => {
    switch (healthStatus) {
      case 'good':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Good Health
          </Badge>
        );
      case 'attention':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Attention
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Heart className="h-3 w-3 mr-1" />
            Status Unknown
          </Badge>
        );
    }
  };

  const getHealthEmoji = () => {
    switch (healthStatus) {
      case 'good': return '💚';
      case 'attention': return '⚠️';
      default: return '🩺';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Heart className="h-5 w-5" />
            Health Status
          </CardTitle>
          {getHealthBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">{getHealthEmoji()}</div>
          <p className="text-sm text-gray-600">
            {petName}'s overall health
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Health Reports</span>
            <span className="font-semibold text-green-800">{recentReports}</span>
          </div>
          
          {lastCheckup && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Checkup</span>
              <span className="text-sm font-medium">{lastCheckup}</span>
            </div>
          )}
          
          {upcomingReminders > 0 && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                {upcomingReminders} upcoming reminder{upcomingReminders > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <Button 
          onClick={() => navigate(`/health-reports/${petId}`)}
          variant="outline"
          size="sm"
          className="w-full border-green-200 text-green-700 hover:bg-green-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          View Health Reports
        </Button>
      </CardContent>
    </Card>
  );
};

export default HealthStatusCard;
