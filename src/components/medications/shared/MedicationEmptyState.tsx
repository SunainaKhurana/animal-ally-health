import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pill } from 'lucide-react';

interface MedicationEmptyStateProps {
  onAddMedication: () => void;
}

export const MedicationEmptyState: React.FC<MedicationEmptyStateProps> = ({ onAddMedication }) => {
  return (
    <div className="text-center py-12">
      <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-3">No medications yet</h3>
      <p className="text-muted-foreground mb-6">Start tracking your pet's medications by adding them here.</p>
      <Button onClick={onAddMedication} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add First Medication
      </Button>
    </div>
  );
};