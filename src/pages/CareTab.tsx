
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
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import { useNavigate } from 'react-router-dom';
import CollapsibleConditionsSection from '@/components/health/CollapsibleConditionsSection';
import QuickLogButton from '@/components/quick-actions/QuickLogButton';
import { useHealthReports } from '@/hooks/useHealthReports';

const CareTab = () => {
  const { selectedPet } = usePetContext();
  const navigate = useNavigate();
  const { healthReports } = useHealthReports(selectedPet?.id);

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

  // Smart button text based on reports
  const getHealthReportsButtonText = () => {
    if (healthReports.length === 0) {
      return "Upload First Health Report";
    }
    return `${selectedPet.name}'s Health Reports (${healthReports.length})`;
  };

  const getHealthReportsButtonIcon = () => {
    if (healthReports.length === 0) {
      return <Plus className="h-4 w-4 mr-2" />;
    }
    return <FileText className="h-4 w-4 mr-2" />;
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
        {/* Quick Log Action */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Health Log</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Notice something about {selectedPet.name}? Log it quickly for your vet or AI assistant.
            </p>
            <QuickLogButton />
          </CardContent>
        </Card>

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
              Ask questions about {selectedPet.name}'s health and get personalized advice based on their history.
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

        {/* Health Reports - Smart Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Health Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {healthReports.length === 0 
                ? `Upload and analyze ${selectedPet.name}'s diagnostic reports with AI-powered insights.`
                : `View, manage, and analyze ${selectedPet.name}'s health reports and trends.`
              }
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate(`/health-reports/${selectedPet.id}`)}
            >
              {getHealthReportsButtonIcon()}
              {getHealthReportsButtonText()}
            </Button>
          </CardContent>
        </Card>

        {/* Health Conditions */}
        <CollapsibleConditionsSection 
          petId={selectedPet.id} 
          petSpecies={selectedPet.type || 'dog'} 
        />

        {/* Health Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Health Management
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

export default CareTab;
