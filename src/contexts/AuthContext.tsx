
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState, debugAuthState } from '@/lib/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  retry: () => void;
  forceReauth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = async (skipCleanup = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Initializing authentication...');
      
      if (!skipCleanup) {
        // Clean up any stale auth state first
        cleanupAuthState();
        
        // Wait a moment for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      
      console.log('📊 Session retrieved:', session?.user?.id || 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Debug auth state
      await debugAuthState(supabase);
      
    } catch (error: any) {
      console.error('❌ Auth initialization error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const forceReauth = async () => {
    console.log('🔄 Forcing reauthentication...');
    
    // Clear everything and force a fresh start
    cleanupAuthState();
    
    try {
      // Sign out globally first
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.log('Sign out error (continuing):', error);
    }
    
    // Force page reload to completely reset state
    window.location.reload();
  };

  useEffect(() => {
    initAuth(true); // Skip cleanup on initial load

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id || 'No user');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
      
      // Debug when auth state changes
      if (event === 'SIGNED_IN' && session) {
        setTimeout(async () => {
          await debugAuthState(supabase);
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      
      // Clean up first
      cleanupAuthState();
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setError(null);
      
      // Force page reload for clean state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message || 'Sign out failed');
      throw error;
    }
  };

  const retry = () => {
    console.log('🔄 Retrying authentication...');
    initAuth();
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signOut,
    retry,
    forceReauth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
