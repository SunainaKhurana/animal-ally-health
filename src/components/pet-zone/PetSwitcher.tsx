
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
        className="bg-orange-500 hover:bg-orange-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Pet
      </Button>
    );
  }

  if (pets.length === 1) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={selectedPet?.photo} alt={selectedPet?.name} />
          <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
            {selectedPet?.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-gray-900">{selectedPet?.name}</span>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedPet?.photo} alt={selectedPet?.name} />
            <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
              {selectedPet?.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-gray-900">{selectedPet?.name}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-auto">
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
