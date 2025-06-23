
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import PetSelector from '@/components/pets/PetSelector';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPet) {
      alert('Please select a pet');
      return;
    }
    
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSymptomReport(
        selectedPet.id,
        selectedSymptoms,
        notes || undefined,
        photo || undefined
      );
      navigate('/health');
    } catch (error) {
      console.error('Failed to submit symptom report:', error);
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
            {isSubmitting ? 'Submitting...' : 'Submit Symptom Report'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReportSymptoms;
