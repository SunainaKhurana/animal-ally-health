
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { usePetContext } from '@/contexts/PetContext';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import PetDashboard from '@/components/pet-zone/PetDashboard';
import PetLoader from '@/components/ui/PetLoader';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import { FlexibleEmptyState } from '@/components/common/FlexibleEmptyState';
import { useGuestMode } from '@/contexts/GuestModeContext';
import welcomePetsJourney from '@/assets/welcome-pets-journey.png';

const Index = () => {
  const navigate = useNavigate();
  const { pets, loading, error, refetch } = usePets();
  const { selectedPet } = usePetContext();
  const { setGuestMode } = useGuestMode();

  useEffect(() => {
    document.title = 'PetZone';
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <PetLoader type="chasing" size="md" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">PetZone</h1>
        </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">😿</div>
            <p className="text-red-500 mb-4">Error loading pets: {error}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>

        <PetZoneNavigation />
      </div>
    );
  }

  // Show no pets state
  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">PetZone</h1>
        </div>
        </div>

        {/* No pets content */}
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <FlexibleEmptyState
            title="Get started on the journey to track your pet's health"
            description="Add your first pet to unlock personalized health tracking, AI-powered insights, and comprehensive care management."
            illustration={welcomePetsJourney}
            primaryAction={{
              label: "Add New Pet",
              onClick: () => navigate('/settings/add-pet')
            }}
            exploreAction={{
              label: "Explore App Features",
              description: "Take a tour of PetZone's features without adding a pet yet",
              onClick: () => {
                setGuestMode(true);
                navigate('/care');
              }
            }}
          />
        </div>

        <PetZoneNavigation />
      </div>
    );
  }

  // Show rich dashboard content
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PetSwitcher />
            {selectedPet && (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden relative">
                {selectedPet.photo ? (
                  <img 
                    src={selectedPet.photo} 
                    alt={selectedPet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {selectedPet.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rich Dashboard Content */}
      <div className="max-w-lg mx-auto">
        <PetDashboard />
      </div>

      <PetZoneNavigation />
    </div>
  );
};

export default Index;
