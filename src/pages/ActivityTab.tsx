
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, MapPin, Clock, Play, Square, Timer } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import { useWalks } from '@/hooks/useWalks';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ActivityTab = () => {
  const { selectedPet } = usePetContext();
  const { walks, loading, startWalk, endWalk } = useWalks(selectedPet?.id);
  const { toast } = useToast();
  
  const [isWalking, setIsWalking] = useState(false);
  const [currentWalkId, setCurrentWalkId] = useState<string | null>(null);
  const [walkStartTime, setWalkStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);
  const [walkNotes, setWalkNotes] = useState('');

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWalk = async () => {
    if (!selectedPet?.id) return;
    
    try {
      const walkId = await startWalk(selectedPet.id);
      setCurrentWalkId(walkId);
      setIsWalking(true);
      setWalkStartTime(new Date());
      setDuration(0);
      setWalkNotes('');
      
      toast({
        title: "Walk Started! 🚶‍♂️",
        description: `Started tracking walk for ${selectedPet.name}`,
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
      await endWalk(currentWalkId, Math.floor(duration / 60), undefined, undefined);
      setIsWalking(false);
      setCurrentWalkId(null);
      setWalkStartTime(null);
      setDuration(0);
      setWalkNotes('');
      
      toast({
        title: "Walk Completed! 🎉",
        description: `Walk logged for ${selectedPet?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end walk",
        variant: "destructive",
      });
    }
  };

  const todayWalks = walks.filter(walk => {
    const walkDate = new Date(walk.start_time).toDateString();
    const today = new Date().toDateString();
    return walkDate === today;
  });

  const todayTotalMinutes = todayWalks.reduce((total, walk) => total + (walk.duration_minutes || 0), 0);

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Activity</h1>
            <PetSwitcher />
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Please select a pet to track activities</p>
            <PetSwitcher />
          </div>
        </div>
        <PetZoneNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Activity</h1>
          <PetSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Daily Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Daily Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{todayWalks.length}</div>
                <div className="text-sm text-gray-600">Walks Today</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{todayTotalMinutes}</div>
                <div className="text-sm text-gray-600">Minutes Active</div>
              </div>
            </div>
            
            {todayWalks.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-gray-900">Today's Walks</h4>
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

        {/* Walk Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isWalking ? <Square className="h-5 w-5 text-red-500" /> : <Play className="h-5 w-5 text-green-500" />}
              Walk Tracker for {selectedPet.name}
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

            {isWalking && (
              <div className="space-y-2">
                <Label htmlFor="walkNotes">Activity Notes (Optional)</Label>
                <Textarea
                  id="walkNotes"
                  placeholder="How was their energy? Any interesting behaviors during the walk?"
                  value={walkNotes}
                  onChange={(e) => setWalkNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
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

        {/* Recent Activities */}
        {walks.length > todayWalks.length && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Walks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : (
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
              )}
            </CardContent>
          </Card>
        )}

        {/* Exercise Recommendations */}
        {selectedPet.breed && (
          <Card>
            <CardHeader>
              <CardTitle>Exercise Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {getBreedRecommendation(selectedPet.breed, todayWalks.length, todayTotalMinutes)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <PetZoneNavigation />
    </div>
  );
};

const getBreedRecommendation = (breed: string, walkCount: number, totalMinutes: number) => {
  const lowerBreed = breed.toLowerCase();
  
  if (lowerBreed.includes('labrador') || lowerBreed.includes('golden retriever')) {
    return `${breed}s are high-energy dogs that need 60-90 minutes of exercise daily. ${totalMinutes >= 60 ? 'Great job meeting their exercise needs!' : 'Consider adding more activity time.'}`;
  } else if (lowerBreed.includes('bulldog') || lowerBreed.includes('pug')) {
    return `${breed}s need moderate exercise (20-30 minutes daily) due to breathing considerations. Avoid hot weather walks.`;
  } else if (lowerBreed.includes('border collie') || lowerBreed.includes('australian shepherd')) {
    return `${breed}s are working dogs needing 2+ hours of exercise daily including mental stimulation.`;
  } else if (lowerBreed.includes('chihuahua') || lowerBreed.includes('yorkie')) {
    return `Small breeds like ${breed}s need 20-30 minutes of exercise daily, but can get tired quickly.`;
  }
  
  return `${breed}s benefit from regular daily walks. Most dogs need 30-60 minutes of activity per day. You've logged ${totalMinutes} minutes today.`;
};

export default ActivityTab;
