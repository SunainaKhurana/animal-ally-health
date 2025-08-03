
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

type OnboardingStep = 'welcome' | 'profile' | 'pet' | 'complete';

export const UserOnboarding = () => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [petAdded, setPetAdded] = useState(false);
  const { user } = useAuth();
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

    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating/updating profile for user:', user.id);

      // Use upsert to handle existing profiles gracefully
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName.trim(),
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName.trim(),
          onboarding_step: 'pet'
        }
      });

      if (updateError) {
        console.error('User metadata update error:', updateError);
        // Don't throw here - profile is created, metadata update is secondary
        console.warn('Profile created but metadata update failed:', updateError.message);
      }

      setStep('pet');
      toast({
        title: "Profile saved! ✨",
        description: "Let's add your first furry friend.",
      });
    } catch (error: any) {
      console.error('Profile creation failed:', error);
      
      // Handle specific error types
      if (error.code === '23505') {
        // Unique constraint violation - profile already exists
        console.log('Profile already exists, attempting to update...');
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ full_name: fullName.trim() })
            .eq('user_id', user.id);

          if (updateError) throw updateError;

          setStep('pet');
          toast({
            title: "Profile updated! ✨",
            description: "Let's add your first furry friend.",
          });
          return;
        } catch (updateError: any) {
          console.error('Profile update also failed:', updateError);
        }
      }

      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
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
    console.log('Pet added successfully during onboarding');
    setPetAdded(true);
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

      setStep('complete');
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
              {petAdded 
                ? "Welcome to PetZone! Let's take great care of your furry friend."
                : "Welcome to PetZone! You can add your pets anytime from the profile section."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/'}
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
