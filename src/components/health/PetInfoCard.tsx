
import { Card, CardContent } from "@/components/ui/card";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  gender: 'male' | 'female';
  photo?: string;
}

interface PetInfoCardProps {
  pet: Pet;
}

const PetInfoCard = ({ pet }: PetInfoCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {pet.photo && (
            <img 
              src={pet.photo} 
              alt={pet.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{pet.name}</h2>
            <p className="text-orange-100">
              {pet.breed} • {pet.type} • {pet.gender}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetInfoCard;
