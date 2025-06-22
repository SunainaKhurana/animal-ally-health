
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePets } from "@/hooks/usePets";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeightTracking = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePets();
  const pet = pets.find(p => p.id === petId);

  // Mock weight data for demonstration
  const [weightData] = useState([
    { date: '2024-01', weight: 45, age: '1y 6m' },
    { date: '2024-02', weight: 46, age: '1y 7m' },
    { date: '2024-03', weight: 47, age: '1y 8m' },
    { date: '2024-04', weight: 48, age: '1y 9m' },
    { date: '2024-05', weight: 47, age: '1y 10m' },
    { date: '2024-06', weight: 48, age: '1y 11m' },
  ]);

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Pet not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }

  const currentWeight = weightData[weightData.length - 1]?.weight || pet.weight;
  const previousWeight = weightData[weightData.length - 2]?.weight || pet.weight;
  const weightChange = currentWeight - previousWeight;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">{pet.name}'s Weight</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Weight Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{currentWeight}</div>
              <div className="text-sm text-gray-600">Current Weight ({pet.weightUnit})</div>
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

        {/* Weight Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Weight vs Age Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
                    <p className="font-medium">{entry.weight} {pet.weightUnit}</p>
                    <p className="text-sm text-gray-500">Age: {entry.age}</p>
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
                <p className="text-xs text-blue-600">Weight has been stable over the past few months showing healthy growth.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeightTracking;
