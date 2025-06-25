
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePetConditions } from '@/hooks/usePetConditions';
import ExistingConditions from './ExistingConditions';
import ConditionsList from './ConditionsList';
import CustomConditionInput from './CustomConditionInput';

const PRIORITY_CONDITIONS = [
  'Allergies',
  'Skin Infections',
  'Tick Fever',
  'Hip Dysplasia',
  'Arthritis',
  'Obesity',
  'Dental Disease',
  'Kidney Disease',
  'Ear Infections',
  'Seizures'
];

interface ConditionsSelectorProps {
  petId: string;
  petSpecies: string;
}

const ConditionsSelector = ({ petId, petSpecies }: ConditionsSelectorProps) => {
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { conditions, addCondition, refetch } = usePetConditions(petId);

  useEffect(() => {
    fetchAvailableConditions();
  }, [petSpecies]);

  const fetchAvailableConditions = async () => {
    try {
      const { data, error } = await supabase
        .from('disease_knowledge')
        .select('disease')
        .eq('pet_type', petSpecies.toLowerCase())
        .order('disease');

      if (error) throw error;

      const dbConditions = data?.map(item => item.disease) || [];
      
      // Combine priority conditions with database conditions, removing duplicates
      const allConditions = [...PRIORITY_CONDITIONS];
      dbConditions.forEach(condition => {
        if (!allConditions.includes(condition)) {
          allConditions.push(condition);
        }
      });

      setAvailableConditions(allConditions);
    } catch (error) {
      console.error('Error fetching conditions:', error);
      setAvailableConditions(PRIORITY_CONDITIONS);
    }
  };

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSaveConditions = async () => {
    if (selectedConditions.length === 0 && !customCondition.trim()) {
      toast({
        title: "No conditions selected",
        description: "Please select at least one condition or add a custom condition.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const conditionsToSave = [...selectedConditions];
      if (customCondition.trim()) {
        conditionsToSave.push(customCondition.trim());
      }

      // Save each condition as a separate row
      for (const condition of conditionsToSave) {
        // Check if condition already exists for this pet
        const existingCondition = conditions.find(c => 
          c.condition_name.toLowerCase() === condition.toLowerCase()
        );
        
        if (!existingCondition) {
          await addCondition(petId, {
            condition_name: condition,
            status: 'active'
          });
        }
      }

      // Reset form
      setSelectedConditions([]);
      setCustomCondition('');
      
      toast({
        title: "Conditions saved",
        description: "The selected conditions have been added to your pet's profile.",
      });

      refetch();
    } catch (error) {
      console.error('Error saving conditions:', error);
      toast({
        title: "Error",
        description: "Failed to save conditions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveConditions();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ExistingConditions 
          conditions={conditions}
          onRefetch={refetch}
        />

        <div className="space-y-3">
          <ConditionsList
            availableConditions={availableConditions}
            selectedConditions={selectedConditions}
            onConditionToggle={handleConditionToggle}
          />

          <CustomConditionInput
            value={customCondition}
            onChange={setCustomCondition}
            onKeyPress={handleKeyPress}
          />

          <Button 
            onClick={handleSaveConditions}
            disabled={loading || (selectedConditions.length === 0 && !customCondition.trim())}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Add Selected Conditions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConditionsSelector;
