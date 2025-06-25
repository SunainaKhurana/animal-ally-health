
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Calendar, 
  Pill,
  Heart
} from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import HealthDashboard from '@/components/health/HealthDashboard';
import CollapsibleConditionsSection from '@/components/health/CollapsibleConditionsSection';

const CareTab = () => {
  const { selectedPet, updatePet } = usePetContext();
  const [editingReproductive, setEditingReproductive] = useState(false);
  const [reproductiveStatus, setReproductiveStatus] = useState<'spayed' | 'neutered' | 'not_yet'>(
    selectedPet?.reproductiveStatus || 'not_yet'
  );

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Care</h1>
            <PetSwitcher />
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No pet selected</p>
        </div>
        <PetZoneNavigation />
      </div>
    );
  }

  const handleSaveReproductiveStatus = async () => {
    if (selectedPet) {
      await updatePet({
        ...selectedPet,
        reproductiveStatus: reproductiveStatus
      });
      setEditingReproductive(false);
    }
  };

  const handleReproductiveStatusChange = (value: string) => {
    setReproductiveStatus(value as 'spayed' | 'neutered' | 'not_yet');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Care</h1>
          <PetSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Health Conditions - New Collapsible Design */}
        <CollapsibleConditionsSection 
          petId={selectedPet.id} 
          petSpecies={selectedPet.type || 'dog'} 
        />

        {/* Health Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Health Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reproductive Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Reproductive Status</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingReproductive(!editingReproductive)}
                >
                  {editingReproductive ? 'Cancel' : 'Edit'}
                </Button>
              </div>
              
              {editingReproductive ? (
                <div className="space-y-3">
                  <Select value={reproductiveStatus} onValueChange={handleReproductiveStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_yet">Not Yet</SelectItem>
                      <SelectItem value="spayed">Spayed</SelectItem>
                      <SelectItem value="neutered">Neutered</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSaveReproductiveStatus} className="w-full">
                    Save Status
                  </Button>
                </div>
              ) : (
                <Badge variant="outline" className="capitalize">
                  {selectedPet.reproductiveStatus === 'not_yet' ? 'Not Yet' : selectedPet.reproductiveStatus}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medical Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Medical Records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Health Report
            </Button>
            <Button className="w-full" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Vaccination
            </Button>
            <Button className="w-full" variant="outline">
              <Pill className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </CardContent>
        </Card>

        {/* Health Dashboard */}
        <HealthDashboard pet={selectedPet} />
      </div>

      <PetZoneNavigation />
    </div>
  );
};

export default CareTab;
