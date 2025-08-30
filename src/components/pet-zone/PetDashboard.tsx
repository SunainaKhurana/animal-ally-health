
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
      <div className="p-4 text-center">
        <div className="max-w-sm mx-auto">
          <div className="text-8xl mb-4">🐾</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Pet Zone!</h3>
          <p className="text-gray-600 mb-4">Add your first furry friend to get started with tracking their health and activities.</p>
          <Button 
            onClick={() => navigate('/more')} 
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Pet
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedPet) {
    return (
      <div className="p-4 text-center">
        <div className="text-6xl mb-4">🐕</div>
        <p className="text-gray-600">Please select a pet to view their dashboard.</p>
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
    <div className="p-4 space-y-6">
      {/* Pet Overview Card */}
      <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 text-9xl opacity-10 transform rotate-12">
          {selectedPet.type === 'dog' ? '🐕' : '🐱'}
        </div>
        <CardHeader className="relative">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-3 border-white/30">
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
              <CardTitle className="text-2xl font-bold">{selectedPet.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-white/90 mt-2">
                <span className="capitalize">{selectedPet.breed || 'Mixed Breed'}</span>
                <span>{calculateAge(selectedPet.dateOfBirth)} years old</span>
                <span className="capitalize">{selectedPet.gender}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Heart className="h-4 w-4 text-pink-200" />
                <span className="text-sm text-white/90">{selectedPet.weight} {selectedPet.weightUnit || 'lbs'}</span>
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
