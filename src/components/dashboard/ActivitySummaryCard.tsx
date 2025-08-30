
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Plus, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActivityData {
  day: string;
  walks: number;
  feedings: number;
  playtime: number;
}

interface ActivitySummaryCardProps {
  weeklyData: ActivityData[];
  hasActivity: boolean;
  petName: string;
}

const ActivitySummaryCard = ({ weeklyData, hasActivity, petName }: ActivitySummaryCardProps) => {
  const navigate = useNavigate();

  const maxValue = Math.max(...weeklyData.map(d => d.walks + d.feedings + d.playtime), 1);

  if (!hasActivity) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Activity className="h-5 w-5" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="text-4xl mb-3">🎾</div>
          <h3 className="font-semibold text-gray-900 mb-2">No activity logged this week</h3>
          <p className="text-sm text-gray-600 mb-4">
            Start tracking {petName}'s daily activities to see their progress!
          </p>
          <Button 
            onClick={() => navigate('/activity')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <TrendingUp className="h-5 w-5" />
          This Week's Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weeklyData.map((day, index) => {
            const total = day.walks + day.feedings + day.playtime;
            const percentage = (total / maxValue) * 100;
            
            return (
              <div key={day.day} className="flex items-center gap-3">
                <div className="w-8 text-xs font-medium text-gray-600">{day.day}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-6 text-xs text-gray-600">{total}</div>
              </div>
            );
          })}
        </div>
        <Button 
          onClick={() => navigate('/activity')}
          variant="outline"
          size="sm"
          className="w-full mt-4 border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          View All Activities
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActivitySummaryCard;
