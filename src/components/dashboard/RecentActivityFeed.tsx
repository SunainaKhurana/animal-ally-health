
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Activity, Heart, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: 'walk' | 'feeding' | 'health' | 'checkup';
  title: string;
  time: string;
  icon: string;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  petName: string;
}

const RecentActivityFeed = ({ activities, petName }: RecentActivityFeedProps) => {
  const navigate = useNavigate();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'walk': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'feeding': return <span className="text-lg">🍽️</span>;
      case 'health': return <Heart className="h-4 w-4 text-red-500" />;
      case 'checkup': return <FileText className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'walk': return 'bg-blue-50 border-blue-200';
      case 'feeding': return 'bg-orange-50 border-orange-200';
      case 'health': return 'bg-red-50 border-red-200';
      case 'checkup': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (activities.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="text-4xl mb-3">📱</div>
          <h3 className="font-semibold text-gray-900 mb-2">No recent activity</h3>
          <p className="text-sm text-gray-600 mb-4">
            Start logging {petName}'s activities to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 4).map((activity) => (
            <div 
              key={activity.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
            >
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600">{activity.time}</p>
              </div>
              <div className="text-lg">{activity.icon}</div>
            </div>
          ))}
        </div>
        {activities.length > 4 && (
          <Button 
            onClick={() => navigate('/activity')}
            variant="outline"
            size="sm"
            className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            View All Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
