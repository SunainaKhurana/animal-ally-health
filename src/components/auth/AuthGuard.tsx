
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneAuthForm } from './PhoneAuthForm';
import { UserOnboarding } from './UserOnboarding';
import { useProfileStatus } from '@/hooks/useProfileStatus';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading, error, retry } = useAuth();
  const profileStatus = useProfileStatus();

  if (loading || profileStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={retry}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <PhoneAuthForm />;
  }

  // Show onboarding if not completed
  if (!profileStatus.onboardingCompleted) {
    return <UserOnboarding />;
  }

  return <>{children}</>;
};
