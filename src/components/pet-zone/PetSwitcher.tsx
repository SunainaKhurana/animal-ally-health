
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChevronDown, Plus } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useNavigate } from 'react-router-dom';

const PetSwitcher = () => {
  const { selectedPet, pets, setSelectedPet } = usePetContext();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!selectedPet && pets.length === 0) {
    return (
      <Button 
        onClick={() => navigate('/more')} 
        className="bg-orange-500 hover:bg-orange-600 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Pet
      </Button>
    );
  }

  if (pets.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-white">
          {selectedPet ? `${selectedPet.name}'s Zone` : 'PetZone'}
        </h1>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-0 text-white hover:bg-white/20">
          <h1 className="text-lg font-semibold text-white">
            {selectedPet ? `${selectedPet.name}'s Zone` : 'PetZone'}
          </h1>
          <ChevronDown className="h-4 w-4 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-auto bg-white">
        <SheetHeader>
          <SheetTitle>Select Pet</SheetTitle>
        </SheetHeader>
        <div className="grid gap-3 mt-4 pb-4">
          {pets.map((pet) => (
            <Button
              key={pet.id}
              variant={selectedPet?.id === pet.id ? "default" : "ghost"}
              className="flex items-center gap-3 justify-start h-auto p-3"
              onClick={() => {
                setSelectedPet(pet);
                setOpen(false);
              }}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={pet.photo} alt={pet.name} />
                <AvatarFallback className="bg-orange-100 text-orange-600">
                  {pet.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium">{pet.name}</p>
                <p className="text-sm text-gray-500 capitalize">{pet.breed} {pet.type}</p>
              </div>
            </Button>
          ))}
          <Button 
            variant="outline" 
            className="flex items-center gap-2 justify-center h-12"
            onClick={() => {
              navigate('/more');
              setOpen(false);
            }}
          >
            <Plus className="h-4 w-4" />
            Add New Pet
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PetSwitcher;
