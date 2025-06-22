
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { calculateAge } from "@/lib/dateUtils";
import { useState } from "react";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const getTypeEmoji = (type: string) => {
    return type === 'dog' ? '🐕' : '🐱';
  };

  const getGenderEmoji = (gender: string) => {
    return gender === 'male' ? '♂️' : '♀️';
  };

  const age = calculateAge(pet.dateOfBirth);
  const weightUnit = pet.weightUnit || 'lbs';

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent onClick when clicking delete button
    if ((e.target as HTMLElement).closest('[data-delete-button]')) {
      return;
    }
    onClick();
  };

  const handleDelete = () => {
    onDelete();
    setIsDeleteDialogOpen(false);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-orange-200" 
      onClick={handleCardClick}
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
                {age} • {pet.weight} {weightUnit}
              </span>
            </div>

            {pet.nextVaccination && (
              <div className="text-xs text-orange-600 font-medium">
                Next vaccination: {pet.nextVaccination}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <div data-delete-button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Pet Profile</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {pet.name}'s profile? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetCard;
