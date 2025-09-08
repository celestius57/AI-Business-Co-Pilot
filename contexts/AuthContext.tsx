import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { User, UserSettings } from '../types';
import { supabase } from '../services/supabaseClient';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

const DEFAULT_USER_SETTINGS: UserSettings = {
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Europe/London',
    country: 'GB',
    currency: 'USD',
    globalApiRequestLimit: 100,
    generatedDocsTimeframe: 30,
    notificationSettings: {
        eventStart: true,
        taskDueDate: true,
        reminder: true,
    },
};
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isInitialized: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (name: string, email: string, pass: string) => Promise<any>;
  signOut: () => Promise<any>;
  updateUser: (data: Partial<Omit<User, 'id' | 'email'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isInitialized: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
            setSession(session);
            if (session?.user) {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              // A profile might not exist immediately after sign-up.
              // PGRST116 is the error code for "The result contains 0 rows".
              if (profileError && profileError.code !== 'PGRST116') {
                  throw profileError;
              }
              
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.user_metadata?.name || 'New User',
                picture: profile?.picture || session.user.user_metadata?.picture || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(session.user.email || 'U')}`,
                settings: profile?.settings || DEFAULT_USER_SETTINGS
              });
            } else {
              setUser(null);
            }
        } catch (error) {
            console.error("Error in onAuthStateChange handler:", error);
            setUser(null);
            setSession(null);
        } finally {
            // After the first event (INITIAL_SESSION), we can consider the auth state initialized.
            // This ensures the app doesn't get stuck on the loading screen.
            setIsInitialized(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string, pass: string) => supabase.auth.signInWithPassword({ email, password: pass });

  const signUp = (name: string, email: string, pass: string) => supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        name: name,
        picture: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`, // Default avatar
      }
    }
  });

  const signOut = () => supabase.auth.signOut();

  const updateUser = async (data: Partial<Omit<User, 'id' | 'email'>>) => {
    if (!user) return;
    
    const { error } = await supabase.from('profiles').update({
        name: data.name,
        picture: data.picture,
        settings: data.settings,
    }).eq('id', user.id);

    if (error) {
        console.error("Error updating profile:", error);
        return;
    }

    setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, ...data };
        return updatedUser;
    });
  };


  const value = {
    user,
    session,
    isInitialized,
    signIn,
    signUp,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);