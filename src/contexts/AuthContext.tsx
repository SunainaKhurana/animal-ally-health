
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
    } catch (error: any) {
      console.error('Auth initialization failed:', error);
      setError(error.message || 'Failed to initialize authentication');
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    console.log('Retrying auth initialization...');
    initializeAuth();
  };

  const signOut = async () => {
    try {
      // Clean up auth state first
      setSession(null);
      setUser(null);
      setError(null);
      
      // Clear any localStorage auth data
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt Supabase sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error && error.message !== 'Unable to get user from token') {
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
