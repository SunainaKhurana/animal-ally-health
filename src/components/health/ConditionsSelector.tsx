import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePetConditions } from '@/hooks/usePetConditions';

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

  const handleRemoveCondition = async (conditionId: string) => {
    try {
      const { error } = await supabase
        .from('pet_conditions')
        .delete()
        .eq('id', conditionId);

      if (error) throw error;

      toast({
        title: "Condition removed",
        description: "The condition has been removed from your pet's profile.",
      });

      refetch();
    } catch (error) {
      console.error('Error removing condition:', error);
      toast({
        title: "Error",
        description: "Failed to remove condition. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing conditions */}
        {conditions.length > 0 && (
          <div className="space-y-2">
            <Label>Current Conditions:</Label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition) => (
                <Badge key={condition.id} variant="secondary" className="text-xs">
                  {condition.condition_name}
                  <button
                    onClick={() => handleRemoveCondition(condition.id)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add new conditions */}
        <div className="space-y-3">
          <Label>Select Common Conditions:</Label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {availableConditions.map((condition) => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={condition}
                  checked={selectedConditions.includes(condition)}
                  onCheckedChange={() => handleConditionToggle(condition)}
                />
                <Label 
                  htmlFor={condition}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {condition}
                </Label>
              </div>
            ))}
          </div>

          {/* Custom condition input */}
          <div className="space-y-2">
            <Label>Add other conditions (if not listed):</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter condition name"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveConditions()}
              />
            </div>
          </div>

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
