
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Activity, 
  FileText, 
  MessageCircle, 
  Calendar,
  Weight,
  Cake,
  Stethoscope,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { formatDate } from '@/lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import emptyPets from '@/assets/empty-pets.png';
import { useEffect } from 'react';

const PetDashboard = () => {
  const { selectedPet, pets, loading, error, retry } = usePetContext();
  const navigate = useNavigate();

  // Debug logging for dashboard
  useEffect(() => {
    console.log('🏠 PetDashboard State:', {
      selectedPet: selectedPet ? { id: selectedPet.id, name: selectedPet.name } : null,
      petsCount: pets.length,
      loading,
      error
    });
  }, [selectedPet, pets, loading, error]);

  // Loading state
  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your pets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-red-800 mb-2">Unable to Load Pets</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={retry} variant="outline" className="text-red-700 border-red-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No pets state
  if (pets.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          illustration={emptyPets}
          title="Welcome to PetZone! 🐾"
          description="Let's add your first furry friend to start tracking their health, activities, and happiness. Your pet's wellness journey begins here!"
          actionLabel="Add My First Pet"
          onAction={() => navigate('/more')}
          className="mt-8"
        />
      </div>
    );
  }

  // No selected pet but pets exist
  if (!selectedPet) {
    return (
      <div className="p-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-orange-800 mb-2">Select a Pet</h3>
            <p className="text-orange-600 mb-4">
              You have {pets.length} pet{pets.length > 1 ? 's' : ''} but none is currently selected.
            </p>
            <p className="text-sm text-orange-500">
              Use the pet switcher in the top right to select a pet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6 p-4">
      {/* Pet Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={selectedPet.photo} alt={selectedPet.name} />
              <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                {selectedPet.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{selectedPet.name}</h1>
              <p className="text-gray-600 capitalize">{selectedPet.breed} {selectedPet.type}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {selectedPet.gender}
                </Badge>
                {selectedPet.reproductiveStatus && selectedPet.reproductiveStatus !== 'not_yet' && (
                  <Badge variant="outline" className="capitalize">
                    {selectedPet.reproductiveStatus}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Cake className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="font-semibold">{calculateAge(selectedPet.dateOfBirth)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Weight className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Weight</p>
                <p className="font-semibold">{selectedPet.weight} {selectedPet.weightUnit || 'lbs'}</p>
              </div>
            </div>
          </div>

          {/* Health Conditions */}
          {selectedPet.preExistingConditions && selectedPet.preExistingConditions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Health Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {selectedPet.preExistingConditions.map((condition, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/care')}>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Health Care</h3>
            <p className="text-sm text-gray-600">Medical records & reports</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/activity')}>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Activity</h3>
            <p className="text-sm text-gray-600">Walks & behavior logs</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/assistant')}>
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">Health questions & advice</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-gray-50 transition-colors" 
          onClick={() => navigate(`/health-reports/${selectedPet.id}`)}
        >
          <CardContent className="p-4 text-center">
            <Stethoscope className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Health Reports</h3>
            <p className="text-sm text-gray-600">Upload & analyze reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Placeholder for now */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Recent health logs and activities will appear here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PetDashboard;
