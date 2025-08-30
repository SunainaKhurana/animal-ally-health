
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Plus, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";

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

  // Transform data for the bar chart - convert to minutes for better visualization
  const chartData = weeklyData.map(day => ({
    day: day.day,
    totalMinutes: (day.walks * 30) + (day.feedings * 5) + (day.playtime * 45), // Approximate minutes
    walks: day.walks * 30,
    feedings: day.feedings * 5,
    playtime: day.playtime * 45
  }));

  if (!hasActivity) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-purple-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Activity className="h-5 w-5" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">🎾</div>
          <h3 className="font-semibold text-gray-900 mb-2 text-lg">No activity logged this week</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">
            Start tracking {petName}'s daily activities to see beautiful progress charts!
          </p>
          <Button 
            onClick={() => navigate('/activity')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg rounded-full px-6 py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log First Activity
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <TrendingUp className="h-5 w-5" />
          This Week's Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6366f1', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6366f1', fontSize: 12 }}
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#6366f1' } }}
              />
              <Bar 
                dataKey="totalMinutes" 
                fill="url(#activityGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <span className="text-gray-600">Total Activity</span>
            </div>
          </div>
          <span className="text-indigo-700 font-medium">
            {chartData.reduce((sum, day) => sum + day.totalMinutes, 0)} min this week
          </span>
        </div>
        
        <Button 
          onClick={() => navigate('/activity')}
          variant="outline"
          className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full"
        >
          View All Activities
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActivitySummaryCard;
