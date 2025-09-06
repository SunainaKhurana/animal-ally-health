
import { useEffect, useState } from 'react';
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
import AddPetDialog from '@/components/pets/AddPetDialog';
import welcomePetsJourney from '@/assets/welcome-pets-journey.png';

const Index = () => {
  const navigate = useNavigate();
  const { pets, loading, error, refetch } = usePets();
  const { selectedPet, addPet } = usePetContext();
  const [showAddPet, setShowAddPet] = useState(false);

  useEffect(() => {
    document.title = 'PetZone';
  }, []);

  const handleAddPet = async (petData: any) => {
    const newPet = await addPet(petData);
    if (newPet) {
      setShowAddPet(false);
    }
  };

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
          <Card className="border-orange-200 bg-orange-50/30">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src={welcomePetsJourney} 
                  alt="Get started on the journey to track your pet's health"
                  className="w-32 h-32 object-contain opacity-80"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Get started on the journey to track your pet's health
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                Add your first pet to unlock personalized health tracking, AI-powered insights, and comprehensive care management.
              </p>
              <Button 
                onClick={() => setShowAddPet(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Pet
              </Button>
            </CardContent>
          </Card>
        </div>

        <PetZoneNavigation />

        {/* Add Pet Dialog */}
        <AddPetDialog
          open={showAddPet}
          onOpenChange={setShowAddPet}
          onAddPet={handleAddPet}
        />
      </div>
    );
  }

  // Show rich dashboard content
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">
            {selectedPet ? `${selectedPet.name}'s Zone` : 'PetZone'}
          </h1>
          <PetSwitcher />
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
