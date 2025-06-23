
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, FileText, Stethoscope, Activity, Heart, Calendar, Plus } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useDailyCheckins } from '@/hooks/useDailyCheckins';
import { useHealthReports } from '@/hooks/useHealthReports';
import PetSelector from '@/components/pets/PetSelector';
import HealthDashboard from '@/components/health/HealthDashboard';

const CheckHealthStatus = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { reports } = useSymptomReports();
  const { checkins } = useDailyCheckins();
  const { healthReports } = useHealthReports();
  
  const [selectedPet, setSelectedPet] = useState<any>(pets[0] || null);

  const hasHealthData = (pet: any) => {
    if (!pet) return false;
    const petReports = reports.filter(r => r.pet_id === pet.id);
    const petCheckins = checkins.filter(c => c.pet_id === pet.id);
    const petHealthRecords = healthReports.filter(r => r.pet_id === pet.id);
    const storedAnalyses = JSON.parse(localStorage.getItem('petHealthAnalyses') || '[]');
    const petAnalyses = storedAnalyses.filter((analysis: any) => analysis.petId === pet.id);
    
    return petReports.length > 0 || petCheckins.length > 0 || petHealthRecords.length > 0 || petAnalyses.length > 0;
  };

  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-3"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Health Assistant</h1>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-4">No pets found. Add a pet first to use the health assistant.</p>
              <Button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Health Assistant</h1>
        </div>

        <div className="space-y-6">
          {/* Pet Selection */}
          {pets.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Pet</CardTitle>
              </CardHeader>
              <CardContent>
                <PetSelector
                  pets={pets}
                  selectedPet={selectedPet}
                  onSelectPet={setSelectedPet}
                  placeholder="Choose a pet to view health status"
                />
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-500" />
                Quick Health Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => navigate('/report-symptoms')}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 h-12"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Report Symptoms & Get AI Analysis
                </Button>
                <Button 
                  onClick={() => navigate('/daily-tracker')}
                  variant="outline"
                  className="flex items-center gap-2 h-12"
                >
                  <Calendar className="h-4 w-4" />
                  Daily Check-in
                </Button>
                <Button 
                  onClick={() => navigate(`/health/${selectedPet?.id || ''}?upload=true`)}
                  variant="outline"
                  className="flex items-center gap-2 h-12"
                >
                  <FileText className="h-4 w-4" />
                  Upload Health Records
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Health Dashboard or Empty State */}
          {selectedPet && hasHealthData(selectedPet) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  {selectedPet.name}'s Health Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HealthDashboard pet={selectedPet} />
              </CardContent>
            </Card>
          ) : selectedPet ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Getting Started with {selectedPet.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-4xl mb-4">🩺</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No health data yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start tracking {selectedPet.name}'s health by reporting symptoms, logging daily check-ins, or uploading medical records.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/report-symptoms')}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report First Symptoms
                    </Button>
                    <div className="text-sm text-gray-500">
                      Get instant AI analysis and health insights
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CheckHealthStatus;
