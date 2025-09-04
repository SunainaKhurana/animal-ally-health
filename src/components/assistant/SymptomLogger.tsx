import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';

interface SymptomLoggerProps {
  onSubmit: (symptoms: string[], notes: string, image?: File) => void;
  onCancel: () => void;
}

const COMMON_SYMPTOMS = [
  'Vomiting',
  'Diarrhea', 
  'Loss of appetite',
  'Lethargy/Low energy',
  'Excessive drinking',
  'Coughing',
  'Limping',
  'Difficulty breathing',
  'Scratching/Itching',
  'Hair loss',
  'Bad breath',
  'Whimpering/Crying'
];

const SymptomLogger = ({ onSubmit, onCancel }: SymptomLoggerProps) => {
  const { selectedPet } = usePetContext();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedSymptoms, '', undefined);
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Symptoms for {selectedPet?.name}</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {COMMON_SYMPTOMS.map(symptom => (
          <div key={symptom} className="flex items-center space-x-3">
            <Checkbox
              id={symptom}
              checked={selectedSymptoms.includes(symptom)}
              onCheckedChange={() => handleSymptomToggle(symptom)}
            />
            <label htmlFor={symptom} className="text-sm cursor-pointer flex-1">
              {symptom}
            </label>
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground border-t pt-4">
        You can describe other symptoms in the chat below
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          onClick={handleSubmit}
          className="flex-1"
          disabled={selectedSymptoms.length === 0}
        >
          Log Symptoms ({selectedSymptoms.length})
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SymptomLogger;
