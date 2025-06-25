
import PetDashboard from "@/components/pet-zone/PetDashboard";
import PetSwitcher from "@/components/pet-zone/PetSwitcher";
import PetZoneNavigation from "@/components/navigation/PetZoneNavigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Pet Switcher */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Pet Zone</h1>
          <PetSwitcher />
        </div>
      </div>

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
