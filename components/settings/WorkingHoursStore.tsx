import React, { useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export type DayKey =
  | "Maandag"
  | "Dinsdag"
  | "Woensdag"
  | "Donderdag"
  | "Vrijdag"
  | "Zaterdag"
  | "Zondag";

export type TimeRange = { start: string; end: string };
export type DayConfig = {
  enabled: boolean;
  ranges: TimeRange[];
  pauses: TimeRange[];
};

export type WorkingHours = Record<DayKey, DayConfig>;

export type VacationPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  repeatAnnually: boolean;
};

const STORAGE_KEY = "instructor_working_hours" as const;

const defaultDay = (enabled: boolean): DayConfig => ({
  enabled,
  ranges: enabled ? [{ start: "09:00", end: "18:00" }] : [],
  pauses: [],
});

export const defaultWorkingHours: WorkingHours = {
  Maandag: defaultDay(true),
  Dinsdag: defaultDay(true),
  Woensdag: defaultDay(true),
  Donderdag: defaultDay(true),
  Vrijdag: defaultDay(true),
  Zaterdag: defaultDay(false),
  Zondag: defaultDay(false),
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

function migrateAny(input: unknown): WorkingHours | null {
  try {
    const parsed = input as Record<string, any>;
    if (!parsed) return null;

    const out: WorkingHours = { ...defaultWorkingHours } as WorkingHours;
    (Object.keys(defaultWorkingHours) as DayKey[]).forEach((k) => {
      const src = parsed[k] as any;
      if (!src || typeof src !== "object") return;

      // New schema already
      if (Array.isArray(src.ranges) && Array.isArray(src.pauses)) {
        out[k] = {
          enabled: Boolean(src.enabled),
          ranges: src.ranges.map((r: any) => ({ start: String(r.start ?? "09:00"), end: String(r.end ?? "17:00") })),
          pauses: src.pauses.map((r: any) => ({ start: String(r.start ?? "12:00"), end: String(r.end ?? "12:30") })),
        };
        return;
      }

      // Old schema -> migrate
      const startTime = typeof src.startTime === "string" ? src.startTime : defaultWorkingHours[k].ranges[0]?.start ?? "09:00";
      const endTime = typeof src.endTime === "string" ? src.endTime : defaultWorkingHours[k].ranges[0]?.end ?? "17:00";
      const autoLunchBreak = Boolean(src.autoLunchBreak);
      const breakStart = typeof src.breakStartTime === "string" ? src.breakStartTime : undefined;
      const breakEnd = typeof src.breakEndTime === "string" ? src.breakEndTime : undefined;

      const pauses: TimeRange[] = autoLunchBreak && breakStart && breakEnd ? [{ start: breakStart, end: breakEnd }] : [];

      out[k] = {
        enabled: Boolean(src.enabled),
        ranges: Boolean(src.enabled) ? [{ start: startTime, end: endTime }] : [],
        pauses,
      };
    });

    return out;
  } catch (e) {
    console.log("WorkingHoursStore: migrateAny error", e);
    return null;
  }
}

export const [WorkingHoursProvider, useWorkingHours] = createContextHook(() => {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      console.log("WorkingHoursStore: Loading working hours...");
      const v = await storageGetString(STORAGE_KEY);
      if (v) {
        try {
          const migrated = migrateAny(JSON.parse(v));
          if (migrated) {
            setWorkingHours(migrated);
            console.log("WorkingHoursStore: Loaded from storage (migrated)", migrated);
          }
        } catch (e) {
          console.log("WorkingHoursStore: Failed to parse working hours", e);
        }
      }

      const vacationsStr = await storageGetString("instructor_vacation_periods");
      if (vacationsStr) {
        try {
          const parsed = JSON.parse(vacationsStr) as VacationPeriod[];
          setVacationPeriods(Array.isArray(parsed) ? parsed : []);
          console.log("WorkingHoursStore: Loaded vacation periods", parsed);
        } catch (e) {
          console.log("WorkingHoursStore: Failed to parse vacation periods", e);
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

  const updateVacationPeriods = React.useCallback(async (periods: VacationPeriod[]) => {
    console.log("WorkingHoursStore: Updating vacation periods", periods);
    setVacationPeriods(periods);
    await storageSetString("instructor_vacation_periods", JSON.stringify(periods));
  }, []);

  const addVacationPeriod = React.useCallback(async (period: Omit<VacationPeriod, "id">) => {
    const newPeriod: VacationPeriod = { ...period, id: Date.now().toString() };
    const updated = [...vacationPeriods, newPeriod];
    await updateVacationPeriods(updated);
  }, [vacationPeriods, updateVacationPeriods]);

  const removeVacationPeriod = React.useCallback(async (id: string) => {
    const updated = vacationPeriods.filter((p) => p.id !== id);
    await updateVacationPeriods(updated);
  }, [vacationPeriods, updateVacationPeriods]);

  const enabledDays = useMemo(
    () => Object.entries(workingHours).filter(([, v]) => v.enabled) as [DayKey, DayConfig][],
    [workingHours]
  );

  const value = useMemo(
    () => ({
      workingHours,
      updateWorkingHours,
      vacationPeriods,
      updateVacationPeriods,
      addVacationPeriod,
      removeVacationPeriod,
      loading,
      enabledDays,
    }),
    [workingHours, updateWorkingHours, vacationPeriods, updateVacationPeriods, addVacationPeriod, removeVacationPeriod, loading, enabledDays]
  );

  return value;
});
