import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  user_type: 'individual' | 'firm';
  avatar_url: string | null;
  location: string | null;
}

interface LawFirm {
  id: string;
  user_id: string;
  firm_name: string;
  description: string | null;
  practice_areas: string[];
  is_verified: boolean;
  nda_signed: boolean;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  lawFirm: LawFirm | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, userType: 'individual' | 'firm') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lawFirm, setLawFirm] = useState<LawFirm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    setProfile(data);

    if (data?.user_type === 'firm') {
      const { data: firmData } = await supabase
        .from('law_firms')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      setLawFirm(firmData);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let currentUserId: string | null = null;

    // Restore session from storage first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      currentUserId = session?.user?.id ?? null;
      if (session?.user) {
        fetchProfile(session.user.id).then(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Skip token refresh events - session is already valid
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          return;
        }

        const newUserId = session?.user?.id ?? null;
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && newUserId !== currentUserId) {
          // New user signed in - fetch their profile
          currentUserId = newUserId;
          setIsLoading(true);
          setTimeout(() => {
            fetchProfile(session.user.id).then(() => {
              if (mounted) setIsLoading(false);
            });
          }, 0);
        } else if (session?.user && newUserId === currentUserId) {
          // Same user, just update session (e.g. after setSession from OAuth)
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              fetchProfile(session.user.id);
            }, 0);
          }
        } else if (!session) {
          currentUserId = null;
          setProfile(null);
          setLawFirm(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, userType: 'individual' | 'firm') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          user_type: userType
        }
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { lovable } = await import('@/integrations/lovable/index');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    
    return { error: result.error ? (result.error as Error) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setLawFirm(null);
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      lawFirm,
      isLoading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshProfile,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
