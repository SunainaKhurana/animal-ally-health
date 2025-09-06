import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pill, Camera, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { usePetContext } from '@/contexts/PetContext';
import { AddMedicationDialog } from '@/components/medications/AddMedicationDialog';
import { MedicationCard } from '@/components/medications/MedicationCard';


export const MedicationsPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { pets, loading: petsLoading } = usePetContext();
  const { prescriptions, loading: prescriptionsLoading, refetch } = usePrescriptions(petId);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const selectedPet = pets.find(pet => pet.id === petId);

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

      {/* Medications List */}
      {prescriptionsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : prescriptions.length > 0 ? (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <MedicationCard key={prescription.id} prescription={prescription} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No medications yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your pet's medications by adding them here.</p>
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add First Medication
          </Button>
        </div>
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