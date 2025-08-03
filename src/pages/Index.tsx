
import PetDashboard from "@/components/pet-zone/PetDashboard";
import PetSwitcher from "@/components/pet-zone/PetSwitcher";
import PetZoneNavigation from "@/components/navigation/PetZoneNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePetContext } from "@/contexts/PetContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Index = () => {
  const { user, session, forceReauth } = useAuth();
  const { pets, loading: petsLoading, error: petsError } = usePetContext();
  const [showDebug, setShowDebug] = useState(false);

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
            <div>Pets Loading: {petsLoading ? 'Yes' : 'No'}</div>
            <div>Pets Error: {petsError || 'None'}</div>
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
