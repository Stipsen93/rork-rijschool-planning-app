import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { AppState, AppStateStatus } from "react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "../auth/AuthStore";
import { useProfile } from "../settings/ProfileStore";
import { useWorkingHours } from "../settings/WorkingHoursStore";
import { useSettings } from "../settings/SettingsStore";
import { useLessonCard } from "../settings/LessonCardStore";
import { useNotifications } from "../settings/NotificationsStore";
import { useStudentConfig } from "../settings/StudentConfigStore";

const SYNC_INTERVAL = 60000;

export const [AutoSyncProvider, useAutoSync] = createContextHook(() => {
  const { isAuthenticated, profile: authProfile } = useAuth();
  const { profile } = useProfile();
  const { workingHours, vacationPeriods } = useWorkingHours();
  const { lessonConfig, products, packages, hourlyRates } = useSettings();
  const { categories: lessonCardCategories, statusConfig } = useLessonCard();
  const { notificationSettings } = useNotifications();
  const { studentConfig } = useStudentConfig();
  const isInstructor = authProfile?.role === "instructor";

  const syncMutation = trpc.instructor.syncSettings.useMutation({
    onError: (error) => {
      if (error.message.includes('logged in')) {
        console.log('[AutoSync] Sync skipped - user not authenticated');
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
      console.log("[AutoSync] Syncing settings to Supabase...");

      await syncMutation.mutateAsync({
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber,
          birthDate: profile.birthDate,
          instructorNumber: profile.instructorNumber,
          certificationNumber: profile.certificationNumber,
          drivingSchoolName: profile.drivingSchoolName,
          drivingSchools: profile.drivingSchools,
          experienceYears: profile.experienceYears,
          taxId: profile.taxId,
          address: profile.address,
          iban: profile.iban,
          specializations: profile.specializations,
        },
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
      });

      lastSyncRef.current = Date.now();
      setLastSyncTime(lastSyncRef.current);
      console.log("[AutoSync] Successfully synced to Supabase");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      if (message.includes('logged in') || message.includes('UNAUTHORIZED')) {
        console.log('[AutoSync] Sync cancelled - authentication required');
        return;
      }
      
      console.error("[AutoSync] Failed to sync:", message);
      
      if (message.includes("Failed to fetch")) {
        console.error("[AutoSync] Network request failed while syncing settings");
      }
    }
  }, [
    isAuthenticated,
    authProfile,
    isInstructor,
    profile,
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
      console.log("[AutoSync] Fetching settings from Supabase...");
      const result = await fetchSettingsQuery.refetch();

      if (result.data) {
        console.log("[AutoSync] Successfully fetched from Supabase");
      }

      if (result.error) {
        console.error("[AutoSync] Fetch error payload:", result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[AutoSync] Failed to fetch:", message);
      console.error("[AutoSync] Fetch error details:", error);
      if (message.includes("Failed to fetch")) {
        console.error("[AutoSync] Network request failed while fetching settings");
      }
    }
  }, [isAuthenticated, authProfile, isInstructor, fetchSettingsQuery]);

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
