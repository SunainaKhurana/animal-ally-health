
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AddPetDialog from '@/components/pets/AddPetDialog';
import { useAuth } from '@/contexts/AuthContext';

export const UserOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePetAdded = async () => {
    console.log('Pet added successfully during onboarding');
    setShowAddPet(false);
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Completing onboarding for user:', user.id);

      const { error } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          onboarding_step: 'complete'
        }
      });

      if (error) {
        console.error('Onboarding completion error:', error);
        throw error;
      }

      toast({
        title: "Welcome to PetZone! 🎉",
        description: "You're all set to start your pet care journey.",
      });

      // Force a page refresh to ensure clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error: any) {
      console.error('Onboarding completion failed:', error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-8xl mb-6">🐾</div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to PetZone!
          </CardTitle>
          <CardDescription className="text-lg">
            Start tracking your pet's health more effectively with personalized care insights and reminders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-4">
              <div className="text-4xl">🏥</div>
              <div className="text-4xl">📊</div>
              <div className="text-4xl">💊</div>
              <div className="text-4xl">🚶‍♂️</div>
            </div>
            <p className="text-sm text-gray-600">
              Health reports • Activity tracking • Medication reminders • Vet appointments
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddPet(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 h-14 text-lg"
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Add Your First Pet 🐕🐱'}
          </Button>

          <AddPetDialog 
            open={showAddPet}
            onOpenChange={setShowAddPet}
            onAddPet={handlePetAdded}
          />
        </CardContent>
      </Card>
    </div>
  );
};
