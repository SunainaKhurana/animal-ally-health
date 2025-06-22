
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  gender: 'male' | 'female';
  photo?: string;
}

interface HealthRecordsHeaderProps {
  pet: Pet;
  onToggleUpload: () => void;
}

const HealthRecordsHeader = ({ pet, onToggleUpload }: HealthRecordsHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900">Health Records</h1>
          <p className="text-sm text-gray-600">{pet.name}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleUpload}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default HealthRecordsHeader;
