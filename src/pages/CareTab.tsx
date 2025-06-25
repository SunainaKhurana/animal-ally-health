
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Upload, 
  Calendar, 
  Pill,
  Heart,
  MessageCircle,
  Stethoscope,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import { useDailyCheckins } from '@/hooks/useDailyCheckins';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import CollapsibleConditionsSection from '@/components/health/CollapsibleConditionsSection';

const CareTab = () => {
  const { selectedPet, updatePet } = usePetContext();
  const { checkins, addDailyCheckin } = useDailyCheckins(selectedPet?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [editingReproductive, setEditingReproductive] = useState(false);
  const [reproductiveStatus, setReproductiveStatus] = useState<'spayed' | 'neutered' | 'not_yet'>(
    selectedPet?.reproductiveStatus || 'not_yet'
  );
  
  const [showHealthCheckIn, setShowHealthCheckIn] = useState(false);
  const [healthCheckIn, setHealthCheckIn] = useState({
    energy_level: 'normal' as 'low' | 'normal' | 'hyper',
    thirst_level: 'normal' as 'less' | 'normal' | 'more',
    stool_consistency: 'normal' as 'normal' | 'soft' | 'diarrhea',
    hunger_level: 'normal' as 'not eating' | 'normal' | 'overeating',
    mood: ''
  });

  // Get today's check-in
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkins.find(checkin => checkin.checkin_date === today);

  const handleSaveReproductiveStatus = async () => {
    if (selectedPet) {
      await updatePet({
        ...selectedPet,
        reproductiveStatus: reproductiveStatus
      });
      setEditingReproductive(false);
    }
  };

  const handleSaveHealthCheckIn = async () => {
    if (!selectedPet) return;

    try {
      await addDailyCheckin({
        pet_id: selectedPet.id,
        energy_level: healthCheckIn.energy_level,
        thirst_level: healthCheckIn.thirst_level,
        stool_consistency: healthCheckIn.stool_consistency,
        hunger_level: healthCheckIn.hunger_level,
        notes: healthCheckIn.mood || undefined,
        checkin_date: today
      });

      setShowHealthCheckIn(false);
      toast({
        title: "Health check-in saved! 🎉",
        description: `Daily check-in logged for ${selectedPet.name}`,
      });
    } catch (error) {
      console.error('Error saving health check-in:', error);
    }
  };

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
          <div className="text-center">
            <p className="text-gray-500 mb-4">Please select a pet to manage their care</p>
            <PetSwitcher />
          </div>
        </div>
        <PetZoneNavigation />
      </div>
    );
  }

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
        {/* Daily Health Check-In */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Daily Health Check-In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayCheckIn ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-green-800">Today's Check-In Complete</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowHealthCheckIn(true)}
                  >
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Energy:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {todayCheckIn.energy_level}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Thirst:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {todayCheckIn.thirst_level}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Appetite:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {todayCheckIn.hunger_level}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Bowel:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {todayCheckIn.stool_consistency}
                    </Badge>
                  </div>
                </div>
                {todayCheckIn.notes && (
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">Notes:</span> {todayCheckIn.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-600 mb-4">No check-in for today</p>
                <Button onClick={() => setShowHealthCheckIn(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Daily Check-In
                </Button>
              </div>
            )}

            {/* Health Check-In Form */}
            {showHealthCheckIn && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Daily Health Check-In for {selectedPet.name}</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Activity Level</Label>
                    <Select value={healthCheckIn.energy_level} onValueChange={(value: any) => 
                      setHealthCheckIn(prev => ({ ...prev, energy_level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="hyper">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Thirst Level</Label>
                    <Select value={healthCheckIn.thirst_level} onValueChange={(value: any) => 
                      setHealthCheckIn(prev => ({ ...prev, thirst_level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="less">Decreased</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="more">Increased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bowel Movements</Label>
                    <Select value={healthCheckIn.stool_consistency} onValueChange={(value: any) => 
                      setHealthCheckIn(prev => ({ ...prev, stool_consistency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="soft">Loose</SelectItem>
                        <SelectItem value="diarrhea">Constipated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Appetite</Label>
                    <Select value={healthCheckIn.hunger_level} onValueChange={(value: any) => 
                      setHealthCheckIn(prev => ({ ...prev, hunger_level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not eating">Reduced</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="overeating">Increased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mood / Behavior</Label>
                  <Textarea
                    placeholder="How is their mood today? Calm, anxious, playful, etc."
                    value={healthCheckIn.mood}
                    onChange={(e) => setHealthCheckIn(prev => ({ ...prev, mood: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveHealthCheckIn} className="flex-1">
                    Save Check-In
                  </Button>
                  <Button variant="outline" onClick={() => setShowHealthCheckIn(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Conditions */}
        <CollapsibleConditionsSection 
          petId={selectedPet.id} 
          petSpecies={selectedPet.type || 'dog'} 
        />

        {/* AI Health Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              AI Health Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Ask questions about {selectedPet.name}'s health and get personalized advice.
            </p>
            <Button 
              className="w-full" 
              onClick={() => navigate('/assistant')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with AI Assistant
            </Button>
          </CardContent>
        </Card>

        {/* Health Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Health Records & Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/report-symptoms')}
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Report Symptoms
            </Button>
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
                  <Select value={reproductiveStatus} onValueChange={(value: any) => setReproductiveStatus(value)}>
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
      </div>

      <PetZoneNavigation />
    </div>
  );
};

export default CareTab;
