
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PetCondition } from '@/hooks/usePetConditions';

interface ExistingConditionsProps {
  conditions: PetCondition[];
  onRefetch: () => void;
}

const ExistingConditions = ({ conditions, onRefetch }: ExistingConditionsProps) => {
  const { toast } = useToast();

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

      onRefetch();
    } catch (error) {
      console.error('Error removing condition:', error);
      toast({
        title: "Error",
        description: "Failed to remove condition. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (conditions.length === 0) return null;

  return (
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
  );
};

export default ExistingConditions;
