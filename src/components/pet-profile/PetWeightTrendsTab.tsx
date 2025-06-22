
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus, Scale } from "lucide-react";

interface PetWeightTrendsTabProps {
  petId: string;
}

const PetWeightTrendsTab = ({ petId }: PetWeightTrendsTabProps) => {
  // Mock data for demonstration
  const weightData = [
    { date: '2024-01', weight: 45 },
    { date: '2024-02', weight: 46 },
    { date: '2024-03', weight: 47 },
    { date: '2024-04', weight: 48 },
    { date: '2024-05', weight: 47 },
    { date: '2024-06', weight: 48 },
  ];

  const currentWeight = weightData[weightData.length - 1]?.weight || 0;
  const previousWeight = weightData[weightData.length - 2]?.weight || 0;
  const weightChange = currentWeight - previousWeight;

  return (
    <div className="space-y-6">
      {/* Weight Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{currentWeight}</div>
            <div className="text-sm text-gray-600">Current Weight (lbs)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${weightChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weightChange >= 0 ? '+' : ''}{weightChange}
            </div>
            <div className="text-sm text-gray-600">This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Weight Button */}
      <Button className="w-full bg-blue-500 hover:bg-blue-600 h-12">
        <Plus className="h-4 w-4 mr-2" />
        Log Weight
      </Button>

      {/* Weight Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Weight Trend
          </CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Weight chart coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weight History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-gray-500" />
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weightData.slice().reverse().map((entry, index) => (
              <div key={entry.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium">{entry.weight} lbs</p>
                  <p className="text-sm text-gray-500">{entry.date}</p>
                </div>
                {index < weightData.length - 1 && (
                  <div className={`text-sm ${
                    entry.weight >= weightData[weightData.length - 2 - index]?.weight 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {entry.weight >= (weightData[weightData.length - 2 - index]?.weight || 0) ? '+' : ''}
                    {(entry.weight - (weightData[weightData.length - 2 - index]?.weight || 0)).toFixed(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weight Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Healthy Range</p>
              <p className="text-xs text-green-600">Your pet's weight is within the ideal range for their breed and age.</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Steady Progress</p>
              <p className="text-xs text-blue-600">Weight has been stable over the past few months.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PetWeightTrendsTab;
