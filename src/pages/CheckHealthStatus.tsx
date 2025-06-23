
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

      const prompt = `Given this pet's profile and recent symptoms, provide a health assessment:

Pet Profile:
- Name: ${petProfile.name}
- Type: ${petProfile.type}
- Breed: ${petProfile.breed}
- Age: ${petProfile.age} years
- Weight: ${petProfile.weight} ${selectedPet.weightUnit || 'lbs'}
- Gender: ${petProfile.gender}

Recent Symptoms: ${symptoms.join(', ') || 'None reported'}
Recent Notes: ${recentNotes.join('; ') || 'None'}

Please provide:
1. Top 3 most likely conditions (if symptoms present)
2. Suggested immediate actions
3. Recommended tests or vet consultations

Keep the response concise and structured.`;

      // Mock response for now since Groq API integration would need to be set up
      const mockAnalysis = {
        conditions: symptoms.length > 0 ? [
          "Gastrointestinal upset (if vomiting/diarrhea present)",
          "Anxiety or stress response (if behavioral symptoms)",
          "Dietary indiscretion or food sensitivity"
        ] : ["No concerning symptoms reported recently"],
        nextSteps: symptoms.length > 0 ? [
          "Monitor symptoms for 24-48 hours",
          "Ensure adequate hydration",
          "Consider bland diet if GI symptoms present",
          "Contact vet if symptoms worsen or persist"
        ] : [
          "Continue regular monitoring",
          "Maintain current care routine",
          "Schedule routine wellness check if due"
        ],
        tests: symptoms.length > 0 ? [
          "Blood work to check organ function",
          "Fecal examination if GI symptoms",
          "Physical examination by veterinarian"
        ] : [
          "Routine annual bloodwork",
          "Dental examination",
          "Vaccination status review"
        ]
      };

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
              {/* Possible Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Possible Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.conditions.map((condition: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{condition}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Suggested Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Suggested Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.nextSteps.map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Recommended Tests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-green-500" />
                    Recommended Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.tests.map((test: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{test}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not replace professional veterinary advice. Always consult with a qualified veterinarian for proper diagnosis and treatment.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckHealthStatus;
