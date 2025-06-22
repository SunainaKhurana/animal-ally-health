
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Square, MapPin, Clock, Route, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePets } from "@/hooks/usePets";
import { useToast } from "@/hooks/use-toast";

interface WalkRecord {
  id: string;
  date: string;
  duration: number; // in seconds
  distance: number; // in km
  startTime: string;
  endTime: string;
  calories?: number;
}

const WalksTracker = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePets();
  const { toast } = useToast();
  const pet = pets.find(p => p.id === petId);
  
  const [isWalking, setIsWalking] = useState(false);
  const [walkStartTime, setWalkStartTime] = useState<Date | null>(null);
  const [walkDuration, setWalkDuration] = useState(0);
  const [walkHistory, setWalkHistory] = useState<WalkRecord[]>([]);

  // Load walk history from localStorage
  useEffect(() => {
    if (petId) {
      const savedWalks = localStorage.getItem(`walks_${petId}`);
      if (savedWalks) {
        setWalkHistory(JSON.parse(savedWalks));
      }
    }
  }, [petId]);

  // Save walk history to localStorage
  const saveWalkHistory = (walks: WalkRecord[]) => {
    if (petId) {
      localStorage.setItem(`walks_${petId}`, JSON.stringify(walks));
      setWalkHistory(walks);
    }
  };

  // Redirect if pet is not a dog
  useEffect(() => {
    if (pet && pet.type !== 'dog') {
      toast({
        title: "Feature Not Available",
        description: "Walk tracking is only available for dogs.",
        variant: "destructive",
      });
      navigate('/activity');
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
    const now = new Date();
    setIsWalking(true);
    setWalkStartTime(now);
    setWalkDuration(0);
    toast({
      title: "Walk Started! 🚶‍♂️",
      description: `Started tracking ${pet?.name}'s walk`,
    });
  };

  const stopWalk = () => {
    if (!walkStartTime) return;

    const endTime = new Date();
    const distance = Math.random() * 2 + 0.5; // Mock distance for now
    const calories = Math.floor(walkDuration * 0.1);
    
    const newWalk: WalkRecord = {
      id: Date.now().toString(),
      date: endTime.toISOString().split('T')[0],
      duration: walkDuration,
      distance: parseFloat(distance.toFixed(1)),
      startTime: walkStartTime.toISOString(),
      endTime: endTime.toISOString(),
      calories
    };

    const updatedWalks = [newWalk, ...walkHistory];
    saveWalkHistory(updatedWalks);

    setIsWalking(false);
    setWalkStartTime(null);
    
    toast({
      title: "Walk Completed! 🎉",
      description: `Duration: ${Math.floor(walkDuration / 60)}m ${walkDuration % 60}s, Distance: ${distance.toFixed(1)}km`,
      duration: 5000,
    });
    
    // Analyze walk based on breed
    setTimeout(() => {
      analyzeWalk(walkDuration, distance);
    }, 1000);
  };

  const analyzeWalk = (duration: number, distance: number) => {
    const durationInMinutes = Math.floor(duration / 60);
    let analysis = "";
    
    // Basic analysis based on duration, distance, and breed
    const breedSpecificAdvice = pet?.breed ? getBreedSpecificExerciseAdvice(pet.breed) : "";
    
    if (durationInMinutes >= 30 && distance >= 1.5) {
      analysis = `Excellent walk! This is perfect exercise for ${pet?.name}. ${breedSpecificAdvice}`;
    } else if (durationInMinutes >= 20 && distance >= 1.0) {
      analysis = `Good walk! ${pet?.name} got good exercise today. ${breedSpecificAdvice}`;
    } else {
      analysis = `Short walk completed. Consider longer walks for optimal health benefits. ${breedSpecificAdvice}`;
    }

    toast({
      title: "Walk Analysis 📊",
      description: analysis,
      duration: 7000,
    });
  };

  const getBreedSpecificExerciseAdvice = (breed: string): string => {
    const breedLower = breed.toLowerCase();
    
    if (breedLower.includes('retriever') || breedLower.includes('lab')) {
      return "High-energy breeds like Labs need 60-90 minutes of exercise daily.";
    } else if (breedLower.includes('bulldog') || breedLower.includes('pug')) {
      return "Brachycephalic breeds need shorter, more frequent walks to avoid overheating.";
    } else if (breedLower.includes('husky') || breedLower.includes('malamute')) {
      return "Working breeds need intensive exercise and mental stimulation.";
    } else if (breedLower.includes('chihuahua') || breedLower.includes('yorkshire')) {
      return "Small breeds need moderate exercise but can get tired quickly.";
    }
    
    return "Keep up the regular exercise routine!";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m ${seconds % 60}s`;
  };

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Pet not found</p>
          <Button onClick={() => navigate('/activity')} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  // Calculate today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayWalks = walkHistory.filter(walk => walk.date === today);
  const todayDuration = todayWalks.reduce((sum, walk) => sum + walk.duration, 0);
  const todayDistance = todayWalks.reduce((sum, walk) => sum + walk.distance, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>
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
              <div className="text-lg font-bold">{Math.floor(todayDuration / 60)}m</div>
              <div className="text-xs text-gray-600">Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <MapPin className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <div className="text-lg font-bold">{todayDistance.toFixed(1)}km</div>
              <div className="text-xs text-gray-600">Distance</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Route className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <div className="text-lg font-bold">{todayWalks.length}</div>
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
              {walkHistory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No walks recorded yet</p>
                  <p className="text-sm text-gray-400">Start your first walk above!</p>
                </div>
              ) : (
                walkHistory.slice(0, 10).map((walk, index) => (
                  <div key={walk.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium">{walk.date}</p>
                      <p className="text-sm text-gray-600">
                        {formatDuration(walk.duration)} • {walk.distance}km
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {walk.calories || Math.floor(walk.duration * 0.1)} cal
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalksTracker;
