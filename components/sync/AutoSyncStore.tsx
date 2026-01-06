import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { AppState, AppStateStatus, Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "../auth/AuthStore";
import { useWorkingHours } from "../settings/WorkingHoursStore";
import { useSettings } from "../settings/SettingsStore";
import { useLessonCard } from "../settings/LessonCardStore";
import { useNotifications } from "../settings/NotificationsStore";
import { useStudentConfig } from "../settings/StudentConfigStore";

const SYNC_INTERVAL = 60000;

export const [AutoSyncProvider, useAutoSync] = createContextHook(() => {
  const { isAuthenticated, profile: authProfile } = useAuth();
  const { workingHours, vacationPeriods } = useWorkingHours();
  const { lessonConfig, products, packages, hourlyRates } = useSettings();
  const { categories: lessonCardCategories, statusConfig } = useLessonCard();
  const { notificationSettings } = useNotifications();
  const { studentConfig } = useStudentConfig();
  const isInstructor = authProfile?.role === "instructor";

  const syncMutation = trpc.instructor.syncSettings.useMutation({
    onError: (error) => {
      const msg = error.message;
      if (msg.includes('logged in') || msg.includes('Failed to fetch')) {
        console.log('[AutoSync] Sync skipped - backend not reachable');
      }
    },
  });
  const fetchSettingsQuery = trpc.instructor.fetchSettings.useQuery(undefined, {
    enabled: false,
    retry: false,
  });

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncRef = useRef<number>(0);
  const skippedRoleLogRef = useRef<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  const runWithRetry = useCallback(
    async <T,>(
      label: string,
      fn: () => Promise<T>,
      options?: { retries?: number; baseDelayMs?: number },
    ): Promise<T> => {
      const retries = options?.retries ?? 2;
      const baseDelayMs = options?.baseDelayMs ?? 900;

      let attempt = 0;
      let lastError: unknown = null;

      while (attempt <= retries) {
        try {
          if (attempt > 0) {
            console.log(
              `[AutoSync] Retry ${attempt}/${retries} for ${label} (platform=${Platform.OS})`,
            );
          }
          return await fn();
        } catch (e) {
          lastError = e;
          const msg = e instanceof Error ? e.message : String(e);
          const isNetwork =
            msg.includes("Failed to fetch") ||
            msg.includes("Network request failed") ||
            msg.includes("ECONN") ||
            msg.includes("ETIMEDOUT");

          if (!isNetwork || attempt >= retries) {
            throw e;
          }

          const delayMs = Math.round(baseDelayMs * Math.pow(2, attempt));
          await new Promise((r) => setTimeout(r, delayMs));
          attempt += 1;
        }
      }

      throw (lastError instanceof Error ? lastError : new Error("Sync failed"));
    },
    [],
  );

  const syncToSupabase = useCallback(async () => {
    if (!isAuthenticated || !authProfile) {
      return;
    }

    if (!isInstructor) {
      if (!skippedRoleLogRef.current) {
        console.log(
          `[AutoSync] Skipping sync because current role is ${authProfile.role ?? "unknown"}`,
        );
        skippedRoleLogRef.current = true;
      }
      return;
    }

    skippedRoleLogRef.current = false;

    if (syncMutation.isPending) {
      console.log('[AutoSync] Sync already in progress, skipping...');
      return;
    }

    try {
      console.log(
        `[AutoSync] Syncing settings... (platform=${Platform.OS})`,
      );

      await runWithRetry(
        "syncSettings",
        () =>
          syncMutation.mutateAsync({
            workingHours,
            vacationPeriods,
            lessonConfig,
            products,
            packages,
            hourlyRates,
            studentConfig: {
              maxPerWeek: studentConfig.maxPerWeek,
              maxPerDay: studentConfig.maxPerDay,
              consecutive: studentConfig.consecutive,
              advanceDays: studentConfig.advanceDays,
              allowWeekend: studentConfig.allowWeekend,
              requireParentApproval: studentConfig.requireParentApproval,
              allowStudentCancellation: studentConfig.allowStudentCancellation,
              cancellationHours: studentConfig.cancellationHours,
              penaltyLate: studentConfig.penaltyLate,
              penaltyAmount: studentConfig.penaltyAmount,
              requirePaymentBefore: studentConfig.requirePaymentBefore,
              allowPaymentPlans: studentConfig.allowPaymentPlans,
              maxUnpaid: studentConfig.maxUnpaid,
              sendReminders: studentConfig.sendReminders,
              reminderHours: studentConfig.reminderHours,
              sendReports: studentConfig.sendReports,
              allowDirectContact: studentConfig.allowDirectContact,
            },
            lessonCard: {
              categories: lessonCardCategories,
              statusConfig,
            },
            notifications: notificationSettings,
          }),
        { retries: 2, baseDelayMs: 900 },
      );

      lastSyncRef.current = Date.now();
      setLastSyncTime(lastSyncRef.current);
      console.log("[AutoSync] Successfully synced to backend");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("logged in") || message.includes("UNAUTHORIZED")) {
        console.log("[AutoSync] Sync cancelled - authentication required");
        return;
      }

      if (message.includes("Failed to fetch") || message.includes("Network request failed")) {
        console.log("[AutoSync] Backend not reachable, data saved locally");
      } else {
        console.log(`[AutoSync] Sync failed:`, message);
      }
    }
  }, [
    isAuthenticated,
    authProfile,
    isInstructor,
    workingHours,
    vacationPeriods,
    lessonConfig,
    products,
    packages,
    hourlyRates,
    lessonCardCategories,
    statusConfig,
    notificationSettings,
    studentConfig,
    syncMutation,
    runWithRetry,
  ]);

  const fetchFromSupabase = useCallback(async () => {
    if (!isAuthenticated || !authProfile) {
      return;
    }

    if (!isInstructor) {
      if (!skippedRoleLogRef.current) {
        console.log(
          `[AutoSync] Skipping fetch because current role is ${authProfile.role ?? "unknown"}`,
        );
        skippedRoleLogRef.current = true;
      }
      return;
    }

    skippedRoleLogRef.current = false;

    try {
      console.log(
        `[AutoSync] Fetching settings from backend... (platform=${Platform.OS})`,
      );
      const result = await runWithRetry(
        "fetchSettings",
        () => fetchSettingsQuery.refetch(),
        { retries: 2, baseDelayMs: 800 },
      );

      if (result.data) {
        console.log("[AutoSync] Successfully fetched from backend");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Failed to fetch") || message.includes("Network request failed")) {
        console.log("[AutoSync] Backend not reachable for fetch");
      } else {
        console.log(`[AutoSync] Fetch failed:`, message);
      }
    }
  }, [isAuthenticated, authProfile, isInstructor, fetchSettingsQuery, runWithRetry]);

  const startSync = useCallback(() => {
    if (!isAuthenticated || !authProfile || !isInstructor || intervalRef.current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastSyncRef.current >= SYNC_INTERVAL) {
        void syncToSupabase();
      }
    }, SYNC_INTERVAL);

    void syncToSupabase();
  }, [isAuthenticated, authProfile, isInstructor, syncToSupabase]);

  const stopSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !authProfile || !isInstructor) {
      stopSync();
      return;
    }

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        startSync();
      } else if (nextAppState.match(/inactive|background/)) {
        stopSync();
      }
      appState.current = nextAppState;
    });

    startSync();

    return () => {
      stopSync();
      subscription.remove();
    };
  }, [isAuthenticated, authProfile, isInstructor, startSync, stopSync]);

  const manualSync = useCallback(async () => {
    await syncToSupabase();
  }, [syncToSupabase]);

  const manualFetch = useCallback(async () => {
    await fetchFromSupabase();
  }, [fetchFromSupabase]);

  const value = useMemo(
    () => ({
      isSyncing: syncMutation.isPending,
      isFetching: fetchSettingsQuery.isLoading,
      lastSyncTime,
      manualSync,
      manualFetch,
    }),
    [
      syncMutation.isPending,
      fetchSettingsQuery.isLoading,
      manualSync,
      manualFetch,
      lastSyncTime,
    ],
  );

  return value;
});
