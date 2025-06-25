
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PetCondition } from '@/hooks/usePetConditions';

interface ConditionsBadgesProps {
  conditions: PetCondition[];
  onRefetch: () => void;
}

const ConditionsBadges = ({ conditions, onRefetch }: ConditionsBadgesProps) => {
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

  if (conditions.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No conditions recorded yet
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {conditions.map((condition) => (
        <Badge key={condition.id} variant="secondary" className="text-sm px-3 py-1">
          {condition.condition_name}
          <button
            onClick={() => handleRemoveCondition(condition.id)}
            className="ml-2 hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
};

export default ConditionsBadges;
