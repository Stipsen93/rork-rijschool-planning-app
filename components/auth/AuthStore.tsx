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
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout | null = null;
    
    const createTimeout = () => {
      return new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Login duurde te lang (> 5s)'));
        }, 5000);
      });
    };

    try {
      console.log(`[Auth:${Date.now() - startTime}ms] START login for ${email}`);
      
      const loginPromise = (async () => {
        try {
          const signInStart = Date.now();
          console.log(`[Auth:${Date.now() - startTime}ms] → Calling signInWithPassword`);
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          console.log(`[Auth:${Date.now() - startTime}ms] ✓ signInWithPassword resolved (${Date.now() - signInStart}ms)`);

          if (error) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ signInWithPassword error:`, error.message);
            throw error;
          }
          if (!data.session || !data.user) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ No session returned`);
            throw new Error('No session returned');
          }

          console.log(`[Auth:${Date.now() - startTime}ms] ✓ Session received for user: ${data.user.id}`);

          const getSessionStart = Date.now();
          console.log(`[Auth:${Date.now() - startTime}ms] → Getting current session`);
          const { data: { session } } = await supabase.auth.getSession();
          console.log(`[Auth:${Date.now() - startTime}ms] ✓ getSession resolved (${Date.now() - getSessionStart}ms)`);

          const getUserStart = Date.now();
          console.log(`[Auth:${Date.now() - startTime}ms] → Getting user data`);
          const { data: { user } } = await supabase.auth.getUser();
          console.log(`[Auth:${Date.now() - startTime}ms] ✓ getUser resolved (${Date.now() - getUserStart}ms)`);

          const profileStart = Date.now();
          console.log(`[Auth:${Date.now() - startTime}ms] → Fetching profile`);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          console.log(`[Auth:${Date.now() - startTime}ms] ✓ Profile fetch resolved (${Date.now() - profileStart}ms)`);
          
          if (profileError) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ Profile error:`, profileError.message, `(code: ${profileError.code})`);
            if (profileError.code === 'PGRST116') {
              throw new Error('Profiel niet gevonden');
            }
            throw new Error(profileError.message || 'Profiel ophalen mislukt');
          }
          
          if (!profileData) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ No profile data returned`);
            throw new Error('Profiel niet gevonden');
          }
          
          console.log(`[Auth:${Date.now() - startTime}ms] ✓ Profile data received`);
          
          const profile = profileData as Profile;
          
          if (!profile.is_active) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ Account not active`);
            await supabase.auth.signOut();
            throw new Error('Account is niet actief');
          }
          
          console.log(`[Auth:${Date.now() - startTime}ms] → Storing session`);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.session));
          console.log(`[Auth:${Date.now() - startTime}ms] ✓ Session stored`);
          
          console.log(`[Auth:${Date.now() - startTime}ms] → Setting auth state`);
          setAuthState({
            user: data.user,
            profile: profileData,
            session: data.session,
            isLoading: false,
            isAuthenticated: true,
          });
          
          console.log(`[Auth:${Date.now() - startTime}ms] ✓✓✓ LOGIN COMPLETE (total: ${Date.now() - startTime}ms)`);
          return { success: true };
        } catch (error) {
          console.error(`[Auth:${Date.now() - startTime}ms] ✗✗✗ Login error:`, error instanceof Error ? error.message : String(error));
          throw error;
        }
      })();

      const result = await Promise.race([loginPromise, createTimeout()]);
      
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error(`[Auth:${Date.now() - startTime}ms] ✗✗✗ FINAL ERROR:`, error instanceof Error ? error.message : String(error));
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
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout | null = null;
    
    const createTimeout = () => {
      return new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Registratie duurde te lang (> 5s)'));
        }, 5000);
      });
    };

    try {
      console.log(`[Auth:${Date.now() - startTime}ms] START signup for ${email}`);
      
      const signupPromise = (async () => {
        try {
          const signUpStart = Date.now();
          console.log(`[Auth:${Date.now() - startTime}ms] → Calling signUp`);
          
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

          console.log(`[Auth:${Date.now() - startTime}ms] ✓ signUp resolved (${Date.now() - signUpStart}ms)`);

          if (authError || !authData.user || !authData.session) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ signUp error:`, authError?.message);
            throw authError || new Error('Registratie mislukt');
          }

          console.log(`[Auth:${Date.now() - startTime}ms] ✓ User created: ${authData.user.id}`);
          console.log(`[Auth:${Date.now() - startTime}ms] → Waiting for profile creation...`);
          
          let profile = null;
          let retryCount = 0;
          
          while (retryCount < 10 && !profile) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log(`[Auth:${Date.now() - startTime}ms] → Fetching profile (attempt ${retryCount + 1}/10)`);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();
            
            if (profileData && !profileError) {
              profile = profileData;
              console.log(`[Auth:${Date.now() - startTime}ms] ✓ Profile found`);
              break;
            }
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.error(`[Auth:${Date.now() - startTime}ms] ✗ Profile fetch error:`, profileError.message);
            }
            
            retryCount++;
          }
          
          if (!profile) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ Profile creation timeout after ${retryCount} attempts`);
            throw new Error('Profiel aanmaken time-out');
          }
          
          console.log(`[Auth:${Date.now() - startTime}ms] → Storing session`);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData.session));
          console.log(`[Auth:${Date.now() - startTime}ms] ✓ Session stored`);
          
          console.log(`[Auth:${Date.now() - startTime}ms] → Setting auth state`);
          setAuthState({
            user: authData.user,
            profile: profile as Profile,
            session: authData.session,
            isLoading: false,
            isAuthenticated: true,
          });

          console.log(`[Auth:${Date.now() - startTime}ms] ✓✓✓ SIGNUP COMPLETE (total: ${Date.now() - startTime}ms)`);
          return { success: true };
        } catch (error) {
          console.error(`[Auth:${Date.now() - startTime}ms] ✗✗✗ Signup error:`, error instanceof Error ? error.message : String(error));
          throw error;
        }
      })();

      const result = await Promise.race([signupPromise, createTimeout()]);
      
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error(`[Auth:${Date.now() - startTime}ms] ✗✗✗ FINAL ERROR:`, error instanceof Error ? error.message : String(error));
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
