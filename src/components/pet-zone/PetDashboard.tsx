
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Heart, RefreshCw, Calendar, Pill, Shield, Sun } from "lucide-react";
import { usePetContext } from "@/contexts/PetContext";
import { useNavigate } from "react-router-dom";
import PetLoader from "@/components/ui/PetLoader";
import ActivitySummaryCard from "@/components/dashboard/ActivitySummaryCard";
import HealthStatusCard from "@/components/dashboard/HealthStatusCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
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
    <div className="p-4 space-y-4 pb-24">
      {/* Good Afternoon Section */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Good afternoon!</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {selectedPet.name} is in excellent health with all vitals in normal range
          </p>
        </CardContent>
      </Card>

      {/* Pet Profile Card */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {selectedPet.photo ? (
                <img 
                  src={selectedPet.photo} 
                  alt={selectedPet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">
                  {selectedPet.type === 'dog' ? '🐕' : '🐱'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{selectedPet.name}</h2>
              <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                <span>{selectedPet.breed || 'Mixed Breed'}</span>
                <span>•</span>
                <span>{calculateAge(selectedPet.dateOfBirth)} years old</span>
                <span>•</span>
                <span>{selectedPet.weight} {selectedPet.weightUnit || 'lbs'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Large Action Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <Button
              onClick={() => navigate('/care')}
              variant="ghost"
              className="w-full h-full flex flex-col items-center gap-3 text-white hover:bg-white/20 border-0 min-h-[100px]"
            >
              <Pill className="h-8 w-8" />
              <span className="text-sm font-medium">Add Medication</span>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-teal-500 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <Button
              onClick={() => navigate('/care')}
              variant="ghost"
              className="w-full h-full flex flex-col items-center gap-3 text-white hover:bg-white/20 border-0 min-h-[100px]"
            >
              <Shield className="h-8 w-8" />
              <span className="text-sm font-medium">Add Vaccine</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <RecentActivityFeed 
        activities={dashboardData.recentActivities}
        petName={selectedPet.name}
      />

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
    </div>
  );
};

export default PetDashboard;
