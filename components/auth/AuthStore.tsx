import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
const HYDRATION_GUARD_TIMEOUT = 4500;

interface ResolveProfileOptions {
  attempts?: number;
  delay?: number;
}

interface SessionUpdateOptions {
  profile?: Profile | null;
  retryOptions?: ResolveProfileOptions;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const isMountedRef = useRef(true);

  const applyUnauthenticatedState = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setAuthState({
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, [setAuthState]);

  const persistSession = useCallback(async (session: Session | null) => {
    try {
      if (!session) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('[Auth] Persist session error:', error instanceof Error ? error.message : String(error));
    }
  }, []);

  const resolveProfile = useCallback(
    async (userId: string, options?: ResolveProfileOptions): Promise<{ profile: Profile | null; error?: string }> => {
      const totalAttempts = options?.attempts ?? 5;
      const attemptDelay = options?.delay ?? 1000;

      for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
        console.log(`[Auth] Fetching profile attempt ${attempt + 1}/${totalAttempts} for ${userId}`);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return { profile: data as Profile };
        }

        if (error && error.code !== 'PGRST116') {
          console.error('[Auth] Profile fetch error:', error.message);
          return { profile: null, error: error.message || 'Profiel ophalen mislukt' };
        }

        if (error?.code === 'PGRST116' && attempt === totalAttempts - 1) {
          return { profile: null, error: 'Profiel niet gevonden' };
        }

        if (attempt < totalAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, attemptDelay));
        }
      }

      return { profile: null, error: 'Profiel niet gevonden' };
    },
    [],
  );

  const handleSessionUpdate = useCallback(
    async (session: Session, options?: SessionUpdateOptions): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log('[Auth] Session update received for:', session.user.id);
        let profileRecord: Profile | null = options?.profile ?? null;

        if (!profileRecord) {
          const profileResult = await resolveProfile(session.user.id, options?.retryOptions);

          if (profileResult.error || !profileResult.profile) {
            console.error('[Auth] Profile resolution failed:', profileResult.error);
            await persistSession(null);
            applyUnauthenticatedState();
            return { success: false, error: profileResult.error ?? 'Profiel niet gevonden' };
          }

          profileRecord = profileResult.profile;
        }

        if (profileRecord.is_active === false) {
          console.error('[Auth] Account inactive during session update');

          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('[Auth] signOut error during inactive handling:', signOutError instanceof Error ? signOutError.message : String(signOutError));
          }

          await persistSession(null);
          applyUnauthenticatedState();
          return { success: false, error: 'Account is niet actief' };
        }

        await persistSession(session);

        if (!isMountedRef.current) {
          return { success: true };
        }

        setAuthState({
          user: session.user,
          profile: profileRecord,
          session,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true };
      } catch (error) {
        console.error('[Auth] handleSessionUpdate error:', error instanceof Error ? error.message : String(error));
        await persistSession(null);
        applyUnauthenticatedState();
        return { success: false, error: 'Sessieverwerking mislukt' };
      }
    },
    [resolveProfile, persistSession, applyUnauthenticatedState],
  );

  const handleSessionEnd = useCallback(async () => {
    try {
      console.log('[Auth] Session end handling');
      await persistSession(null);
    } catch (error) {
      console.error('[Auth] Session end persist error:', error instanceof Error ? error.message : String(error));
    } finally {
      applyUnauthenticatedState();
    }
  }, [persistSession, applyUnauthenticatedState]);

  const initializeAuth = useCallback(async () => {
    console.log('[Auth] Initialization started');
    let completed = false;

    const guardTimeout = setTimeout(() => {
      if (!completed && isMountedRef.current) {
        console.warn('[Auth] Initialization guard triggered, enforcing unauthenticated state');
        applyUnauthenticatedState();
      }
    }, HYDRATION_GUARD_TIMEOUT);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] getSession error:', error.message);
      }

      if (data?.session) {
        const updateResult = await handleSessionUpdate(data.session, {
          retryOptions: { attempts: 5, delay: 700 },
        });

        if (!updateResult.success) {
          console.error('[Auth] Initial session update failed:', updateResult.error);
        }

        return;
      }

      const storedSession = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

      if (storedSession) {
        console.log('[Auth] Restoring session from storage');

        try {
          const parsedSession: Session = JSON.parse(storedSession);
          const { data: setData, error: setError } = await supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token,
          });

          if (setError || !setData.session) {
            console.error('[Auth] setSession error:', setError ? setError.message : 'No session returned');
            await handleSessionEnd();
            return;
          }

          const updateResult = await handleSessionUpdate(setData.session, {
            retryOptions: { attempts: 5, delay: 700 },
          });

          if (!updateResult.success) {
            console.error('[Auth] Restored session update failed:', updateResult.error);
          }

          return;
        } catch (parseError) {
          console.error('[Auth] Stored session parse error:', parseError instanceof Error ? parseError.message : String(parseError));
          await handleSessionEnd();
          return;
        }
      }

      applyUnauthenticatedState();
    } catch (error) {
      console.error('[Auth] initializeAuth error:', error instanceof Error ? error.message : String(error));
      await handleSessionEnd();
    } finally {
      completed = true;
      clearTimeout(guardTimeout);
    }
  }, [handleSessionUpdate, handleSessionEnd, applyUnauthenticatedState]);

  useEffect(() => {
    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State changed:', event);

      if (session) {
        await handleSessionUpdate(session);
      } else {
        await handleSessionEnd();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [initializeAuth, handleSessionUpdate, handleSessionEnd]);

  const login = useCallback(
    async (email: string, password: string) => {
      const startTime = Date.now();

      try {
        console.log(`[Auth:${Date.now() - startTime}ms] START login for ${email}`);
        console.log(`[Auth:${Date.now() - startTime}ms] → Calling signInWithPassword`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log(`[Auth:${Date.now() - startTime}ms] ✓ signInWithPassword resolved`);

        if (error) {
          console.error(`[Auth:${Date.now() - startTime}ms] ✗ signInWithPassword error:`, error.message);
          return { success: false, error: error.message };
        }

        if (!data.session || !data.user) {
          console.error(`[Auth:${Date.now() - startTime}ms] ✗ No session returned`);
          return { success: false, error: 'Geen sessie ontvangen' };
        }

        const profileResult = await resolveProfile(data.user.id);

        if (profileResult.error || !profileResult.profile) {
          console.error(`[Auth:${Date.now() - startTime}ms] ✗ Profile error:`, profileResult.error);

          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('[Auth] signOut error after profile failure:', signOutError instanceof Error ? signOutError.message : String(signOutError));
          }

          await handleSessionEnd();
          return { success: false, error: profileResult.error ?? 'Profiel niet gevonden' };
        }

        const sessionResult = await handleSessionUpdate(data.session, {
          profile: profileResult.profile,
          retryOptions: { attempts: 1, delay: 0 },
        });

        if (!sessionResult.success) {
          console.error(`[Auth:${Date.now() - startTime}ms] ✗ Session application failed:`, sessionResult.error);
          return { success: false, error: sessionResult.error ?? 'Sessieverwerking mislukt' };
        }

        console.log(`[Auth:${Date.now() - startTime}ms] ✓✓✓ LOGIN COMPLETE (total: ${Date.now() - startTime}ms)`);
        return { success: true };
      } catch (error) {
        console.error(`[Auth:${Date.now() - startTime}ms] ✗✗✗ FINAL ERROR:`, error instanceof Error ? error.message : String(error));
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Inloggen mislukt',
        };
      }
    },
    [resolveProfile, handleSessionUpdate, handleSessionEnd],
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      role: 'instructor' | 'student',
      phone?: string,
    ) => {
      const startTime = Date.now();
      let timeoutId: NodeJS.Timeout | null = null;

      const createTimeout = () =>
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Registratie duurde te lang (> 5s)'));
          }, 5000);
        });

      const clearPendingTimeout = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      try {
        console.log(`[Auth:${Date.now() - startTime}ms] START signup for ${email}`);

        const signupPromise = (async () => {
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
              },
            },
          });
          console.log(`[Auth:${Date.now() - startTime}ms] ✓ signUp resolved`);

          if (authError || !authData.user || !authData.session) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ signUp error:`, authError?.message ?? 'Geen gebruiker of sessie');
            throw authError ?? new Error('Registratie mislukt');
          }

          const profileResult = await resolveProfile(authData.user.id, {
            attempts: 10,
            delay: 500,
          });

          if (profileResult.error || !profileResult.profile) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ Profile creation error:`, profileResult.error);
            throw new Error(profileResult.error ?? 'Profiel niet gevonden');
          }

          const sessionResult = await handleSessionUpdate(authData.session, {
            profile: profileResult.profile,
            retryOptions: { attempts: 1, delay: 0 },
          });

          if (!sessionResult.success) {
            console.error(`[Auth:${Date.now() - startTime}ms] ✗ Session application after signup failed:`, sessionResult.error);
            throw new Error(sessionResult.error ?? 'Sessieverwerking mislukt');
          }

          console.log(`[Auth:${Date.now() - startTime}ms] ✓✓✓ SIGNUP COMPLETE (total: ${Date.now() - startTime}ms)`);
          return { success: true };
        })();

        const result = await Promise.race([signupPromise, createTimeout()]);
        clearPendingTimeout();
        return result;
      } catch (error) {
        clearPendingTimeout();
        console.error(`[Auth:${Date.now() - startTime}ms] ✗✗✗ FINAL ERROR:`, error instanceof Error ? error.message : String(error));
        await handleSessionEnd();
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registratie mislukt',
        };
      }
    },
    [resolveProfile, handleSessionUpdate, handleSessionEnd],
  );

  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logging out...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      await handleSessionEnd();
      return { success: true };
    } catch (error) {
      console.error('[Auth] Logout error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }, [handleSessionEnd]);

  const userId = authState.user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      return;
    }

    const { profile, error } = await resolveProfile(userId, { attempts: 3, delay: 500 });

    if (error) {
      console.error('[Auth] Refresh profile error:', error);
      return;
    }

    if (profile && isMountedRef.current) {
      setAuthState((prev) => ({
        ...prev,
        profile,
      }));
    }
  }, [userId, resolveProfile]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useMemo(
    () => ({
      ...authState,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [authState, login, signup, logout, refreshProfile],
  );
});
