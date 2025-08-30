
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
      case 'walk': return 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100';
      case 'feeding': return 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-100';
      case 'health': return 'bg-gradient-to-r from-red-50 to-pink-50 border-red-100';
      case 'checkup': return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100';
      default: return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-100';
    }
  };

  if (activities.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-purple-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="font-semibold text-gray-900 mb-2 text-lg">No recent activity</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">
            Start logging {petName}'s activities to see them here
          </p>
          <Button 
            onClick={() => navigate('/activity')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg rounded-full px-6"
          >
            Log Activity
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 4).map((activity) => (
            <div 
              key={activity.id}
              className={`flex items-center gap-3 p-4 rounded-2xl border ${getActivityColor(activity.type)} backdrop-blur-sm`}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600">{activity.time}</p>
              </div>
              <div className="text-2xl">{activity.icon}</div>
            </div>
          ))}
        </div>
        {activities.length > 4 && (
          <Button 
            onClick={() => navigate('/activity')}
            variant="outline"
            className="w-full mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full"
          >
            View All Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
