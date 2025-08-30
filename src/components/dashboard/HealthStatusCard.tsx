
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
          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 rounded-full">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'attention':
        return (
          <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200 rounded-full">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Care
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 rounded-full">
            <Heart className="h-3 w-3 mr-1" />
            Unknown
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

  const getCardGradient = () => {
    switch (healthStatus) {
      case 'good': return 'from-green-50 via-emerald-50 to-teal-50 border-green-100';
      case 'attention': return 'from-yellow-50 via-orange-50 to-red-50 border-orange-100';
      default: return 'from-gray-50 via-slate-50 to-blue-50 border-gray-100';
    }
  };

  return (
    <Card className={`bg-gradient-to-br ${getCardGradient()} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Heart className="h-5 w-5" />
            Health Status
          </CardTitle>
          {getHealthBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-2">
          <div className="text-5xl mb-3">{getHealthEmoji()}</div>
          <p className="text-sm text-gray-600 font-medium">
            {petName}'s overall health looks {healthStatus === 'good' ? 'great' : healthStatus === 'attention' ? 'okay' : 'unclear'}!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-700">{recentReports}</div>
            <div className="text-xs text-gray-600">Health Reports</div>
          </div>
          
          {lastCheckup && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">Last Checkup</div>
              <div className="text-sm font-medium text-gray-800">{lastCheckup}</div>
            </div>
          )}
        </div>
        
        {upcomingReminders > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              {upcomingReminders} upcoming reminder{upcomingReminders > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <Button 
          onClick={() => navigate(`/health-reports/${petId}`)}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg rounded-full"
        >
          <FileText className="h-4 w-4 mr-2" />
          View Health Reports
        </Button>
      </CardContent>
    </Card>
  );
};

export default HealthStatusCard;
