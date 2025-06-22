
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Heart, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface PetCardProps {
  pet: Pet;
  onClick?: () => void;
  onDelete?: () => void;
}

const PetCard = ({ pet, onClick, onDelete }: PetCardProps) => {
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

  const handleCardClick = () => {
    navigate(`/pet/${pet.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const age = calculateAge(pet.dateOfBirth);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Pet Photo */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center overflow-hidden">
            {pet.photo ? (
              <img 
                src={pet.photo} 
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-white">
                {pet.type === 'dog' ? '🐕' : '🐱'}
              </span>
            )}
          </div>

          {/* Pet Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{pet.name}</h3>
            <p className="text-gray-600 text-sm">{pet.breed} • {age} years old</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                {pet.weight} {pet.weightUnit || 'lbs'}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {pet.gender}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/health/${pet.id}`);
              }}
            >
              <Heart className="h-4 w-4 text-red-500" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditClick}>
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteClick} className="text-red-600">
                  Delete Pet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetCard;
