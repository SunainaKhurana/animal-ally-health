import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useDailyCheckins } from '@/hooks/useDailyCheckins';
import PetSelector from '@/components/pets/PetSelector';
import { useToast } from '@/hooks/use-toast';

const COMMON_SYMPTOMS = [
  'Vomiting',
  'Lethargy', 
  'Diarrhea',
  'Shaking',
  'Loss of appetite',
  'Excessive thirst',
  'Difficulty breathing',
  'Limping',
  'Excessive scratching',
  'Fever',
  'Coughing',
  'Excessive drooling'
];

const ReportSymptoms = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { addSymptomReport } = useSymptomReports();
  const { checkins } = useDailyCheckins();
  const { toast } = useToast();
  
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
    }
  };

  const analyzeHealth = async (petData: any, symptoms: string[], notes: string) => {
    try {
      // Get latest daily checkin for this pet
      const latestCheckin = checkins
        .filter(c => c.pet_id === petData.id)
        .sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime())[0];

      // Calculate age
      const ageYears = Math.floor((Date.now() - new Date(petData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const ageMonths = Math.floor(((Date.now() - new Date(petData.dateOfBirth).getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

      const prompt = `You are an expert veterinarian AI.

Here is the pet's profile:
- Breed: ${petData.breed || 'Mixed breed'}
- Age: ${ageYears} years, ${ageMonths} months
- Gender: ${petData.gender}
- Weight: ${petData.weightUnit === 'kg' ? petData.weight : (petData.weight * 0.453592).toFixed(1)} kg

Here are the symptoms recently reported:
${symptoms.join(', ')}

Additional notes from the owner:
${notes || 'No additional notes provided'}

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

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || 'gsk_placeholder'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
      return null;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPet) {
      toast({
        title: "Error",
        description: "Please select a pet",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedSymptoms.length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one symptom",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit symptom report
      await addSymptomReport(
        selectedPet.id,
        selectedSymptoms,
        notes || undefined,
        photo || undefined
      );

      // Automatically run AI analysis
      const analysis = await analyzeHealth(selectedPet, selectedSymptoms, notes);
      
      // Store analysis in localStorage for dashboard display
      if (analysis) {
        const healthAnalysis = {
          petId: selectedPet.id,
          symptoms: selectedSymptoms,
          notes,
          analysis,
          timestamp: new Date().toISOString(),
          reportDate: new Date().toISOString().split('T')[0]
        };
        
        // Get existing analyses or create new array
        const existingAnalyses = JSON.parse(localStorage.getItem('petHealthAnalyses') || '[]');
        existingAnalyses.unshift(healthAnalysis); // Add to beginning
        
        // Keep only last 10 analyses per pet
        const filteredAnalyses = existingAnalyses
          .filter((a: any) => a.petId === selectedPet.id)
          .slice(0, 10);
        
        // Merge with other pets' analyses
        const otherPetsAnalyses = existingAnalyses.filter((a: any) => a.petId !== selectedPet.id);
        localStorage.setItem('petHealthAnalyses', JSON.stringify([...filteredAnalyses, ...otherPetsAnalyses]));
      }

      toast({
        title: "Success",
        description: "Symptom report submitted and analyzed successfully",
      });

      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      console.error('Failed to submit symptom report:', error);
      toast({
        title: "Error",
        description: "Failed to submit symptom report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Report Symptoms</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Choose a pet to report symptoms for"
              />
            </CardContent>
          </Card>

          {/* Symptoms Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Symptoms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={selectedSymptoms.includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom)}
                    />
                    <Label htmlFor={symptom} className="text-sm font-medium">
                      {symptom}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe any additional details about the symptoms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Photo (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <Label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> a photo
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                    </div>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </Label>
                </div>
                
                {photo && (
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                    <span className="text-sm text-gray-700">{photo.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPhoto(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !selectedPet || selectedSymptoms.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing & Submitting...
              </>
            ) : (
              'Submit & Get AI Analysis'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReportSymptoms;
