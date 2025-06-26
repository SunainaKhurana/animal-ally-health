
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';

interface ManualSymptomSelectorProps {
  onSymptomsSubmit: (symptoms: string[], notes: string) => void;
  onCancel: () => void;
}

const COMMON_SYMPTOMS = [
  'Vomiting',
  'Diarrhea', 
  'Loss of appetite',
  'Lethargy/Low energy',
  'Excessive drinking',
  'Excessive urination',
  'Coughing',
  'Limping',
  'Difficulty breathing',
  'Scratching/Itching',
  'Hair loss',
  'Bad breath',
  'Seizures',
  'Aggression',
  'Anxiety/Restlessness',
  'Whimpering/Crying'
];

const ManualSymptomSelector = ({ onSymptomsSubmit, onCancel }: ManualSymptomSelectorProps) => {
  const { selectedPet } = usePetContext();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !customSymptoms.includes(customSymptom.trim())) {
      setCustomSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const removeCustomSymptom = (symptom: string) => {
    setCustomSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const handleSubmit = () => {
    const allSymptoms = [...selectedSymptoms, ...customSymptoms];
    if (allSymptoms.length > 0) {
      onSymptomsSubmit(allSymptoms, notes);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select Symptoms for {selectedPet?.name}</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Common Symptoms */}
        <div>
          <h4 className="font-medium mb-3">Common symptoms:</h4>
          <div className="grid grid-cols-2 gap-2">
            {COMMON_SYMPTOMS.map(symptom => (
              <div key={symptom} className="flex items-center space-x-2">
                <Checkbox
                  id={symptom}
                  checked={selectedSymptoms.includes(symptom)}
                  onCheckedChange={() => handleSymptomToggle(symptom)}
                />
                <label htmlFor={symptom} className="text-sm cursor-pointer">
                  {symptom}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Symptoms */}
        <div>
          <h4 className="font-medium mb-2">Add other symptoms:</h4>
          <p className="text-sm text-gray-600 mb-3">
            Add any other symptoms you've noticed, for example 'limping on left leg' or 'eating grass frequently'
          </p>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Describe any other symptoms..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addCustomSymptom}
              disabled={!customSymptom.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {customSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customSymptoms.map(symptom => (
                <Badge key={symptom} variant="secondary" className="flex items-center gap-1">
                  {symptom}
                  <button
                    onClick={() => removeCustomSymptom(symptom)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block font-medium mb-2">Additional notes (optional):</label>
          <textarea
            className="w-full p-2 border rounded-md resize-none"
            rows={3}
            placeholder="Any other observations or details about the symptoms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSubmit}
            disabled={selectedSymptoms.length === 0 && customSymptoms.length === 0}
            className="flex-1"
          >
            Submit Symptoms ({selectedSymptoms.length + customSymptoms.length})
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualSymptomSelector;
