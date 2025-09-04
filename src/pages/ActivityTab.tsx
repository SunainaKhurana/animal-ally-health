
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Timer, TrendingUp } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useGuestMode } from '@/contexts/GuestModeContext';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import { useWalks } from '@/hooks/useWalks';
import QuickWalkLogger from '@/components/quick-actions/QuickWalkLogger';

const ActivityTab = () => {
  const { selectedPet } = usePetContext();
  const { isGuestMode, guestPetName } = useGuestMode();
  const { walks, loading } = useWalks(selectedPet?.id);

  const effectivePet = selectedPet || (isGuestMode ? { id: 'guest', name: guestPetName, breed: 'Mixed Breed' } : null);

  const todayWalks = isGuestMode ? [
    { id: 'demo1', start_time: new Date().toISOString(), duration_minutes: 25, notes: 'Morning walk in the park' },
    { id: 'demo2', start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), duration_minutes: 15, notes: 'Quick bathroom break' }
  ] : walks.filter(walk => {
    const walkDate = new Date(walk.start_time).toDateString();
    const today = new Date().toDateString();
    return walkDate === today;
  });

  const todayTotalMinutes = todayWalks.reduce((total, walk) => total + (walk.duration_minutes || 0), 0);

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

  if (!effectivePet) {
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
        {/* Quick Walk Logger */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Walk Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {isGuestMode ? 'Experience how walk logging works (demo mode)' : `Log walks for ${effectivePet.name} or multiple pets together.`}
            </p>
            {isGuestMode ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-3">Demo: Walk Logger Interface</p>
                <Button className="w-full" variant="outline" disabled>
                  <Activity className="h-4 w-4 mr-2" />
                  Start Walk (Demo Mode)
                </Button>
              </div>
            ) : (
              <QuickWalkLogger />
            )}
          </CardContent>
        </Card>

        {/* Daily Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Daily Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
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
              <div className="space-y-2">
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
                        {walk.notes && (
                          <p className="text-xs text-gray-600">{walk.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        {((!isGuestMode && walks.length > todayWalks.length) || isGuestMode) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Walks {isGuestMode && '(Demo)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !isGuestMode ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {isGuestMode ? (
                    // Demo recent walks
                    [
                      { id: 'demo3', start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), duration_minutes: 30, notes: 'Park adventure' },
                      { id: 'demo4', start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), duration_minutes: 20, notes: 'Neighborhood stroll' }
                    ].map((walk) => (
                      <div key={walk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Timer className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-sm">
                              {new Date(walk.start_time).toLocaleDateString()}
                            </p>
                            {walk.duration_minutes && (
                              <p className="text-xs text-gray-600">{walk.duration_minutes} minutes</p>
                            )}
                            {walk.notes && (
                              <p className="text-xs text-gray-600">{walk.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                   ) : (
                     walks.slice(0, 5).filter(walk => {
                       if (isGuestMode) return true;
                       return !todayWalks.some(todayWalk => todayWalk.id === walk.id);
                     }).map((walk) => (
                      <div key={walk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Timer className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-sm">
                              {new Date(walk.start_time).toLocaleDateString()}
                            </p>
                            {walk.duration_minutes && (
                              <p className="text-xs text-gray-600">{walk.duration_minutes} minutes</p>
                            )}
                            {walk.notes && (
                              <p className="text-xs text-gray-600">{walk.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Exercise Recommendations */}
        {effectivePet.breed && (
          <Card>
            <CardHeader>
              <CardTitle>Exercise Guidelines for {effectivePet.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {isGuestMode ? 
                  `Mixed breeds typically need 30-60 minutes of exercise daily. You've logged ${todayTotalMinutes} minutes today in this demo.` :
                  getBreedRecommendation(effectivePet.breed, todayWalks.length, todayTotalMinutes)
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <PetZoneNavigation />
    </div>
  );
};

export default ActivityTab;
