
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Square, MapPin, Timer, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePets } from "@/hooks/usePets";
import { useWalks } from "@/hooks/useWalks";
import { useToast } from "@/hooks/use-toast";

const WalksTracker = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { pets } = usePets();
  const { walks, loading, startWalk, endWalk } = useWalks(petId);
  const { toast } = useToast();
  
  const [isWalking, setIsWalking] = useState(false);
  const [currentWalkId, setCurrentWalkId] = useState<string | null>(null);
  const [walkStartTime, setWalkStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);

  const pet = pets.find(p => p.id === petId);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWalking && walkStartTime) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - walkStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWalking, walkStartTime]);

  const handleStartWalk = async () => {
    if (!petId) return;
    
    try {
      const walkId = await startWalk(petId);
      setCurrentWalkId(walkId);
      setIsWalking(true);
      setWalkStartTime(new Date());
      setDuration(0);
      
      toast({
        title: "Walk Started! 🚶‍♂️",
        description: `Started tracking walk for ${pet?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start walk tracking",
        variant: "destructive",
      });
    }
  };

  const handleEndWalk = async () => {
    if (!currentWalkId) return;
    
    try {
      await endWalk(currentWalkId, Math.floor(duration / 60));
      setIsWalking(false);
      setCurrentWalkId(null);
      setWalkStartTime(null);
      setDuration(0);
      
      toast({
        title: "Walk Completed! 🎉",
        description: `Walk logged for ${pet?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end walk",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreedAnalysis = (breed?: string, walkCount: number = 0) => {
    if (!breed) return "Regular walks are important for your pet's health and happiness.";
    
    const lowerBreed = breed.toLowerCase();
    
    if (lowerBreed.includes('labrador') || lowerBreed.includes('golden retriever')) {
      return `${breed}s are high-energy dogs that need 60-90 minutes of exercise daily. ${walkCount < 2 ? 'Consider adding more walks!' : 'Great job keeping up with their exercise needs!'}`;
    } else if (lowerBreed.includes('bulldog') || lowerBreed.includes('pug')) {
      return `${breed}s need moderate exercise (20-30 minutes daily) due to breathing considerations. Avoid hot weather walks.`;
    } else if (lowerBreed.includes('border collie') || lowerBreed.includes('australian shepherd')) {
      return `${breed}s are working dogs needing 2+ hours of exercise daily including mental stimulation.`;
    } else if (lowerBreed.includes('chihuahua') || lowerBreed.includes('yorkie')) {
      return `Small breeds like ${breed}s need 20-30 minutes of exercise daily, but can get tired quickly.`;
    }
    
    return `${breed}s benefit from regular daily walks. Adjust duration based on age and energy level.`;
  };

  const todayWalks = walks.filter(walk => {
    const walkDate = new Date(walk.start_time).toDateString();
    const today = new Date().toDateString();
    return walkDate === today;
  });

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Pet not found</p>
              <Button onClick={() => navigate('/activity')} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Walk Tracker</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Pet Info */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              {pet.photo ? (
                <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-white">🐕</span>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{pet.name}</h2>
              <p className="text-sm text-gray-600">{pet.breed}</p>
            </div>
          </CardContent>
        </Card>

        {/* Current Walk Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isWalking ? <Square className="h-5 w-5 text-red-500" /> : <Play className="h-5 w-5 text-green-500" />}
              {isWalking ? 'Walking Now' : 'Start a Walk'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isWalking && (
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {formatDuration(duration)}
                </div>
                <p className="text-sm text-gray-600">Walk duration</p>
              </div>
            )}
            
            <Button
              onClick={isWalking ? handleEndWalk : handleStartWalk}
              className={`w-full h-12 ${isWalking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isWalking ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  End Walk
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Walk
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Breed-specific Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              Exercise Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              {getBreedAnalysis(pet.breed, todayWalks.length)}
            </p>
          </CardContent>
        </Card>

        {/* Today's Walks */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Walks ({todayWalks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-600">Loading...</p>
            ) : todayWalks.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🚶‍♂️</div>
                <p className="text-gray-600">No walks today</p>
                <p className="text-sm text-gray-500">Start your first walk!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayWalks.map((walk) => (
                  <div key={walk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Timer className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(walk.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {walk.duration_minutes && (
                          <p className="text-xs text-gray-600">{walk.duration_minutes} minutes</p>
                        )}
                      </div>
                    </div>
                    {walk.distance_meters && (
                      <div className="text-right">
                        <p className="text-sm font-medium">{(walk.distance_meters / 1000).toFixed(2)} km</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Walk History */}
        {walks.length > todayWalks.length && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Walks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {walks.slice(0, 5).filter(walk => !todayWalks.includes(walk)).map((walk) => (
                  <div key={walk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(walk.start_time).toLocaleDateString()}
                        </p>
                        {walk.duration_minutes && (
                          <p className="text-xs text-gray-600">{walk.duration_minutes} minutes</p>
                        )}
                      </div>
                    </div>
                    {walk.distance_meters && (
                      <div className="text-right">
                        <p className="text-sm font-medium">{(walk.distance_meters / 1000).toFixed(2)} km</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WalksTracker;
