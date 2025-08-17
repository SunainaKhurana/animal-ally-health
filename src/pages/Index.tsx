
import PetDashboard from "@/components/pet-zone/PetDashboard";
import PetSwitcher from "@/components/pet-zone/PetSwitcher";
import PetZoneNavigation from "@/components/navigation/PetZoneNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePetContext } from "@/contexts/PetContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const Index = () => {
  const { user, session, forceReauth } = useAuth();
  const { pets, loading: petsLoading, error: petsError, selectedPet } = usePetContext();
  const [showDebug, setShowDebug] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log('📱 Index Page State Update:', {
      user: user ? { id: user.id, email: user.email } : null,
      session: session ? 'Valid' : 'None',
      pets: pets.map(p => ({ id: p.id, name: p.name })),
      selectedPet: selectedPet ? { id: selectedPet.id, name: selectedPet.name } : null,
      petsLoading,
      petsError
    });
  }, [user, session, pets, selectedPet, petsLoading, petsError]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Pet Switcher */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Pet Zone</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs"
            >
              Debug
            </Button>
            <PetSwitcher />
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="max-w-lg mx-auto p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-4">
          <h3 className="font-semibold text-sm mb-2">Debug Info</h3>
          <div className="text-xs space-y-1 font-mono">
            <div>User ID: {user?.id || 'None'}</div>
            <div>Session: {session ? '✅ Valid' : '❌ None'}</div>
            <div>Pets: {pets.length} loaded</div>
            <div>Selected Pet: {selectedPet?.name || 'None'}</div>
            <div>Pets Loading: {petsLoading ? 'Yes' : 'No'}</div>
            <div>Pets Error: {petsError || 'None'}</div>
            {pets.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">Pet List:</div>
                {pets.map(pet => (
                  <div key={pet.id} className="ml-2">
                    • {pet.name} ({pet.type})
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2"
            onClick={() => {
              console.log('🔧 Debug force reauth triggered');
              forceReauth();
            }}
          >
            Force Reauth
          </Button>
        </div>
      )}

      {/* Error State */}
      {petsError && (
        <div className="max-w-lg mx-auto p-4 bg-red-50 border-l-4 border-red-400 mb-4">
          <h3 className="font-semibold text-sm mb-2 text-red-800">Error Loading Pets</h3>
          <p className="text-sm text-red-600">{petsError}</p>
        </div>
      )}

      {/* Loading State */}
      {petsLoading && (
        <div className="max-w-lg mx-auto p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your pets...</p>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-lg mx-auto">
        <PetDashboard />
      </div>

      {/* Bottom Navigation */}
      <PetZoneNavigation />
    </div>
  );
};

export default Index;
