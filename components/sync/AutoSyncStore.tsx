import React, { useEffect, useCallback, useRef } from "react";
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

  const syncMutation = trpc.instructor.syncSettings.useMutation();
  const fetchSettingsQuery = trpc.instructor.fetchSettings.useQuery(undefined, {
    enabled: false,
    retry: false,
  });

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);

  const syncToSupabase = useCallback(async () => {
    if (!isAuthenticated || !authProfile) {
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
      console.log("[AutoSync] Successfully synced to Supabase");
    } catch (error) {
      console.error("[AutoSync] Failed to sync:", error);
    }
  }, [
    isAuthenticated,
    authProfile,
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

    try {
      console.log("[AutoSync] Fetching settings from Supabase...");
      const result = await fetchSettingsQuery.refetch();
      
      if (result.data) {
        console.log("[AutoSync] Successfully fetched from Supabase");
      }
    } catch (error) {
      console.error("[AutoSync] Failed to fetch:", error);
    }
  }, [isAuthenticated, authProfile, fetchSettingsQuery]);

  const startSync = useCallback(() => {
    if (!isAuthenticated || !authProfile || intervalRef.current) {
      return;
    }
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastSyncRef.current >= SYNC_INTERVAL) {
        void syncToSupabase();
      }
    }, SYNC_INTERVAL);

    void syncToSupabase();
  }, [isAuthenticated, authProfile, syncToSupabase]);

  const stopSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !authProfile) {
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
  }, [isAuthenticated, authProfile, startSync, stopSync]);

  const manualSync = useCallback(async () => {
    await syncToSupabase();
  }, [syncToSupabase]);

  const manualFetch = useCallback(async () => {
    await fetchFromSupabase();
  }, [fetchFromSupabase]);

  return {
    isSyncing: syncMutation.isPending,
    isFetching: fetchSettingsQuery.isLoading,
    lastSyncTime: lastSyncRef.current,
    manualSync,
    manualFetch,
  };
});
