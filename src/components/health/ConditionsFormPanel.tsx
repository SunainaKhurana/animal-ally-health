
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GENERIC_CONDITIONS = [
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

interface ConditionsFormPanelProps {
  petId: string;
  petSpecies: string;
  onSave: () => void;
  onCancel: () => void;
  existingConditions: string[];
}

const ConditionsFormPanel = ({ 
  petId, 
  petSpecies, 
  onSave, 
  onCancel,
  existingConditions 
}: ConditionsFormPanelProps) => {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const fetchSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('disease_knowledge')
        .select('disease')
        .eq('pet_type', petSpecies.toLowerCase())
        .ilike('disease', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      const filteredSuggestions = (data || [])
        .map(item => item.disease)
        .filter(disease => 
          !GENERIC_CONDITIONS.includes(disease) && 
          !existingConditions.includes(disease)
        );

      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleCustomConditionChange = (value: string) => {
    setCustomCondition(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCustomCondition(suggestion);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    const conditionsToSave = [...selectedConditions];
    if (customCondition.trim()) {
      conditionsToSave.push(customCondition.trim());
    }

    if (conditionsToSave.length === 0) {
      toast({
        title: "No conditions selected",
        description: "Please select at least one condition or add a custom condition.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Save each condition as a separate row
      for (const condition of conditionsToSave) {
        // Check if condition already exists for this pet
        const { data: existing } = await supabase
          .from('pet_conditions')
          .select('id')
          .eq('pet_id', petId)
          .ilike('condition_name', condition)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('pet_conditions')
            .insert({
              pet_id: petId,
              condition_name: condition,
              status: 'active'
            });

          if (error) throw error;
        }
      }

      toast({
        title: "Conditions saved",
        description: "The selected conditions have been added to your pet's profile.",
      });

      onSave();
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

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Select Conditions</Label>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Generic Conditions List */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Common Conditions:</Label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {GENERIC_CONDITIONS.map((condition) => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={condition}
                  checked={selectedConditions.includes(condition)}
                  onCheckedChange={() => handleConditionToggle(condition)}
                  disabled={existingConditions.includes(condition)}
                />
                <Label 
                  htmlFor={condition}
                  className={`text-sm cursor-pointer flex-1 ${
                    existingConditions.includes(condition) 
                      ? 'text-gray-400 line-through' 
                      : 'font-normal'
                  }`}
                >
                  {condition}
                  {existingConditions.includes(condition) && (
                    <span className="text-xs text-gray-500 ml-2">(already added)</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Condition Input */}
        <div className="space-y-2 relative">
          <Label htmlFor="custom-condition">Add another condition (if not listed)</Label>
          <Input
            id="custom-condition"
            placeholder="Start typing to find conditions like Addison's, IVDD, or something specific your vet mentioned"
            value={customCondition}
            onChange={(e) => handleCustomConditionChange(e.target.value)}
            onFocus={() => {
              if (customCondition.length >= 2) {
                fetchSuggestions(customCondition);
              }
            }}
          />
          <p className="text-xs text-gray-500">
            Start typing to find conditions like Addison's, IVDD, or something specific your vet mentioned.
          </p>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={loading || (selectedConditions.length === 0 && !customCondition.trim())}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Conditions'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConditionsFormPanel;
