
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Heart, Calendar, Activity, FileText, Pill, FlaskConical, Route } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  dateOfBirth: Date;
  weight: number;
  weightUnit?: string;
  gender: 'male' | 'female';
  photo?: string;
}

interface PetInfoSectionProps {
  pet: Pet;
  onEdit: () => void;
}

const PetInfoSection = ({ pet, onEdit }: PetInfoSectionProps) => {
  const navigate = useNavigate();

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = calculateAge(pet.dateOfBirth);

  return (
    <div className="space-y-4">
      {/* Pet Basic Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Breed</p>
              <p className="font-medium">{pet.breed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-medium">{age} years old</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Weight</p>
              <p className="font-medium">{pet.weight} {pet.weightUnit || 'lbs'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-medium capitalize">{pet.gender}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/health/${pet.id}`)}
        >
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-medium text-sm">Health Records</h3>
            <p className="text-xs text-gray-600">View medical history</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-sm">Appointments</h3>
            <p className="text-xs text-gray-600">Upcoming visits</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Pill className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-sm">Medications</h3>
            <p className="text-xs text-gray-600">Current prescriptions</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/weight/${pet.id}`)}
        >
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-medium text-sm">Weight Tracking</h3>
            <p className="text-xs text-gray-600">Monitor growth</p>
          </CardContent>
        </Card>

        {pet.type === 'dog' && (
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow col-span-2"
            onClick={() => navigate(`/walks/${pet.id}`)}
          >
            <CardContent className="p-4 text-center">
              <Route className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-medium text-sm">Walks Tracker</h3>
              <p className="text-xs text-gray-600">Track daily walks and exercise</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Annual Checkup</p>
                <p className="text-xs text-gray-600">2 days ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Pill className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Vaccination Update</p>
                <p className="text-xs text-gray-600">1 week ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <FlaskConical className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Lab Results</p>
                <p className="text-xs text-gray-600">2 weeks ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PetInfoSection;
