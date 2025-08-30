
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Heart, RefreshCw } from "lucide-react";
import { usePetContext } from "@/contexts/PetContext";
import { useNavigate } from "react-router-dom";
import PetLoader from "@/components/ui/PetLoader";
import ActivitySummaryCard from "@/components/dashboard/ActivitySummaryCard";
import HealthStatusCard from "@/components/dashboard/HealthStatusCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import QuickActionsGrid from "@/components/dashboard/QuickActionsGrid";
import { useDashboardData } from "@/hooks/useDashboardData";

const PetDashboard = () => {
  const { selectedPet, pets, loading, error, retry } = usePetContext();
  const { dashboardData, loading: dashboardLoading } = useDashboardData();
  const navigate = useNavigate();

  if (loading) {
    return <PetLoader type="chasing" size="md" />;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-6xl mb-4">😿</div>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={retry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="p-6">
        <Card className="border-dashed border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
          <CardContent className="p-8 text-center">
            <div className="text-8xl mb-6">🐾</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to Pet Zone!</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add your first furry friend to get started with tracking their health and activities in this beautiful dashboard.
            </p>
            <Button 
              onClick={() => navigate('/more')} 
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white shadow-lg rounded-full px-8 py-3 text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPet) {
    return (
      <div className="p-6 text-center">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-gray-600">Please select a pet to view their dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (dashboardLoading) {
    return <PetLoader type="chasing" size="md" />;
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Pet Overview Card */}
      <Card className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 text-white overflow-hidden relative shadow-lg">
        <div className="absolute top-0 right-0 text-9xl opacity-20 transform rotate-12">
          {selectedPet.type === 'dog' ? '🐕' : '🐱'}
        </div>
        <CardHeader className="relative">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-3 border-white/30 shadow-lg">
              {selectedPet.photo ? (
                <img 
                  src={selectedPet.photo} 
                  alt={selectedPet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">
                  {selectedPet.type === 'dog' ? '🐕' : '🐱'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold drop-shadow-sm">{selectedPet.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-white/95 mt-2">
                <span className="capitalize bg-white/20 px-3 py-1 rounded-full">
                  {selectedPet.breed || 'Mixed Breed'}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {calculateAge(selectedPet.dateOfBirth)} years old
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Heart className="h-4 w-4 text-pink-200" />
                <span className="text-sm text-white/95 bg-white/20 px-3 py-1 rounded-full">
                  {selectedPet.weight} {selectedPet.weightUnit || 'lbs'}
                </span>
                <span className="text-sm text-white/95 bg-white/20 px-3 py-1 rounded-full capitalize">
                  {selectedPet.gender}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions Grid */}
      <QuickActionsGrid petId={selectedPet.id} petType={selectedPet.type} />

      {/* Activity Summary */}
      <ActivitySummaryCard 
        weeklyData={dashboardData.weeklyActivity}
        hasActivity={dashboardData.hasActivity}
        petName={selectedPet.name}
      />

      {/* Health Status */}
      <HealthStatusCard 
        petId={selectedPet.id}
        petName={selectedPet.name}
        recentReports={dashboardData.healthReports}
        lastCheckup={dashboardData.lastCheckup}
        healthStatus={dashboardData.healthStatus}
        upcomingReminders={dashboardData.upcomingReminders}
      />

      {/* Recent Activity Feed */}
      <RecentActivityFeed 
        activities={dashboardData.recentActivities}
        petName={selectedPet.name}
      />
    </div>
  );
};

export default PetDashboard;
