
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Settings, 
  User, 
  Phone, 
  Info,
  Edit,
  Trash2,
  LogOut
} from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useAuth } from '@/contexts/AuthContext';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AddPetDialog from '@/components/pets/AddPetDialog';
import EditPetDialog from '@/components/pets/EditPetDialog';

const MoreTab = () => {
  const { pets, selectedPet, addPet, updatePet, deletePet } = usePetContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showAddPet, setShowAddPet] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  const handleAddPet = async (petData: any) => {
    const newPet = await addPet(petData);
    if (newPet) {
      setShowAddPet(false);
    }
  };

  const handleUpdatePet = async (updatedPet: any) => {
    await updatePet(updatedPet);
    setEditingPet(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">More</h1>
          <PetSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Pet Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Pet Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setShowAddPet(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Pet
            </Button>

            {pets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Manage Existing Pets</h4>
                {pets.map((pet) => (
                  <div key={pet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{pet.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{pet.breed} {pet.type}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPet(pet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePet(pet.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Account & Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4 mr-2" />
              User Profile
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              App Settings
            </Button>
            <Button 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
              variant="outline"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-500" />
              Support & Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Emergency Vet Contacts
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Info className="h-4 w-4 mr-2" />
              Help & FAQ
            </Button>
          </CardContent>
        </Card>
      </div>

      <PetZoneNavigation />

      {/* Dialogs */}
      <AddPetDialog
        open={showAddPet}
        onOpenChange={setShowAddPet}
        onAddPet={handleAddPet}
      />

      <EditPetDialog
        open={!!editingPet}
        onOpenChange={() => setEditingPet(null)}
        pet={editingPet}
        onUpdatePet={handleUpdatePet}
      />
    </div>
  );
};

export default MoreTab;
