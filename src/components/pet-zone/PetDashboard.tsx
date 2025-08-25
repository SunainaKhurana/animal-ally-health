
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Activity, Calendar, Scale, Stethoscope } from "lucide-react";
import { usePetContext } from "@/contexts/PetContext";
import { useNavigate } from "react-router-dom";
import PetLoader from "@/components/ui/PetLoader";

const PetDashboard = () => {
  const { selectedPet, pets, loading, error, retry } = usePetContext();
  const navigate = useNavigate();

  if (loading) {
    return <PetLoader type="chasing" size="md" />;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={retry} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="max-w-sm mx-auto">
          <img 
            src="/src/assets/empty-pets.png" 
            alt="No pets" 
            className="w-32 h-32 mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pets Yet</h3>
          <p className="text-gray-600 mb-4">Add your first pet to get started with tracking their health and activities.</p>
          <Button 
            onClick={() => navigate('/more')} 
            className="bg-orange-500 hover:bg-orange-600"
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

  return (
    <div className="p-4 space-y-6">
      {/* Pet Overview Card - Non-clickable */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center overflow-hidden">
              {selectedPet.photo ? (
                <img 
                  src={selectedPet.photo} 
                  alt={selectedPet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-white">
                  {selectedPet.type === 'dog' ? '🐕' : '🐱'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-gray-900">{selectedPet.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="capitalize">{selectedPet.breed || 'Unknown Breed'}</span>
                <span>{calculateAge(selectedPet.dateOfBirth)} years old</span>
                <span className="capitalize">{selectedPet.gender}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Scale className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{selectedPet.weight}</p>
            <p className="text-sm text-gray-600">{selectedPet.weightUnit || 'lbs'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">Good</p>
            <p className="text-sm text-gray-600">Health Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/activity')}
          >
            <Activity className="h-4 w-4 mr-3" />
            Log Activity
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/care')}
          >
            <Stethoscope className="h-4 w-4 mr-3" />
            Health Records
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/activity')}
          >
            <Calendar className="h-4 w-4 mr-3" />
            Schedule Reminder
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activities</p>
            <p className="text-sm">Start logging activities to see them here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PetDashboard;
