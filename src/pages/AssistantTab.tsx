
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Stethoscope, HelpCircle } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import { useNavigate } from 'react-router-dom';

const AssistantTab = () => {
  const { selectedPet } = usePetContext();
  const navigate = useNavigate();

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Assistant</h1>
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
          <PetSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Pet Context Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">AI Health Assistant</h3>
                <p className="text-sm text-gray-600">Specialized for {selectedPet.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              I can help answer questions about {selectedPet.name}'s health, behavior, and care based on their profile and recent health data.
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-3">
          <Button 
            className="w-full justify-start h-auto p-4" 
            variant="outline"
            onClick={() => navigate('/report-symptoms')}
          >
            <Stethoscope className="h-5 w-5 mr-3 text-red-500" />
            <div className="text-left">
              <p className="font-medium">Report Symptoms</p>
              <p className="text-sm text-gray-600">Get AI analysis of health concerns</p>
            </div>
          </Button>

          <Button 
            className="w-full justify-start h-auto p-4" 
            variant="outline"
            onClick={() => navigate('/check-health')}
          >
            <HelpCircle className="h-5 w-5 mr-3 text-blue-500" />
            <div className="text-left">
              <p className="font-medium">Ask Health Questions</p>
              <p className="text-sm text-gray-600">Chat about {selectedPet.name}'s care</p>
            </div>
          </Button>
        </div>

        {/* Chat Interface - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Your conversations with the AI assistant will appear here
            </p>
          </CardContent>
        </Card>
      </div>

      <PetZoneNavigation />
    </div>
  );
};

export default AssistantTab;
