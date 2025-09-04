
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSmartActivityData } from "@/hooks/useSmartActivityData";

interface RecentActivityFeedProps {
  activities: any[];
  petName: string;
}

const RecentActivityFeed = ({ petName }: RecentActivityFeedProps) => {
  const navigate = useNavigate();
  const { activities, loading, showWeekly } = useSmartActivityData();

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Today's Activities
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Map activity types to specific colors and icons
  const getActivityIcon = (type: string, title: string) => {
    if (type === 'medication' || title.toLowerCase().includes('medication')) {
      return { icon: '💊', color: 'bg-purple-100', textColor: 'text-purple-700' };
    }
    if (type === 'symptom' || title.toLowerCase().includes('symptom')) {
      return { icon: '🩺', color: 'bg-red-100', textColor: 'text-red-700' };
    }
    if (type === 'health_report' || title.toLowerCase().includes('vaccine') || title.toLowerCase().includes('report')) {
      return { icon: '📋', color: 'bg-green-100', textColor: 'text-green-700' };
    }
    if (type === 'walk' || title.toLowerCase().includes('walk')) {
      return { icon: '🚶‍♂️', color: 'bg-blue-100', textColor: 'text-blue-700' };
    }
    // Default
    return { icon: '📋', color: 'bg-blue-100', textColor: 'text-blue-700' };
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-semibold text-gray-900">
              {showWeekly ? "This Week's Activities" : "Today's Activities"}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-purple-600 hover:bg-purple-50 text-sm font-medium"
            onClick={() => navigate('/health-activity')}
          >
            See All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 3).map((activity) => {
              const activityStyle = getActivityIcon(activity.type, activity.title);
              return (
                <div 
                  key={activity.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg -m-3 group"
                  onClick={() => navigate(activity.route)}
                >
                  <div className={`w-10 h-10 rounded-full ${activityStyle.color} flex items-center justify-center text-lg`}>
                    {activityStyle.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 mb-3">
              No activities recorded {showWeekly ? 'this week' : 'today'}
            </p>
            <Button
              onClick={() => navigate('/activity')}
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log First Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
