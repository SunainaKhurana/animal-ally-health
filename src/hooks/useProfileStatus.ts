
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileStatus {
  profileExists: boolean;
  onboardingCompleted: boolean;
  loading: boolean;
  error: string | null;
}

export const useProfileStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ProfileStatus>({
    profileExists: false,
    onboardingCompleted: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user) {
        setStatus({
          profileExists: false,
          onboardingCompleted: false,
          loading: false,
          error: null
        });
        return;
      }

      try {
        console.log('Checking profile status for user:', user.id);
        
        // Check if profile exists in database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error checking profile:', profileError);
          throw profileError;
        }

        // Check user metadata for onboarding completion
        const metadataOnboardingCompleted = user.user_metadata?.onboarding_completed === true;
        
        // Consider onboarding completed if:
        // 1. User metadata says it's completed, OR
        // 2. Profile exists and has full_name (indicating completed onboarding)
        const onboardingCompleted = metadataOnboardingCompleted || 
          (profile && profile.full_name && profile.full_name.trim() !== '');

        console.log('Profile status:', {
          profileExists: !!profile,
          onboardingCompleted,
          metadataOnboardingCompleted,
          profileHasName: profile?.full_name
        });

        setStatus({
          profileExists: !!profile,
          onboardingCompleted,
          loading: false,
          error: null
        });

      } catch (error: any) {
        console.error('Profile status check failed:', error);
        setStatus({
          profileExists: false,
          onboardingCompleted: false,
          loading: false,
          error: error.message
        });
      }
    };

    checkProfileStatus();
  }, [user]);

  return status;
};
