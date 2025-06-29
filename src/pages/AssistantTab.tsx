
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useAuth } from '@/contexts/AuthContext';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import SimplifiedAssistantChat from '@/components/assistant/SimplifiedAssistantChat';

const AssistantTab = () => {
  const { selectedPet, loading: petsLoading, error: petsError, retry: retryPets } = usePetContext();
  const { user, loading: authLoading, error: authError, retry: retryAuth } = useAuth();

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <Button onClick={retryAuth} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show pets error
  if (petsError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Assistant</h1>
            <PetSwitcher />
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Pets</h2>
            <p className="text-gray-600 mb-4">{petsError}</p>
            <Button onClick={retryPets} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
        <PetZoneNavigation />
      </div>
    );
  }

  // Show no pet selected state
  if (!selectedPet && !petsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Assistant</h1>
            <PetSwitcher />
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Please select a pet to get health assistance</p>
            <PetSwitcher />
          </div>
        </div>
        <PetZoneNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
          <PetSwitcher />
        </div>
      </div>

      {/* Main Content - takes remaining height */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Pet Context Card */}
        <div className="p-4 pb-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Health Assistant for {selectedPet?.name}</h3>
                  <p className="text-sm text-gray-600">Get personalized health advice and report symptoms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface - takes remaining space with bottom padding */}
        <div className="flex-1 px-4 pb-24">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <SimplifiedAssistantChat />
            </CardContent>
          </Card>
        </div>
      </div>

      <PetZoneNavigation />
    </div>
  );
};

export default AssistantTab;
