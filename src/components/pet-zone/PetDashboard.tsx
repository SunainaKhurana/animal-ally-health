
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
  Stethoscope
} from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { formatDate } from '@/lib/dateUtils';
import { useNavigate } from 'react-router-dom';

const PetDashboard = () => {
  const { selectedPet } = usePetContext();
  const navigate = useNavigate();

  if (!selectedPet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No pet selected</p>
          <Button onClick={() => navigate('/more')}>Add Your First Pet</Button>
        </div>
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

        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/care')}>
          <CardContent className="p-4 text-center">
            <Stethoscope className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Quick Log</h3>
            <p className="text-sm text-gray-600">Report symptoms</p>
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
