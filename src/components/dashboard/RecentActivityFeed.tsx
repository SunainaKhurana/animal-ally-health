
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus } from "lucide-react";
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
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Today's Activities
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

  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          {showWeekly ? "This Week's Activities" : "Today's Activities"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -m-2"
                onClick={() => navigate(activity.route)}
              >
                <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center text-lg`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.time}</span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        activity.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        activity.status === 'Analyzed' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'Active' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
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
