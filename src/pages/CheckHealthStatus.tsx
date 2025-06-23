
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, FileText, Stethoscope, Activity, Heart, Calendar } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useDailyCheckins } from '@/hooks/useDailyCheckins';
import PetSelector from '@/components/pets/PetSelector';
import { calculateAge } from '@/lib/dateUtils';

const CheckHealthStatus = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { reports } = useSymptomReports();
  const { checkins } = useDailyCheckins();
  
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedPet) return;

    setIsAnalyzing(true);
    try {
      // Get latest data for this pet
      const petReports = reports.filter(r => r.pet_id === selectedPet.id).slice(0, 1);
      const petCheckins = checkins.filter(c => c.pet_id === selectedPet.id).slice(0, 1);
      
      const latestReport = petReports[0];
      const latestCheckin = petCheckins[0];

      // Calculate age from date of birth
      const ageInfo = calculateAge(selectedPet.dateOfBirth);
      const ageYears = Math.floor((Date.now() - new Date(selectedPet.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const ageMonths = Math.floor(((Date.now() - new Date(selectedPet.dateOfBirth).getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

      // Prepare prompt for Groq
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

Based on the above:
1. List the **top 3 most likely medical conditions**, ranked by likelihood, based on the breed and symptoms.
2. Recommend **specific tests** (like blood work, X-ray, ultrasound, stool test) the pet parent can discuss with their vet.
3. Suggest **whether this is urgent**, and what the pet parent can do immediately at home before a vet visit.

Keep your answer short, empathetic, and clearly structured.`;

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
          max_tokens: 1000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Parse the AI response into structured format
        const sections = aiResponse.split(/\d\./);
        
        setAnalysis({
          fullResponse: aiResponse,
          conditions: sections[1] || 'Analysis not available',
          tests: sections[2] || 'Testing recommendations not available', 
          urgency: sections[3] || 'Urgency assessment not available'
        });
      } else {
        // Fallback to mock analysis if API fails
        setAnalysis({
          fullResponse: `Based on ${selectedPet.name}'s profile and recent data, here's a health assessment:

**Most Likely Conditions:**
1. ${latestReport?.symptoms.includes('vomiting') || latestReport?.symptoms.includes('diarrhea') ? 'Gastrointestinal upset - common in pets who may have eaten something unusual' : 'General wellness check needed - no concerning symptoms reported'}
2. ${latestCheckin?.energy_level === 'low' ? 'Possible minor illness or fatigue' : 'Normal activity levels observed'}
3. ${selectedPet.breed?.toLowerCase().includes('golden') ? 'Monitor for breed-specific conditions like hip dysplasia or allergies' : 'Regular breed-appropriate monitoring recommended'}

**Recommended Tests:**
- Basic physical examination
- ${latestReport?.symptoms.length > 0 ? 'Blood work to check organ function' : 'Annual wellness bloodwork if due'}
- ${latestReport?.symptoms.includes('diarrhea') ? 'Stool sample analysis' : 'Routine fecal examination'}

**Urgency Level:**
${latestReport?.symptoms.length > 2 ? 'Moderate - contact vet within 24 hours' : 'Low - routine check-up recommended'}

Monitor ${selectedPet.name} closely and contact your vet if symptoms worsen.`,
          conditions: 'Mock analysis - API integration pending',
          tests: 'Basic examination recommended',
          urgency: 'Monitor and contact vet if concerned'
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis({
        fullResponse: 'Unable to complete analysis at this time. Please contact your veterinarian if you have concerns about your pet.',
        conditions: 'Analysis unavailable',
        tests: 'Consult your veterinarian',
        urgency: 'Contact vet if concerned'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasHealthData = (pet: any) => {
    const petReports = reports.filter(r => r.pet_id === pet.id);
    const petCheckins = checkins.filter(c => c.pet_id === pet.id);
    return petReports.length > 0 || petCheckins.length > 0;
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
              
              {selectedPet && (
                <div className="mt-4 pt-4 border-t">
                  {hasHealthData(selectedPet) ? (
                    <Button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? 'Analyzing Health Data...' : 'Get AI Health Analysis'}
                    </Button>
                  ) : (
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
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Dashboard for pets with data */}
          {selectedPet && hasHealthData(selectedPet) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Health Dashboard for {selectedPet.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reports.filter(r => r.pet_id === selectedPet.id).length}
                    </div>
                    <div className="text-sm text-blue-700">Symptom Reports</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {checkins.filter(c => c.pet_id === selectedPet.id).length}
                    </div>
                    <div className="text-sm text-green-700">Daily Check-ins</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {calculateAge(selectedPet.dateOfBirth)}
                    </div>
                    <div className="text-sm text-purple-700">Current Age</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/report-symptoms')}
                    className="flex items-center gap-2 justify-start"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Report New Symptoms
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/daily-tracker')}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Calendar className="h-4 w-4 text-green-500" />
                    Daily Wellness Check
                  </Button>
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
                  AI Health Analysis for {selectedPet?.name}
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
