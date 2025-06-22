
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PetSelector from "@/components/pets/PetSelector";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  photo?: string;
}

interface MedicalRecordsCardProps {
  pets: Pet[];
}

const MedicalRecordsCard = ({ pets }: MedicalRecordsCardProps) => {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const navigate = useNavigate();

  const handleViewRecords = () => {
    if (selectedPet) {
      navigate(`/health/${selectedPet.id}`);
    } else if (pets.length === 1) {
      navigate(`/health/${pets[0].id}`);
    }
  };

  const handleQuickUpload = () => {
    if (selectedPet) {
      navigate(`/health/${selectedPet.id}?upload=true`);
    } else if (pets.length === 1) {
      navigate(`/health/${pets[0].id}?upload=true`);
    }
  };

  if (pets.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-500" />
          Medical Records
        </CardTitle>
        <CardDescription>
          View and manage your pet's health records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pets.length > 1 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Select Pet:</p>
            <PetSelector
              pets={pets}
              selectedPet={selectedPet}
              onSelectPet={setSelectedPet}
              placeholder="Choose a pet to view records"
            />
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={handleViewRecords}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            disabled={pets.length > 1 && !selectedPet}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Records
          </Button>
          <Button 
            onClick={handleQuickUpload}
            variant="outline"
            disabled={pets.length > 1 && !selectedPet}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>

        {pets.length === 1 && (
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Records for {pets[0].name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicalRecordsCard;
