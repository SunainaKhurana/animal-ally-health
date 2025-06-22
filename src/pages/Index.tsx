
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import PetSwitcher from "@/components/pets/PetSwitcher";
import PetInfoSection from "@/components/pets/PetInfoSection";
import AddPetDialog from "@/components/pets/AddPetDialog";
import EditPetDialog from "@/components/pets/EditPetDialog";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { AuthForm } from "@/components/auth/AuthForm";
import { usePets } from "@/hooks/usePets";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const Index = () => {
  const { pets, loading, user, addPet, updatePet, deletePet } = usePets();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const [isEditPetOpen, setIsEditPetOpen] = useState(false);
  const { toast } = useToast();

  // Auto-select first pet when pets load
  useEffect(() => {
    if (pets.length > 0 && !selectedPet) {
      setSelectedPet(pets[0]);
    }
  }, [pets, selectedPet]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Show auth form if user is not logged in
  if (!user) {
    return <AuthForm />;
  }

  const handleAddPet = async (newPet: any) => {
    const addedPet = await addPet(newPet);
    if (addedPet) {
      setSelectedPet(addedPet);
    }
    setIsAddPetOpen(false);
  };

  const handleEditPet = () => {
    setIsEditPetOpen(true);
  };

  const handleUpdatePet = async (updatedPet: Pet) => {
    await updatePet(updatedPet);
    setSelectedPet(updatedPet);
    setIsEditPetOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🐕 🐱</div>
          <p className="text-gray-600">Loading your pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PetHealth</h1>
            <p className="text-sm text-gray-600">Your pet's wellness companion</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {pets.length === 0 ? (
          /* Empty State */
          <div className="p-4 pt-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🐕 🐱</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to PetHealth!</h2>
              <p className="text-gray-600 mb-6">Add your first pet to get started tracking their health and wellness.</p>
              <Button 
                onClick={() => setIsAddPetOpen(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Add Your First Pet
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Pet Switcher */}
            <div className="bg-white border-b border-gray-100">
              <PetSwitcher
                pets={pets}
                selectedPet={selectedPet}
                onSelectPet={setSelectedPet}
                onAddPet={() => setIsAddPetOpen(true)}
              />
            </div>

            {/* Selected Pet Info */}
            {selectedPet && (
              <div className="p-4 pb-24">
                <div className="mb-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                    {selectedPet.photo ? (
                      <img 
                        src={selectedPet.photo} 
                        alt={selectedPet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-white">
                        {selectedPet.type === 'dog' ? '🐕' : '🐱'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPet.name}</h2>
                  <p className="text-gray-600">{selectedPet.breed} • {selectedPet.type}</p>
                </div>

                <PetInfoSection
                  pet={selectedPet}
                  onEdit={handleEditPet}
                />
              </div>
            )}

            {/* Floating Action Button */}
            <FloatingActionButton onClick={() => setIsAddPetOpen(true)} />
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddPetDialog 
        open={isAddPetOpen} 
        onOpenChange={setIsAddPetOpen}
        onAddPet={handleAddPet}
      />

      <EditPetDialog
        open={isEditPetOpen}
        onOpenChange={setIsEditPetOpen}
        pet={selectedPet}
        onUpdatePet={handleUpdatePet}
      />
    </div>
  );
};

export default Index;
