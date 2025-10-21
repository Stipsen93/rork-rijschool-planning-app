import React, { useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

export type DayKey =
  | "Maandag"
  | "Dinsdag"
  | "Woensdag"
  | "Donderdag"
  | "Vrijdag"
  | "Zaterdag"
  | "Zondag";

export type DayConfig = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakDuration: number;
  autoLunchBreak: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
};

export type WorkingHours = Record<DayKey, DayConfig>;

const STORAGE_KEY = "instructor_working_hours" as const;

export const defaultWorkingHours: WorkingHours = {
  Maandag: { enabled: true, startTime: "09:00", endTime: "17:00", breakDuration: 30, autoLunchBreak: true },
  Dinsdag: { enabled: true, startTime: "09:00", endTime: "17:00", breakDuration: 30, autoLunchBreak: true },
  Woensdag: { enabled: true, startTime: "09:00", endTime: "17:00", breakDuration: 30, autoLunchBreak: true },
  Donderdag: { enabled: true, startTime: "09:00", endTime: "17:00", breakDuration: 30, autoLunchBreak: true },
  Vrijdag: { enabled: true, startTime: "09:00", endTime: "17:00", breakDuration: 30, autoLunchBreak: true },
  Zaterdag: { enabled: false, startTime: "10:00", endTime: "16:00", breakDuration: 30, autoLunchBreak: false },
  Zondag: { enabled: false, startTime: "10:00", endTime: "16:00", breakDuration: 30, autoLunchBreak: false },
};

async function storageGetString(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return window.localStorage.getItem(key);
    }
    const path = `${FileSystem.documentDirectory ?? ""}${key}.json`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(path);
  } catch (e) {
    console.log("storageGetString error", e);
    return null;
  }
}

async function storageSetString(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.setItem(key, value);
      return;
    }
    const path = `${FileSystem.documentDirectory ?? ""}${key}.json`;
    await FileSystem.writeAsStringAsync(path, value);
  } catch (e) {
    console.log("storageSetString error", e);
  }
}

export const [WorkingHoursProvider, useWorkingHours] = createContextHook(() => {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      console.log("WorkingHoursStore: Loading working hours...");
      const v = await storageGetString(STORAGE_KEY);
      if (v) {
        try {
          const parsed = JSON.parse(v) as Record<string, unknown>;
          const casted = Object.keys(defaultWorkingHours).reduce((acc, key) => {
            const k = key as DayKey;
            const src = (parsed as Record<string, unknown>)[k] as Partial<DayConfig> | undefined;
            acc[k] = {
              ...defaultWorkingHours[k],
              ...(src ?? {}),
            } as DayConfig;
            return acc;
          }, {} as WorkingHours);
          setWorkingHours(casted);
          console.log("WorkingHoursStore: Loaded from storage", casted);
        } catch (e) {
          console.log("WorkingHoursStore: Failed to parse working hours", e);
        }
      }
      setLoading(false);
    })();
  }, []);

  const updateWorkingHours = React.useCallback(async (hours: WorkingHours) => {
    console.log("WorkingHoursStore: Updating working hours", hours);
    setWorkingHours(hours);
    await storageSetString(STORAGE_KEY, JSON.stringify(hours));
  }, []);

  const enabledDays = useMemo(
    () => Object.entries(workingHours).filter(([, v]) => v.enabled) as [DayKey, DayConfig][],
    [workingHours]
  );

  const value = useMemo(
    () => ({
      workingHours,
      updateWorkingHours,
      loading,
      enabledDays,
    }),
    [workingHours, updateWorkingHours, loading, enabledDays]
  );

  return value;
});
