
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, FileText, Stethoscope, Activity, Heart, Calendar } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useDailyCheckins } from '@/hooks/useDailyCheckins';
import { useHealthReports } from '@/hooks/useHealthReports';
import PetSelector from '@/components/pets/PetSelector';
import HealthDashboard from '@/components/health/HealthDashboard';
import { calculateAge } from '@/lib/dateUtils';

const CheckHealthStatus = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { reports } = useSymptomReports();
  const { checkins } = useDailyCheckins();
  const { healthReports } = useHealthReports();
  
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedPet) return;

    setIsAnalyzing(true);
    try {
      // Get comprehensive health data for this pet
      const petReports = reports.filter(r => r.pet_id === selectedPet.id).slice(0, 3);
      const petCheckins = checkins.filter(c => c.pet_id === selectedPet.id).slice(0, 5);
      const petHealthRecords = healthReports.filter(r => r.pet_id === selectedPet.id);
      
      const latestReport = petReports[0];
      const latestCheckin = petCheckins[0];

      // Calculate age from date of birth
      const ageYears = Math.floor((Date.now() - new Date(selectedPet.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const ageMonths = Math.floor(((Date.now() - new Date(selectedPet.dateOfBirth).getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

      // Build comprehensive health summary
      const healthSummary = petHealthRecords.length > 0 
        ? `Recent medical records show: ${petHealthRecords.map(r => r.key_findings || 'General health check').join(', ')}`
        : 'No recent medical records available.';

      const activitySummary = petCheckins.length > 1
        ? `Recent activity patterns over ${petCheckins.length} check-ins show varying energy (${petCheckins.map(c => c.energy_level).join(', ')}) and appetite levels.`
        : latestCheckin 
        ? `Single check-in shows ${latestCheckin.energy_level} energy and ${latestCheckin.hunger_level} appetite.`
        : 'No recent activity data available.';

      // Enhanced prompt with comprehensive data
      const prompt = `You are an expert veterinarian AI.

Here is the pet's profile:
- Breed: ${selectedPet.breed || 'Mixed breed'}
- Age: ${ageYears} years, ${ageMonths} months
- Gender: ${selectedPet.gender}
- Weight: ${selectedPet.weightUnit === 'kg' ? selectedPet.weight : (selectedPet.weight * 0.453592).toFixed(1)} kg

${latestReport ? `Here are the symptoms recently reported:
${latestReport.symptoms.join(', ')}

Additional notes from the owner:
${latestReport.notes || 'No additional notes provided'}` : 'No recent symptoms reported.'}

${latestCheckin ? `Recent health patterns:
- Energy: ${latestCheckin.energy_level}
- Hunger: ${latestCheckin.hunger_level}
- Thirst: ${latestCheckin.thirst_level}
- Stool: ${latestCheckin.stool_consistency}` : 'No recent daily check-ins available.'}

Medical History Context:
${healthSummary}

Activity & Wellness Trends:
${activitySummary}

Based on this comprehensive health profile:
1. List the **top 3 most likely medical conditions**, ranked by likelihood, based on the breed, age, symptoms, and health history.
2. Recommend **specific tests** (like blood work, X-ray, ultrasound, stool test) the pet parent can discuss with their vet.
3. Suggest **whether this is urgent**, and what the pet parent can do immediately at home before a vet visit.
4. Provide **breed-specific health considerations** for ongoing monitoring.

Keep your answer short, empathetic, and clearly structured for a worried pet parent.`;

      // Call Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || 'gsk_placeholder'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1200
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        setAnalysis({
          fullResponse: aiResponse,
          timestamp: new Date().toISOString()
        });

        // Store this analysis for dashboard display
        const healthAnalysis = {
          petId: selectedPet.id,
          symptoms: latestReport?.symptoms || [],
          notes: latestReport?.notes || 'Comprehensive health check',
          analysis: aiResponse,
          timestamp: new Date().toISOString(),
          reportDate: new Date().toISOString().split('T')[0]
        };
        
        const existingAnalyses = JSON.parse(localStorage.getItem('petHealthAnalyses') || '[]');
        existingAnalyses.unshift(healthAnalysis);
        
        const filteredAnalyses = existingAnalyses
          .filter((a: any) => a.petId === selectedPet.id)
          .slice(0, 10);
        
        const otherPetsAnalyses = existingAnalyses.filter((a: any) => a.petId !== selectedPet.id);
        localStorage.setItem('petHealthAnalyses', JSON.stringify([...filteredAnalyses, ...otherPetsAnalyses]));

      } else {
        throw new Error('Failed to get AI analysis');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis({
        fullResponse: 'Unable to complete analysis at this time. Please contact your veterinarian if you have concerns about your pet.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasHealthData = (pet: any) => {
    const petReports = reports.filter(r => r.pet_id === pet.id);
    const petCheckins = checkins.filter(c => c.pet_id === pet.id);
    const petHealthRecords = healthReports.filter(r => r.pet_id === pet.id);
    const storedAnalyses = JSON.parse(localStorage.getItem('petHealthAnalyses') || '[]');
    const petAnalyses = storedAnalyses.filter((analysis: any) => analysis.petId === pet.id);
    
    return petReports.length > 0 || petCheckins.length > 0 || petHealthRecords.length > 0 || petAnalyses.length > 0;
  };

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
          <Card>
            <CardHeader>
              <CardTitle>Select Pet</CardTitle>
            </CardHeader>
            <CardContent>
              <PetSelector
                pets={pets}
                selectedPet={selectedPet}
                onSelectPet={setSelectedPet}
                placeholder="Choose a pet to analyze"
              />
            </CardContent>
          </Card>

          {/* Show health dashboard if pet has data, otherwise show analysis option */}
          {selectedPet && hasHealthData(selectedPet) && (
            <div className="space-y-6">
              {/* Comprehensive Health Dashboard */}
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

              {/* Option to generate new comprehensive analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-500" />
                    Generate New Health Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Get a fresh AI analysis based on all of {selectedPet.name}'s health data, including recent symptoms, daily check-ins, medical records, and activity patterns.
                  </p>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? 'Analyzing Complete Health Profile...' : 'Generate Comprehensive Analysis'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* For pets without health data */}
          {selectedPet && !hasHealthData(selectedPet) && (
            <Card>
              <CardHeader>
                <CardTitle>No Health Data Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">No health data available for {selectedPet.name} yet.</p>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/report-symptoms')}
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Report Symptoms
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/daily-tracker')}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Log Daily Check-in
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-500" />
                  Comprehensive Health Analysis for {selectedPet?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {analysis.fullResponse}
                  </div>
                </div>
                
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">Important Reminder</h4>
                      <p className="text-sm text-yellow-700">
                        This AI analysis is for guidance only and doesn't replace professional veterinary care. 
                        If you're worried about {selectedPet?.name || 'your pet'}, trust your instincts and contact your vet.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckHealthStatus;
