import { useEffect, useMemo, useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type StudentConfig = {
  maxPerWeek: number;
  maxPerDay: number;
  consecutive: number;
  advanceDays: number;
  allowWeekend: boolean;
  requireParentApproval: boolean;
  allowStudentCancellation: boolean;
  cancellationHours: number;
  penaltyLate: boolean;
  penaltyAmount: number;
  requirePaymentBefore: boolean;
  allowPaymentPlans: boolean;
  maxUnpaid: number;
  sendReminders: boolean;
  reminderHours: number;
  sendReports: boolean;
  allowDirectContact: boolean;
};

const STUDENT_CONFIG_KEY = "student_configuration" as const;

const defaultStudentConfig: StudentConfig = {
  maxPerWeek: 3,
  maxPerDay: 2,
  consecutive: 1,
  advanceDays: 7,
  allowWeekend: true,
  requireParentApproval: false,
  allowStudentCancellation: true,
  cancellationHours: 24,
  penaltyLate: false,
  penaltyAmount: 25,
  requirePaymentBefore: false,
  allowPaymentPlans: true,
  maxUnpaid: 2,
  sendReminders: true,
  reminderHours: 2,
  sendReports: true,
  allowDirectContact: true,
};

export const [StudentConfigProvider, useStudentConfig] = createContextHook(() => {
  const [studentConfig, setStudentConfig] = useState<StudentConfig>(defaultStudentConfig);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      console.log("[StudentConfigStore] Loading student configuration...");
      try {
        const stored = await AsyncStorage.getItem(STUDENT_CONFIG_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<StudentConfig>;
          const migrated: StudentConfig = {
            maxPerWeek: typeof parsed.maxPerWeek === "number" ? parsed.maxPerWeek : defaultStudentConfig.maxPerWeek,
            maxPerDay: typeof parsed.maxPerDay === "number" ? parsed.maxPerDay : defaultStudentConfig.maxPerDay,
            consecutive: typeof parsed.consecutive === "number" ? parsed.consecutive : defaultStudentConfig.consecutive,
            advanceDays: typeof parsed.advanceDays === "number" ? parsed.advanceDays : defaultStudentConfig.advanceDays,
            allowWeekend: typeof parsed.allowWeekend === "boolean" ? parsed.allowWeekend : defaultStudentConfig.allowWeekend,
            requireParentApproval: typeof parsed.requireParentApproval === "boolean" ? parsed.requireParentApproval : defaultStudentConfig.requireParentApproval,
            allowStudentCancellation: typeof parsed.allowStudentCancellation === "boolean" ? parsed.allowStudentCancellation : defaultStudentConfig.allowStudentCancellation,
            cancellationHours: typeof parsed.cancellationHours === "number" ? parsed.cancellationHours : defaultStudentConfig.cancellationHours,
            penaltyLate: typeof parsed.penaltyLate === "boolean" ? parsed.penaltyLate : defaultStudentConfig.penaltyLate,
            penaltyAmount: typeof parsed.penaltyAmount === "number" ? parsed.penaltyAmount : defaultStudentConfig.penaltyAmount,
            requirePaymentBefore: typeof parsed.requirePaymentBefore === "boolean" ? parsed.requirePaymentBefore : defaultStudentConfig.requirePaymentBefore,
            allowPaymentPlans: typeof parsed.allowPaymentPlans === "boolean" ? parsed.allowPaymentPlans : defaultStudentConfig.allowPaymentPlans,
            maxUnpaid: typeof parsed.maxUnpaid === "number" ? parsed.maxUnpaid : defaultStudentConfig.maxUnpaid,
            sendReminders: typeof parsed.sendReminders === "boolean" ? parsed.sendReminders : defaultStudentConfig.sendReminders,
            reminderHours: typeof parsed.reminderHours === "number" ? parsed.reminderHours : defaultStudentConfig.reminderHours,
            sendReports: typeof parsed.sendReports === "boolean" ? parsed.sendReports : defaultStudentConfig.sendReports,
            allowDirectContact: typeof parsed.allowDirectContact === "boolean" ? parsed.allowDirectContact : defaultStudentConfig.allowDirectContact,
          };
          setStudentConfig(migrated);
          console.log("[StudentConfigStore] Loaded student configuration", migrated);
        }
      } catch (e) {
        console.error("[StudentConfigStore] Failed to load student configuration", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateStudentConfig = useCallback(async (config: StudentConfig) => {
    console.log("[StudentConfigStore] Updating student configuration", config);
    setStudentConfig(config);
    await AsyncStorage.setItem(STUDENT_CONFIG_KEY, JSON.stringify(config));
  }, []);

  const value = useMemo(
    () => ({
      studentConfig,
      loading,
      updateStudentConfig,
    }),
    [studentConfig, loading, updateStudentConfig]
  );

  return value;
});
