import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle,
  Stethoscope,
  Calendar,
  Pill,
  Heart,
  FileText,
  Plus
} from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useGuestMode } from '@/contexts/GuestModeContext';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import { useNavigate } from 'react-router-dom';
import CollapsibleConditionsSection from '@/components/health/CollapsibleConditionsSection';
import { useHealthReports } from '@/hooks/useHealthReports';
import { LoadingFallback } from '@/components/common/LoadingFallback';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import SymptomLogsList from '@/components/health/SymptomLogsList';

const CareTabContent = () => {
  const { selectedPet, loading: petLoading, error: petError } = usePetContext();
  const { isGuestMode, guestPetName } = useGuestMode();
  const navigate = useNavigate();
  const { healthReports, loading: reportsLoading } = useHealthReports(selectedPet?.id);

  const effectivePet = selectedPet || (isGuestMode ? { id: 'guest', name: guestPetName } : null);

  // Show loading state while pets are loading
  if (petLoading) {
    return <LoadingFallback message="Loading your pets..." />;
  }

  // Show error state if there's a pet error
  if (petError) {
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
            <p className="text-red-500 mb-4">Error loading pets: {petError}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
        <PetZoneNavigation />
      </div>
    );
  }

  if (!effectivePet) {
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

  // Smart button text and icon based on reports (with loading state)
  const getHealthReportsButton = () => {
    if (isGuestMode) {
      return {
        text: "Try Health Reports (Demo)",
        icon: <FileText className="h-4 w-4 mr-2" />,
        description: "Explore how AI analyzes health reports with demo data."
      };
    }
    
    if (reportsLoading) {
      return {
        text: "Loading Reports...",
        icon: <FileText className="h-4 w-4 mr-2" />,
        description: "Loading health reports..."
      };
    }
    
    if (!healthReports || healthReports.length === 0) {
      return {
        text: "Upload First Report",
        icon: <Plus className="h-4 w-4 mr-2" />,
        description: "Upload and analyze your first diagnostic report with AI-powered insights."
      };
    }
    return {
      text: `All ${effectivePet.name}'s Health Reports`,
      icon: <FileText className="h-4 w-4 mr-2" />,
      description: `View and manage ${effectivePet.name}'s ${healthReports.length} health reports.`
    };
  };

  const healthReportsButton = getHealthReportsButton();

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
        {/* Health Logs Entry Point */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-orange-500" />
              Health Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View and manage all health logs for {effectivePet.name}.
            </p>
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                if (isGuestMode) {
                  // Show demo notification
                  alert('In guest mode - this would show your pet\'s health logs');
                } else {
                  navigate(`/health-logs/${effectivePet.id}`);
                }
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isGuestMode ? 'View Demo Health Logs' : 'View All Health Logs'}
            </Button>
          </CardContent>
        </Card>

        {/* Health Reports Hub - Single Smart Button */}
        <Card className="border-2 border-blue-100 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Health Reports Hub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-4">
              {healthReportsButton.description}
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm"
              onClick={() => {
                if (isGuestMode) {
                  alert('In guest mode - this would show health reports upload and analysis');
                } else {
                  navigate(`/health-reports/${effectivePet.id}`);
                }
              }}
              size="lg"
              disabled={reportsLoading}
            >
              {healthReportsButton.icon}
              {healthReportsButton.text}
            </Button>
          </CardContent>
        </Card>

        {/* AI Health Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              AI Health Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Chat with AI about {effectivePet.name}'s health and get personalized advice.
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/assistant')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with AI Assistant
            </Button>
          </CardContent>
        </Card>

        {/* Health Conditions */}
        {!isGuestMode && selectedPet && (
          <ErrorBoundary>
            <CollapsibleConditionsSection 
              petId={selectedPet.id} 
              petSpecies={selectedPet.type || 'dog'} 
            />
          </ErrorBoundary>
        )}

        {isGuestMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                Health Conditions (Demo)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                In the full version, this section would show your pet's health conditions and tracking.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">Example: Hip Dysplasia</p>
                  <p className="text-xs text-gray-600">Being monitored</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">Example: Seasonal Allergies</p>
                  <p className="text-xs text-gray-600">Managed with medication</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Health Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Quick Actions
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
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Vaccination
            </Button>
            <Button className="w-full" variant="outline">
              <Pill className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </CardContent>
        </Card>
      </div>

      <PetZoneNavigation />
    </div>
  );
};

const CareTab = () => {
  return (
    <ErrorBoundary>
      <CareTabContent />
    </ErrorBoundary>
  );
};

export default CareTab;
