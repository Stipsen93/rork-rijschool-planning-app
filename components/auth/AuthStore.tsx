import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = 'auth_session';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State changed:', event);
        
        if (session) {
          await handleSessionUpdate(session);
        } else {
          await handleSessionEnd();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      
      if (storedSession) {
        const session: Session = JSON.parse(storedSession);
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[Auth] Load session error:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSessionUpdate = async (session: Session) => {
    try {
      console.log('[Auth] Session updated for:', session.user.id);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('[Auth] No profile found (no rows), waiting...');
          
          let retryCount = 0;
          let foundProfile = null;
          
          while (retryCount < 5) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { data: retryProfile, error: retryError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (retryProfile && !retryError) {
              foundProfile = retryProfile;
              break;
            }
            retryCount++;
          }
          
          if (foundProfile) {
            setAuthState({
              user: session.user,
              profile: foundProfile,
              session,
              isLoading: false,
              isAuthenticated: true,
            });
            return;
          } else {
            console.error('[Auth] Profile not found after retries');
            setAuthState((prev) => ({ ...prev, isLoading: false }));
            return;
          }
        }
        
        console.error('[Auth] Profile fetch error:', profileError);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setAuthState({
        user: session.user,
        profile: profile || null,
        session,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('[Auth] Session update error:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSessionEnd = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('[Auth] Session end error:', error);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('[Auth] Starting login for', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session || !data.user) {
        throw new Error('No session returned');
      }

      console.log('[Auth] Login successful, loading profile...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          throw new Error('Profiel niet gevonden');
        }
        throw new Error(profileError.message || 'Profiel ophalen mislukt');
      }
      
      if (!profileData) {
        throw new Error('Profiel niet gevonden');
      }
      
      const profile = profileData as Profile;
      
      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('Account is niet actief');
      }
      
      console.log('[Auth] Setting authenticated state');
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.session));
      setAuthState({
        user: data.user,
        profile: profileData,
        session: data.session,
        isLoading: false,
        isAuthenticated: true,
      });
      
      console.log('[Auth] Login complete');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Inloggen mislukt',
      };
    }
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'instructor' | 'student',
    phone?: string
  ) => {
    try {
      console.log('[Auth] Starting signup for', email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
            role,
            phone: phone || null,
          }
        }
      });

      if (authError || !authData.user || !authData.session) {
        throw authError || new Error('Registratie mislukt');
      }

      console.log('[Auth] User created, waiting for profile...');
      
      let profile = null;
      let retryCount = 0;
      
      while (retryCount < 10 && !profile) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileData && !profileError) {
          profile = profileData;
          break;
        }
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('[Auth] Profile fetch error:', profileError);
        }
        
        retryCount++;
      }
      
      if (!profile) {
        throw new Error('Profiel aanmaken time-out');
      }
      
      console.log('[Auth] Setting authenticated state');
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData.session));
      setAuthState({
        user: authData.user,
        profile: profile as Profile,
        session: authData.session,
        isLoading: false,
        isAuthenticated: true,
      });

      console.log('[Auth] Signup complete');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Signup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registratie mislukt',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!authState.user) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authState.user.id)
        .single();

      if (profileError) {
        console.error('[Auth] Refresh profile error:', profileError);
        return;
      }

      if (profile) {
        setAuthState((prev) => ({ ...prev, profile }));
      }
    } catch (error) {
      console.error('[Auth] Refresh profile error:', error);
    }
  }, [authState.user]);

  return useMemo(
    () => ({
      ...authState,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [authState, login, signup, logout, refreshProfile]
  );
});
