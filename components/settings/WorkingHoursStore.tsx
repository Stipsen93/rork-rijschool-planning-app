import React, { useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { trpc, trpcClient } from "@/lib/trpc";
import { useAuth } from "../auth/AuthStore";

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
const VACATION_STORAGE_KEY = "instructor_vacation_periods" as const;

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

function normalizeVacationPeriods(input: unknown): VacationPeriod[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        return null;
      }

      const source = raw as Partial<VacationPeriod> & Record<string, any>;
      const startDate =
        typeof source.startDate === "string"
          ? source.startDate
          : typeof source.start_date === "string"
            ? source.start_date
            : null;
      const endDate =
        typeof source.endDate === "string"
          ? source.endDate
          : typeof source.end_date === "string"
            ? source.end_date
            : null;

      if (!startDate || !endDate) {
        return null;
      }

      const id = typeof source.id === "string" ? source.id : `${Date.now()}-${index}`;

      return {
        id,
        startDate,
        endDate,
        repeatAnnually: Boolean(source.repeatAnnually ?? source.repeat_annually ?? false),
      } satisfies VacationPeriod;
    })
    .filter((item): item is VacationPeriod => Boolean(item));
}

export const [WorkingHoursProvider, useWorkingHours] = createContextHook(() => {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { isAuthenticated, user, profile } = useAuth();
  const activeUserId = user?.id ?? null;
  const isInstructor = profile?.role === "instructor";

  const syncSettingsMutation = trpc.instructor.syncSettings.useMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      setWorkingHours(defaultWorkingHours);
      setVacationPeriods([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !activeUserId) {
      return;
    }

    let cancelled = false;

    const loadFromLocal = async () => {
      const [hoursStr, vacationsStr] = await Promise.all([
        storageGetString(STORAGE_KEY),
        storageGetString(VACATION_STORAGE_KEY),
      ]);

      if (cancelled) {
        return;
      }

      if (hoursStr) {
        try {
          const migrated = migrateAny(JSON.parse(hoursStr));
          setWorkingHours(migrated ?? defaultWorkingHours);
        } catch (error) {
          console.log("WorkingHoursStore: Failed to parse stored working hours", error);
          setWorkingHours(defaultWorkingHours);
        }
      } else {
        setWorkingHours(defaultWorkingHours);
      }

      if (vacationsStr) {
        try {
          const parsed = JSON.parse(vacationsStr);
          setVacationPeriods(normalizeVacationPeriods(parsed));
        } catch (error) {
          console.log("WorkingHoursStore: Failed to parse stored vacation periods", error);
          setVacationPeriods([]);
        }
      } else {
        setVacationPeriods([]);
      }
    };

    const applyRemoteData = async (data: Awaited<ReturnType<typeof trpcClient.instructor.fetchSettings.query>>) => {
      const remoteHours = migrateAny(data?.workingHours) ?? defaultWorkingHours;
      const remoteVacations = normalizeVacationPeriods(data?.vacationPeriods ?? []);

      if (!cancelled) {
        setWorkingHours(remoteHours);
        setVacationPeriods(remoteVacations);
      }

      await storageSetString(STORAGE_KEY, JSON.stringify(remoteHours));
      await storageSetString(VACATION_STORAGE_KEY, JSON.stringify(remoteVacations));
    };

    const loadRemote = async () => {
      try {
        const data = await trpcClient.instructor.fetchSettings.query();
        await applyRemoteData(data);
      } catch (error) {
        console.log("WorkingHoursStore: Failed to load remote settings", error);
        await loadFromLocal();
      }
    };

    const run = async () => {
      setLoading(true);
      try {
        if (isInstructor) {
          await loadRemote();
        } else {
          await loadFromLocal();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeUserId, isInstructor]);

  const syncRemote = React.useCallback(
    async (payload: { workingHours?: WorkingHours; vacationPeriods?: VacationPeriod[] }) => {
      if (!isAuthenticated || !isInstructor) {
        return;
      }

      try {
        await syncSettingsMutation.mutateAsync(payload);
      } catch (error) {
        console.log("WorkingHoursStore: Supabase sync failed", error);
        throw (error instanceof Error ? error : new Error("Synchronisatie mislukt"));
      }
    },
    [isAuthenticated, isInstructor, syncSettingsMutation]
  );

  const updateWorkingHours = React.useCallback(
    async (hours: WorkingHours) => {
      console.log("WorkingHoursStore: Updating working hours", hours);
      setWorkingHours(hours);
      await storageSetString(STORAGE_KEY, JSON.stringify(hours));
      await syncRemote({ workingHours: hours, vacationPeriods });
    },
    [vacationPeriods, syncRemote]
  );

  const updateVacationPeriods = React.useCallback(
    async (periods: VacationPeriod[]) => {
      console.log("WorkingHoursStore: Updating vacation periods", periods);
      setVacationPeriods(periods);
      await storageSetString(VACATION_STORAGE_KEY, JSON.stringify(periods));
      await syncRemote({ vacationPeriods: periods, workingHours });
    },
    [workingHours, syncRemote]
  );

  const addVacationPeriod = React.useCallback(
    async (period: Omit<VacationPeriod, "id">) => {
      const newPeriod: VacationPeriod = { ...period, id: Date.now().toString() };
      const updated = [...vacationPeriods, newPeriod];
      await updateVacationPeriods(updated);
    },
    [vacationPeriods, updateVacationPeriods]
  );

  const updateVacationPeriod = React.useCallback(
    async (id: string, period: Omit<VacationPeriod, "id">) => {
      const updated = vacationPeriods.map((p) => (p.id === id ? { ...period, id } : p));
      await updateVacationPeriods(updated);
    },
    [vacationPeriods, updateVacationPeriods]
  );

  const removeVacationPeriod = React.useCallback(
    async (id: string) => {
      const updated = vacationPeriods.filter((p) => p.id !== id);
      await updateVacationPeriods(updated);
    },
    [vacationPeriods, updateVacationPeriods]
  );

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
      updateVacationPeriod,
      removeVacationPeriod,
      loading,
      enabledDays,
    }),
    [
      workingHours,
      updateWorkingHours,
      vacationPeriods,
      updateVacationPeriods,
      addVacationPeriod,
      updateVacationPeriod,
      removeVacationPeriod,
      loading,
      enabledDays,
    ]
  );

  return value;
});
