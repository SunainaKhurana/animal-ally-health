
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to clean up invalid auth state
const cleanupAuthState = () => {
  console.log('Cleaning up auth state...');
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  const initializeAuth = async () => {
    try {
      console.log('Initializing auth...');
      setLoading(true);
      setError(null);
      
      // Get current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // If session is invalid, clean up and continue
        if (sessionError.message?.includes('Invalid session') || 
            sessionError.message?.includes('session_not_found')) {
          console.log('Invalid session detected, cleaning up...');
          cleanupAuthState();
          setSession(null);
          setUser(null);
          setError(null);
        } else {
          throw sessionError;
        }
      } else {
        console.log('Current session:', currentSession ? 'Found' : 'None');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      
    } catch (error: any) {
      console.error('Auth initialization failed:', error);
      setError(error.message || 'Failed to initialize authentication');
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const retry = () => {
    console.log('Retrying auth initialization...');
    setInitialized(false);
    initializeAuth();
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      // Clean up auth state first
      setSession(null);
      setUser(null);
      setError(null);
      
      // Clear localStorage
      cleanupAuthState();
      
      // Attempt Supabase sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error && !error.message.includes('Unable to get user from token') && 
          !error.message.includes('session_not_found')) {
        console.warn('Sign out error (non-critical):', error);
      }
      
      toast({
        title: "See you later! 👋",
        description: "You have been signed out successfully.",
      });
      
      // Force a page refresh to ensure clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Even if sign out fails, clear local state and redirect
      setSession(null);
      setUser(null);
      setError(null);
      cleanupAuthState();
      toast({
        title: "Signed out",
        description: "You have been signed out.",
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        // Handle session changes
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (event === 'SIGNED_OUT') {
            setError(null);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully');
            setError(null);
          } else if (event === 'SIGNED_IN') {
            console.log('User signed in successfully');
            setError(null);
          }
        }
      }
    );

    // THEN initialize auth if not already initialized
    if (!initialized) {
      initializeAuth();
    }

    return () => {
      console.log('Cleaning up auth subscription...');
      subscription.unsubscribe();
    };
  }, [initialized]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    retry,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
