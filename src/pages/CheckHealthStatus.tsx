
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, FileText, Stethoscope } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import PetSelector from '@/components/pets/PetSelector';

const CheckHealthStatus = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { reports } = useSymptomReports();
  
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedPet) return;

    setIsAnalyzing(true);
    try {
      // Get latest symptoms for this pet
      const petReports = reports.filter(r => r.pet_id === selectedPet.id).slice(0, 3);
      
      const petProfile = {
        name: selectedPet.name,
        type: selectedPet.type,
        breed: selectedPet.breed,
        age: selectedPet.dateOfBirth ? 
          Math.floor((Date.now() - new Date(selectedPet.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
          'Unknown',
        weight: selectedPet.weight,
        gender: selectedPet.gender
      };

      const symptoms = petReports.flatMap(r => r.symptoms);
      const recentNotes = petReports.map(r => r.notes).filter(Boolean);

      // Enhanced mock analysis for pet parents
      let mockAnalysis;
      
      if (symptoms.length > 0) {
        // Analysis based on reported symptoms
        const hasGISymptoms = symptoms.some(s => 
          ['vomiting', 'diarrhea', 'loss of appetite'].includes(s.toLowerCase())
        );
        const hasBehavioralSymptoms = symptoms.some(s => 
          ['lethargy', 'shaking', 'restlessness'].includes(s.toLowerCase())
        );
        const hasThirstSymptoms = symptoms.some(s => 
          ['excessive thirst', 'increased drinking'].includes(s.toLowerCase())
        );

        mockAnalysis = {
          conditions: hasGISymptoms ? [
            "Upset stomach - This is common and often resolves in 24-48 hours",
            "Dietary indiscretion - Your pet may have eaten something they shouldn't have",
            "Food sensitivity - Could be a reaction to a new food or treat"
          ] : hasBehavioralSymptoms ? [
            "Stress or anxiety - Changes in environment or routine can cause this",
            "Minor illness - Your pet's body might be fighting off something small",
            "Pain or discomfort - They might be feeling sore somewhere"
          ] : hasThirstSymptoms ? [
            "Dehydration - Make sure fresh water is always available",
            "Dietary changes - New food or treats can increase thirst",
            "Environmental factors - Hot weather or dry air can cause increased drinking"
          ] : [
            "Monitor closely - The symptoms you've reported need observation",
            "Possible minor illness - Your pet might be feeling under the weather",
            "Stress response - Changes in routine can affect pets"
          ],
          
          nextSteps: hasGISymptoms ? [
            "Withhold food for 12-24 hours, but keep water available",
            "Start with small amounts of bland food (boiled chicken and rice)",
            "Contact your vet if symptoms worsen or don't improve in 24 hours",
            "Watch for signs of dehydration (dry gums, lethargy)"
          ] : [
            "Keep your pet comfortable and monitor their behavior",
            "Maintain normal routine as much as possible",
            "Ensure they're eating, drinking, and using the bathroom normally",
            "Call your vet if you notice any worsening or new symptoms"
          ],
          
          tests: symptoms.length > 2 || hasGISymptoms ? [
            "Physical examination by your veterinarian",
            "Basic blood work to check organ function",
            "Stool sample if digestive issues persist"
          ] : [
            "Physical examination if symptoms continue",
            "Temperature check to rule out fever",
            "Monitor at home for 24-48 hours first"
          ]
        };
      } else {
        // No symptoms reported
        mockAnalysis = {
          conditions: [
            `${selectedPet.name} appears to be healthy based on recent reports`,
            "No concerning symptoms have been logged recently",
            "Continue regular wellness monitoring"
          ],
          nextSteps: [
            "Keep up with regular daily check-ins",
            "Maintain current diet and exercise routine",
            "Schedule routine wellness check if it's been over 6 months",
            "Continue monitoring for any changes in behavior"
          ],
          tests: [
            "Annual wellness bloodwork (if due)",
            "Dental examination during next vet visit",
            "Update vaccinations as scheduled"
          ]
        };
      }

      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Check Health Status</h1>
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
                  <Button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Health Status'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <>
              {/* What This Might Be */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    What This Might Be
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.conditions.map((condition: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                        <span className="bg-orange-200 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] text-center">
                          {index + 1}
                        </span>
                        <span className="text-gray-800 leading-relaxed">{condition}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* What You Should Do */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    What You Should Do
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.nextSteps.map((step: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <span className="bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] text-center">
                          {index + 1}
                        </span>
                        <span className="text-gray-800 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* When to See the Vet */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-green-500" />
                    When to See the Vet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.tests.map((test: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <span className="bg-green-200 text-green-800 text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] text-center">
                          {index + 1}
                        </span>
                        <span className="text-gray-800 leading-relaxed">{test}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Important Reminder</h4>
                    <p className="text-sm text-yellow-700">
                      This analysis is for guidance only and doesn't replace professional veterinary care. 
                      If you're worried about {selectedPet?.name || 'your pet'}, trust your instincts and contact your vet.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckHealthStatus;
