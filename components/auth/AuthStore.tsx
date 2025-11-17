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
        console.log('Auth state changed:', event);
        
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
      console.error('Error loading stored session:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSessionUpdate = async (session: Session) => {
    try {
      console.log('AuthStore: Handling session update for user:', session.user.id);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

      let profile = null;
      
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('AuthStore: Error loading profile:', JSON.stringify(profileError, null, 2));
        console.error('AuthStore: Profile error details:', profileError);
      } else if (!existingProfile) {
        console.log('AuthStore: No profile found yet for user:', session.user.id);
        console.log('AuthStore: Waiting for trigger to create profile...');
        
        // Wait for the database trigger to create the profile
        // Retry a few times with exponential backoff
        let retryCount = 0;
        const maxRetries = 5;
        
        while (retryCount < maxRetries && !profile) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (retryProfile) {
            profile = retryProfile;
            console.log('AuthStore: Profile found after retry', retryCount + 1);
            break;
          }
          
          retryCount++;
        }
        
        if (!profile) {
          console.error('AuthStore: Profile not created by trigger after', maxRetries, 'retries');
        }
      } else {
        profile = existingProfile;
        console.log('AuthStore: Profile loaded:', profile);
      }

      setAuthState({
        user: session.user,
        profile: profile || null,
        session,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('AuthStore: Error handling session update:', error);
      setAuthState({
        user: session.user,
        profile: null,
        session,
        isLoading: false,
        isAuthenticated: true,
      });
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
      console.error('Error handling session end:', error);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('AuthStore: Starting login for', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthStore: Supabase auth error:', error);
        throw error;
      }

      if (!data.session) {
        console.error('AuthStore: No session returned from login');
        throw new Error('No session returned from login');
      }

      console.log('AuthStore: Login successful, user ID:', data.user.id);
      console.log('AuthStore: Loading profile...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('AuthStore: Error loading profile:', profileError);
        throw new Error('Failed to load user profile');
      }
      
      if (!profileData) {
        console.error('AuthStore: Profile not found for user');
        throw new Error('User profile not found');
      }
      
      const profile = profileData as Profile;
      
      if (!profile.is_active) {
        console.error('AuthStore: User account is not active');
        await supabase.auth.signOut();
        throw new Error('Your account is not active. Please contact support.');
      }
      
      console.log('AuthStore: Profile loaded:', profile);
      console.log('AuthStore: Updating auth state immediately...');
      
      // Update auth state immediately instead of waiting for onAuthStateChange
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.session));
      setAuthState({
        user: data.user,
        profile: profile,
        session: data.session,
        isLoading: false,
        isAuthenticated: true,
      });
      
      return {
        success: true,
        profile,
      };
    } catch (error) {
      console.error('AuthStore: Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
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
      const fullName = `${firstName} ${lastName}`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            role: role,
            phone: phone || null,
          }
        }
      });

      if (authError || !authData.user || !authData.session) {
        console.error('Signup error:', authError);
        throw authError || new Error('Signup failed');
      }

      console.log('AuthStore: User created successfully, user ID:', authData.user.id);
      console.log('AuthStore: Metadata sent:', authData.user.user_metadata);
      console.log('AuthStore: Waiting for database trigger to create profile and role-specific profile...');
      
      // Wait for profile to be created by trigger
      let profile = null;
      let retryCount = 0;
      const maxRetries = 10;
      
      while (retryCount < maxRetries && !profile) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        if (profileData) {
          profile = profileData;
          console.log('AuthStore: Profile found after retry', retryCount + 1);
          break;
        }
        
        retryCount++;
      }
      
      if (!profile) {
        console.error('AuthStore: Profile not created by trigger after', maxRetries, 'retries');
        throw new Error('Failed to create user profile');
      }
      
      // Update auth state immediately
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData.session));
      setAuthState({
        user: authData.user,
        profile: profile as Profile,
        session: authData.session,
        isLoading: false,
        isAuthenticated: true,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('Starting logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error from supabase:', error);
        throw error;
      }
      
      console.log('Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!authState.user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authState.user.id)
        .single();

      if (profile) {
        setAuthState((prev) => ({
          ...prev,
          profile,
        }));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
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
