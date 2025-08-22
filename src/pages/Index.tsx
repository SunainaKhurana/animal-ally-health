
import PetDashboard from "@/components/pet-zone/PetDashboard";
import PetSwitcher from "@/components/pet-zone/PetSwitcher";
import PetZoneNavigation from "@/components/navigation/PetZoneNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePetContext } from "@/contexts/PetContext";
import { useEffect } from "react";

const Index = () => {
  const { user, session } = useAuth();
  const { pets, loading: petsLoading, error: petsError, selectedPet } = usePetContext();

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
          <PetSwitcher />
        </div>
      </div>

      {/* Error State */}
      {petsError && (
        <div className="max-w-lg mx-auto p-4 bg-red-50 border-l-4 border-red-400 mb-4">
          <h3 className="font-semibold text-sm mb-2 text-red-800">Error Loading Pets</h3>
          <p className="text-sm text-red-600">{petsError}</p>
        </div>
      )}

      {/* Main Content - PetDashboard handles its own loading state */}
      <div className="max-w-lg mx-auto">
        <PetDashboard />
      </div>

      {/* Bottom Navigation */}
      <PetZoneNavigation />
    </div>
  );
};

export default Index;
