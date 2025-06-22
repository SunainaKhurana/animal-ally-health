
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateAge } from "@/lib/dateUtils";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  dateOfBirth: Date;
  weight: number;
  gender: 'male' | 'female';
  photo?: string;
  nextVaccination?: string;
}

interface PetCardProps {
  pet: Pet;
  onClick: () => void;
}

const PetCard = ({ pet, onClick }: PetCardProps) => {
  const getTypeEmoji = (type: string) => {
    return type === 'dog' ? '🐕' : '🐱';
  };

  const getGenderEmoji = (gender: string) => {
    return gender === 'male' ? '♂️' : '♀️';
  };

  const age = calculateAge(pet.dateOfBirth);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-orange-200" 
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Pet Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center text-2xl">
            {pet.photo ? (
              <img src={pet.photo} alt={pet.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getTypeEmoji(pet.type)
            )}
          </div>

          {/* Pet Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900">{pet.name}</h4>
              <span className="text-sm">{getGenderEmoji(pet.gender)}</span>
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {pet.breed || pet.type}
              </Badge>
              <span className="text-xs text-gray-500">
                {age} • {pet.weight} lbs
              </span>
            </div>

            {pet.nextVaccination && (
              <div className="text-xs text-orange-600 font-medium">
                Next vaccination: {pet.nextVaccination}
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetCard;
