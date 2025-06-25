import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit3, Heart } from 'lucide-react';
import { usePetConditions } from '@/hooks/usePetConditions';
import ConditionsFormPanel from './ConditionsFormPanel';
import ConditionsBadges from './ConditionsBadges';

interface CollapsibleConditionsSectionProps {
  petId: string;
  petSpecies: string;
}

const CollapsibleConditionsSection = ({ petId, petSpecies }: CollapsibleConditionsSectionProps) => {
  const [showForm, setShowForm] = useState(false);
  const { conditions, refetch } = usePetConditions(petId);

  const hasConditions = conditions.length > 0;
  const existingConditionNames = conditions.map(c => c.condition_name);

  const handleSave = () => {
    refetch();
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Health Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Conditions Display */}
        {!showForm && (
          <>
            <ConditionsBadges 
              conditions={conditions}
              onRefetch={refetch}
            />
            
            <Button
              onClick={() => setShowForm(true)}
              variant={hasConditions ? "outline" : "default"}
              className="w-full"
            >
              {hasConditions ? (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Conditions
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Conditions
                </>
              )}
            </Button>
          </>
        )}

        {/* Form Panel */}
        {showForm && (
          <ConditionsFormPanel
            petId={petId}
            petSpecies={petSpecies}
            onSave={handleSave}
            onCancel={handleCancel}
            existingConditions={existingConditionNames}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CollapsibleConditionsSection;
