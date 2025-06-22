
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Square, MapPin, Clock, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePets } from "@/hooks/usePets";
import { useToast } from "@/hooks/use-toast";

const WalksTracker = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePets();
  const { toast } = useToast();
  const pet = pets.find(p => p.id === petId);
  
  const [isWalking, setIsWalking] = useState(false);
  const [walkStartTime, setWalkStartTime] = useState<Date | null>(null);
  const [walkDuration, setWalkDuration] = useState(0);

  // Redirect if pet is not a dog
  useEffect(() => {
    if (pet && pet.type !== 'dog') {
      toast({
        title: "Feature Not Available",
        description: "Walk tracking is only available for dogs.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [pet, navigate, toast]);

  // Timer for walk duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWalking && walkStartTime) {
      interval = setInterval(() => {
        setWalkDuration(Math.floor((Date.now() - walkStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWalking, walkStartTime]);

  const startWalk = () => {
    setIsWalking(true);
    setWalkStartTime(new Date());
    setWalkDuration(0);
    toast({
      title: "Walk Started! 🚶‍♂️",
      description: `Started tracking ${pet?.name}'s walk`,
    });
  };

  const stopWalk = () => {
    setIsWalking(false);
    setWalkStartTime(null);
    
    // Mock walk data
    const mockDistance = (Math.random() * 2 + 0.5).toFixed(1);
    const mockCalories = Math.floor(walkDuration * 0.1);
    
    toast({
      title: "Walk Completed! 🎉",
      description: `Duration: ${Math.floor(walkDuration / 60)}m ${walkDuration % 60}s, Distance: ${mockDistance}km`,
      duration: 5000,
    });
    
    // Show walk analysis based on breed
    setTimeout(() => {
      analyzeWalk(walkDuration, parseFloat(mockDistance));
    }, 1000);
  };

  const analyzeWalk = (duration: number, distance: number) => {
    const durationInMinutes = Math.floor(duration / 60);
    let analysis = "";
    
    // Basic analysis based on duration and distance
    if (durationInMinutes >= 30 && distance >= 1.5) {
      analysis = "Excellent walk! This is perfect exercise for your dog's health and wellbeing.";
    } else if (durationInMinutes >= 20 && distance >= 1.0) {
      analysis = "Good walk! Your dog got good exercise today.";
    } else {
      analysis = "Short walk completed. Consider longer walks for optimal health benefits.";
    }

    toast({
      title: "Walk Analysis 📊",
      description: analysis,
      duration: 5000,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Mock recent walks data
  const recentWalks = [
    { date: '2024-06-21', duration: '25 min', distance: '1.2 km', calories: 150 },
    { date: '2024-06-20', duration: '30 min', distance: '1.8 km', calories: 180 },
    { date: '2024-06-19', duration: '20 min', distance: '1.0 km', calories: 120 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">{pet.name}'s Walks</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Active Walk Card */}
        <Card className={`${isWalking ? 'bg-green-50 border-green-200' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-green-500" />
              {isWalking ? 'Walk in Progress' : 'Start New Walk'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {isWalking && (
              <div className="text-4xl font-bold text-green-600">
                {formatTime(walkDuration)}
              </div>
            )}
            
            <Button
              onClick={isWalking ? stopWalk : startWalk}
              className={`w-full h-16 text-lg ${
                isWalking 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isWalking ? (
                <>
                  <Square className="h-6 w-6 mr-2" />
                  Stop Walk
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-2" />
                  Start Walk
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div className="text-lg font-bold">45m</div>
              <div className="text-xs text-gray-600">Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <MapPin className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <div className="text-lg font-bold">2.4km</div>
              <div className="text-xs text-gray-600">Distance</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Route className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <div className="text-lg font-bold">2</div>
              <div className="text-xs text-gray-600">Walks</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Walks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Walks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentWalks.map((walk, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium">{walk.date}</p>
                    <p className="text-sm text-gray-600">{walk.duration} • {walk.distance}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{walk.calories} cal</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>5.2km / 10km</span>
                <span>52%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '52%' }}></div>
              </div>
              <p className="text-xs text-gray-600">Keep it up! You're on track to meet your weekly walking goal.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalksTracker;
