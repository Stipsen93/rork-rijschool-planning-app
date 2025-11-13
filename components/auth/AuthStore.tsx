import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type InstructorProfileInsert = Database['public']['Tables']['instructor_profiles']['Insert'];
type StudentProfileInsert = Database['public']['Tables']['student_profiles']['Insert'];

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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('AuthStore: Error loading profile:', profileError);
      }
      
      console.log('AuthStore: Profile loaded:', profile);

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
      console.log('AuthStore: Waiting for profile to load...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('AuthStore: Profile loaded:', authState.profile);
      
      return {
        success: true,
        profile: authState.profile,
      };
    } catch (error) {
      console.error('AuthStore: Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }, [authState.profile]);

  const signup = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: 'instructor' | 'student',
    phone?: string
  ) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw authError || new Error('Signup failed');
      }

      const profileData: ProfileInsert = {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        phone: phone || null,
        is_active: true,
      };

      const { error: profileError } = await supabase.from('profiles').insert(profileData as any);

      if (profileError) {
        throw profileError;
      }

      if (role === 'instructor') {
        const instructorData: InstructorProfileInsert = {
          user_id: authData.user.id,
          rating: 0,
          total_lessons: 0,
        };
        await supabase.from('instructor_profiles').insert(instructorData as any);
      } else {
        const studentData: StudentProfileInsert = {
          user_id: authData.user.id,
          lesson_streak: 0,
          total_lessons_completed: 0,
          hours_driven: 0,
          overall_progress: 0,
        };
        await supabase.from('student_profiles').insert(studentData as any);
      }

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
