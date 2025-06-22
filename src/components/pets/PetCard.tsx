
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  nextVaccination?: string;
}

interface PetCardProps {
  pet: Pet;
  onClick: () => void;
  onDelete: () => void;
}

const PetCard = ({ pet, onClick, onDelete }: PetCardProps) => {
  const navigate = useNavigate();
  
  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m old` : `${years} year${years !== 1 ? 's' : ''} old`;
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3" onClick={onClick}>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              {pet.photo ? (
                <img 
                  src={pet.photo} 
                  alt={pet.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg">{pet.type === 'dog' ? '🐕' : '🐱'}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{pet.name}</h3>
              <p className="text-sm text-gray-600">
                {pet.breed} • {calculateAge(pet.dateOfBirth)}
              </p>
              <p className="text-xs text-gray-500">
                {pet.weight} {pet.weightUnit || 'lbs'} • {pet.gender}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClick}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/health/${pet.id}`)}>
                <FileText className="h-4 w-4 mr-2" />
                Health Records
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Pet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetCard;
