import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import AddPetDialog from '@/components/pets/AddPetDialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePetContext } from '@/contexts/PetContext';

type OnboardingStep = 'welcome' | 'profile' | 'pet' | 'complete';

export const UserOnboarding = () => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const { user } = useAuth();
  const { pets } = usePetContext();
  const { toast } = useToast();

  const progress = {
    welcome: 25,
    profile: 50,
    pet: 75,
    complete: 100
  };

  const handleProfileSubmit = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          onboarding_step: 'pet'
        }
      });

      if (updateError) throw updateError;

      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          full_name: fullName,
        });

      if (profileError) throw profileError;

      setStep('pet');
      toast({
        title: "Profile saved! ✨",
        description: "Let's add your first furry friend.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPet = async () => {
    await completeOnboarding();
  };

  const handlePetAdded = async () => {
    setShowAddPet(false);
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          onboarding_step: 'complete'
        }
      });

      if (error) throw error;

      setStep('complete');
      toast({
        title: "Welcome to PetZone! 🎉",
        description: "You're all set to start your pet care journey.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to PetZone!
            </CardTitle>
            <CardDescription>
              Let's set up your account and get you started with managing your pet's health and wellness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress[step]} className="mb-6" />
            <Button 
              onClick={() => setStep('profile')}
              className="w-full bg-orange-500 hover:bg-orange-600 h-12"
            >
              Get Started 🚀
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">👋</div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Tell us about yourself
            </CardTitle>
            <CardDescription>
              We'd love to know what to call you!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progress[step]} className="mb-6" />
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12"
              />
            </div>
            
            <Button 
              onClick={handleProfileSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 h-12"
              disabled={loading || !fullName.trim()}
            >
              {loading ? 'Saving...' : 'Continue 🐾'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'pet') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🐕🐱</div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Add your first pet
            </CardTitle>
            <CardDescription>
              Tell us about your furry friend so we can provide personalized care recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progress[step]} className="mb-6" />
            
            <Button 
              onClick={() => setShowAddPet(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 h-12"
            >
              Add My Pet 🐾
            </Button>
            
            <Button 
              onClick={handleSkipPet}
              variant="ghost"
              className="w-full h-12"
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Skip for now'}
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
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">✨</div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              You're all set!
            </CardTitle>
            <CardDescription>
              {pets.length > 0 
                ? `Welcome to PetZone! Let's take great care of ${pets[0]?.name}.`
                : "Welcome to PetZone! You can add your pets anytime from the profile section."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-orange-500 hover:bg-orange-600 h-12"
            >
              Enter PetZone 🏠
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};