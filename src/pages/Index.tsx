
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, LogOut } from "lucide-react";
import PetCard from "@/components/pets/PetCard";
import AddPetDialog from "@/components/pets/AddPetDialog";
import EditPetDialog from "@/components/pets/EditPetDialog";
import VaccinationUpload from "@/components/vaccinations/VaccinationUpload";
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
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const [isEditPetOpen, setIsEditPetOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const { toast } = useToast();

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
    await addPet(newPet);
    setIsAddPetOpen(false);
  };

  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet);
    setIsEditPetOpen(true);
  };

  const handleUpdatePet = async (updatedPet: Pet) => {
    await updatePet(updatedPet);
    setSelectedPet(null);
    setIsEditPetOpen(false);
  };

  const handleDeletePet = async (petId: string) => {
    await deletePet(petId);
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
            <p className="text-sm text-gray-600">Track your pet's wellness</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Welcome back! 👋</h2>
            <p className="text-orange-100">Keep your furry friends healthy and happy</p>
          </CardContent>
        </Card>

        {/* My Pets Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Pets</h3>
            <Button 
              onClick={() => setIsAddPetOpen(true)}
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600 rounded-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Pet
            </Button>
          </div>

          <div className="space-y-3">
            {pets.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 mb-4">🐕 🐱</div>
                  <h4 className="font-medium text-gray-900 mb-2">No pets yet</h4>
                  <p className="text-sm text-gray-600 mb-4">Add your first pet to get started</p>
                  <Button onClick={() => setIsAddPetOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Pet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pets.map((pet) => (
                <PetCard 
                  key={pet.id} 
                  pet={pet} 
                  onClick={() => handleEditPet(pet)}
                  onDelete={() => handleDeletePet(pet.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {pets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Manage your pet's health records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => document.getElementById('vaccination-upload')?.click()}
              >
                📋 Upload Vaccination Record
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                📅 View Upcoming Appointments
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                📊 Health Summary
              </Button>
            </CardContent>
          </Card>
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

      {/* Hidden file input for vaccination upload */}
      <VaccinationUpload selectedPet={selectedPet} />
    </div>
  );
};

export default Index;
