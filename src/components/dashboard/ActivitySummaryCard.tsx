
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { useWeeklyActivityData } from "@/hooks/useWeeklyActivityData";

interface ActivitySummaryCardProps {
  weeklyData: any[];
  hasActivity: boolean;
  petName: string;
}

const ActivitySummaryCard = ({ petName }: ActivitySummaryCardProps) => {
  const { currentWeek, percentageChange, loading } = useWeeklyActivityData();

  // Transform the data for the chart
  const chartData = currentWeek.map(day => ({
    day: day.day,
    minutes: day.totalMinutes,
    walks: day.walks
  }));

  const maxMinutes = Math.max(...chartData.map(d => d.minutes));
  const hasAnyActivity = chartData.some(d => d.minutes > 0);

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Health Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Health Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAnyActivity ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {chartData.reduce((sum, day) => sum + day.minutes, 0)} min
                </p>
                <p className="text-sm text-gray-600">This week's activity</p>
              </div>
              {percentageChange !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  percentageChange > 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {percentageChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(percentageChange)}%
                </div>
              )}
            </div>

            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.minutes > 0 ? '#8B5CF6' : '#E5E7EB'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-xs text-gray-500">
              {chartData.filter(d => d.walks > 0).length} days with walks this week
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-500 mb-2">No activity recorded yet</p>
            <p className="text-xs text-gray-400">
              Start logging walks to see {petName}'s activity insights
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivitySummaryCard;
