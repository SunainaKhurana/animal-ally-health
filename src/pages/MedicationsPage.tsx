import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOptimizedPrescriptions } from '@/hooks/useOptimizedPrescriptions';
import { usePetContext } from '@/contexts/PetContext';
import { AddMedicationDialog } from '@/components/medications/AddMedicationDialog';
import { OptimizedMedicationCard } from '@/components/medications/OptimizedMedicationCard';
import { MedicationLoadingState } from '@/components/medications/shared/MedicationLoadingState';
import { MedicationEmptyState } from '@/components/medications/shared/MedicationEmptyState';
import { PerformanceMonitor } from '@/lib/performanceMonitor';


export const MedicationsPage = () => {
  PerformanceMonitor.useRenderTimer('MedicationsPage');
  
  const { petId } = useParams();
  const navigate = useNavigate();
  const { pets, loading: petsLoading } = usePetContext();
  const { 
    prescriptions, 
    overduePrescriptions, 
    loading: prescriptionsLoading, 
    markAsTaken, 
    refetch,
    medicationLogs 
  } = useOptimizedPrescriptions(petId);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const selectedPet = useMemo(() => pets.find(pet => pet.id === petId), [pets, petId]);

  // Memoized medication data with logs
  const medicationData = useMemo(() => {
    return prescriptions.map(prescription => {
      const logs = medicationLogs.filter(log => log.prescription_id === prescription.id);
      const lastLog = logs[0]; // logs are ordered by given_at desc
      
      let nextDue: Date | null = null;
      if (lastLog) {
        nextDue = new Date(lastLog.given_at);
        nextDue.setDate(nextDue.getDate() + 1);
      } else {
        nextDue = new Date();
      }
      
      const isOverdue = nextDue && new Date() > nextDue;
      
      return {
        prescription,
        lastTaken: lastLog?.given_at,
        nextDue,
        isOverdue: !!isOverdue
      };
    });
  }, [prescriptions, medicationLogs]);

  // Show loading while pets are being fetched
  if (petsLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Pet not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Medications</h1>
            <p className="text-muted-foreground">{selectedPet.name}</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Medication
        </Button>
      </div>

      {/* Pet Info Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="text-2xl">🐾</div>
            </div>
            <div>
              <h3 className="font-semibold">{selectedPet.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedPet.breed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Medications Alert */}
      {overduePrescriptions.length > 0 && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-red-800 mb-2">
              {overduePrescriptions.length} medication{overduePrescriptions.length > 1 ? 's' : ''} overdue
            </h3>
            <p className="text-sm text-red-700">
              Please check the medications below and mark them as taken if applicable.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Medications List */}
      {prescriptionsLoading ? (
        <MedicationLoadingState />
      ) : prescriptions.length > 0 ? (
        <div className="space-y-4">
          {medicationData.map(({ prescription, lastTaken, nextDue, isOverdue }) => (
            <OptimizedMedicationCard 
              key={prescription.id} 
              prescription={prescription}
              lastTaken={lastTaken}
              nextDue={nextDue}
              isOverdue={isOverdue}
              onMarkAsTaken={markAsTaken}
            />
          ))}
        </div>
      ) : (
        <MedicationEmptyState onAddMedication={() => setShowAddDialog(true)} />
      )}

      {/* Add Medication Dialog */}
      <AddMedicationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        petId={petId!}
        petName={selectedPet.name}
        onMedicationAdded={() => {
          refetch();
          setShowAddDialog(false);
        }}
      />
    </div>
  );
};