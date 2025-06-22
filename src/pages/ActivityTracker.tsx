import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePets } from "@/hooks/usePets";
import PetSelector from "@/components/pets/PetSelector";

const ActivityTracker = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const [selectedPet, setSelectedPet] = useState(pets[0]);

  const handlePetSelection = (pet: any) => {
    setSelectedPet(pet);
  };

  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>No pets found</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Activity Tracker</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Pet Selector */}
        {pets.length > 1 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Select Pet:</p>
            <PetSelector
              pets={pets}
              selectedPet={selectedPet}
              onSelectPet={handlePetSelection}
            />
          </div>
        )}

        {/* Activity Options */}
        <div className="space-y-4">
          {selectedPet?.type === 'dog' && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => navigate(`/walks/${selectedPet.id}`)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚶‍♂️ Walk Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Track walks, distance, and exercise for {selectedPet.name}</p>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/prescriptions/${selectedPet.id}`)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💊 Prescription Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Upload and track prescriptions for {selectedPet.name}</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Health Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View comprehensive health overview for {selectedPet.name}</p>
              <Button className="mt-2" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivityTracker;
