
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneAuthForm } from './PhoneAuthForm';
import { UserOnboarding } from './UserOnboarding';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <PhoneAuthForm />;
  }

  // Check if user needs onboarding
  const needsOnboarding = !user.user_metadata?.onboarding_completed;
  
  if (needsOnboarding) {
    return <UserOnboarding />;
  }

  return <>{children}</>;
};
