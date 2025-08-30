
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
  const [retryCount, setRetryCount] = useState(0);

  const initAuth = async (skipCleanup = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Initializing authentication...');
      
      if (!skipCleanup) {
        cleanupAuthState();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        
        // Handle specific error types more gracefully
        if (sessionError.message?.includes('Invalid Refresh Token')) {
          console.log('Invalid refresh token, clearing auth state...');
          cleanupAuthState();
          setUser(null);
          setSession(null);
          setError(null);
          setLoading(false);
          return;
        }
        
        throw sessionError;
      }
      
      console.log('📊 Session retrieved:', session?.user?.id || 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      setRetryCount(0); // Reset retry count on success
      
      await debugAuthState(supabase);
      
    } catch (error: any) {
      console.error('❌ Auth initialization error:', error);
      
      // Don't show error for common cases that should be handled silently
      const isRecoverableError = error.message?.includes('Invalid Refresh Token') ||
                                error.message?.includes('session_not_found') ||
                                error.message?.includes('network');
      
      if (!isRecoverableError || retryCount > 2) {
        setError(error.message || 'Authentication failed');
      }
      
      // Set user/session to null on auth errors
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const forceReauth = async () => {
    console.log('🔄 Forcing reauthentication...');
    
    cleanupAuthState();
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.log('Sign out error (continuing):', error);
    }
    
    window.location.reload();
  };

  useEffect(() => {
    initAuth(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id || 'No user');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
      setRetryCount(0);
      
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
      
      cleanupAuthState();
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setError(null);
      
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message || 'Sign out failed');
      throw error;
    }
  };

  const retry = () => {
    console.log('🔄 Retrying authentication...');
    setRetryCount(prev => prev + 1);
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
