import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../auth/AuthStore";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Gepland",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
  no_show: "No-show",
};

export type AgendaLesson = {
  id: string;
  studentName?: string;
  studentId?: string;
  lessonType?: string;
  startTime: string;
  endTime: string;
  date: Date;
  status?: string;
  location?: string;
  notes?: string;
  recurringId?: string;
};

function keyFor(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  const hh = Number.isFinite(h) ? h : 0;
  const mm = Number.isFinite(m) ? m : 0;
  return hh * 60 + mm;
}

function byStartTimeAsc(a: AgendaLesson, b: AgendaLesson): number {
  return toMinutes(a.startTime) - toMinutes(b.startTime);
}

function seedLessons(): Record<string, AgendaLesson[]> {
  return {};
}

function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toHHMM(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function mapSupabaseLesson(row: any): AgendaLesson | null {
  try {
    if (!row || !row.start_time || !row.id) {
      return null;
    }

    const start = new Date(row.start_time);
    if (Number.isNaN(start.getTime())) {
      return null;
    }

    const end = row.end_time ? new Date(row.end_time) : new Date(start);
    const studentFirst = row.student?.first_name ?? "";
    const studentLast = row.student?.last_name ?? "";
    const studentName = `${studentFirst} ${studentLast}`.trim() || row.title || undefined;
    const normalizedStatus = typeof row.status === "string" ? STATUS_LABELS[row.status] ?? row.status : undefined;

    return {
      id: row.id,
      studentName,
      studentId: row.student_id ?? undefined,
      lessonType: row.lesson_type ?? undefined,
      startTime: toHHMM(start),
      endTime: toHHMM(end),
      date: toDateOnly(start),
      status: normalizedStatus,
      location: row.location ?? undefined,
      notes: row.notes ?? undefined,
      recurringId: row.recurring_id ?? undefined,
    };
  } catch (error) {
    console.error("AgendaStore: Failed to map Supabase lesson", error);
    return null;
  }
}

export const [AgendaProvider, useAgenda] = createContextHook(() => {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id ?? null;
  const [lessonsByDate, setLessonsByDate] = useState<Record<string, AgendaLesson[]>>(() => seedLessons());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadLessons = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setLessonsByDate({});
      return;
    }

    console.log("[AgendaStore] Loading lessons from Supabase");
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          *,
          student:student_profiles(
            first_name,
            last_name
          )
        `)
        .eq("instructor_id", userId)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("[AgendaStore] Failed to load lessons", error.message);
        setIsLoading(false);
        return;
      }

      const next: Record<string, AgendaLesson[]> = {};
      (data || []).forEach((row: any) => {
        const mapped = mapSupabaseLesson(row);
        if (!mapped) {
          return;
        }
        const key = keyFor(mapped.date);
        next[key] = [...(next[key] ?? []), mapped].sort(byStartTimeAsc);
      });
      setLessonsByDate(next);
      console.log("[AgendaStore] Loaded", Object.keys(next).length, "days with lessons");
    } catch (error) {
      console.error("[AgendaStore] Error loading lessons", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const getLessonsForDate = useCallback((date: Date): AgendaLesson[] => {
    const key = keyFor(date);
    return (lessonsByDate[key] ?? []).slice().sort(byStartTimeAsc);
  }, [lessonsByDate]);

  const addLesson = useCallback((lesson: Omit<AgendaLesson, "id"> & { id?: string }, skipDuplicateCheck?: boolean) => {
    setLessonsByDate((prev) => {
      const id = lesson.id && `${lesson.id}`.length > 0 ? `${lesson.id}` : uid();
      const key = keyFor(lesson.date);
      const existing = prev[key] ?? [];

      // Try to update by id if present
      const byIdIndex = existing.findIndex((l) => l.id === id);
      if (byIdIndex >= 0) {
        const updated = existing.slice();
        updated[byIdIndex] = { ...existing[byIdIndex], ...lesson, id };
        const sorted = updated.slice().sort(byStartTimeAsc);
        const next = { ...prev, [key]: sorted };
        console.log("AgendaStore: addLesson (updated existing by id)", { key, id });
        return next;
      }

      // Prevent duplicates on same day with same time/student/type
      if (!skipDuplicateCheck) {
        const hasDuplicate = existing.some((l) =>
          l.startTime === lesson.startTime &&
          l.endTime === lesson.endTime &&
          (l.studentName ?? "") === (lesson.studentName ?? "") &&
          (l.lessonType ?? "") === (lesson.lessonType ?? "")
        );
        if (hasDuplicate) {
          console.log("AgendaStore: addLesson skipped duplicate", { key, id });
          return prev;
        }
      }

      const nextArr = [...existing, { ...lesson, id }].sort(byStartTimeAsc);
      const next = { ...prev, [key]: nextArr };
      console.log("AgendaStore: addLesson", { key, count: nextArr.length, id });
      return next;
    });
  }, []);

  const removeLessonById = useCallback((id: string) => {
    setLessonsByDate((prev) => {
      const next: Record<string, AgendaLesson[]> = {};
      let removed = false;
      Object.entries(prev).forEach(([k, arr]) => {
        const filtered = arr.filter((l) => l.id !== id);
        if (filtered.length !== arr.length) removed = true;
        if (filtered.length > 0) next[k] = filtered;
      });
      console.log("AgendaStore: removeLessonById", { id, removed });
      return next;
    });
  }, []);

  const removeLessonsByRecurringId = useCallback((recurringId: string, fromDate?: Date) => {
    setLessonsByDate((prev) => {
      const next: Record<string, AgendaLesson[]> = {};
      let removed = 0;
      Object.entries(prev).forEach(([k, arr]) => {
        const filtered = arr.filter((l) => {
          if (l.recurringId !== recurringId) return true;
          if (fromDate && l.date < fromDate) return true;
          removed++;
          return false;
        });
        if (filtered.length > 0) next[k] = filtered;
      });
      console.log("AgendaStore: removeLessonsByRecurringId", { recurringId, fromDate, removed });
      return next;
    });
  }, []);

  const checkForDuplicateStudent = useCallback((date: Date, startTime: string, studentName?: string): boolean => {
    if (!studentName) return false;
    const key = keyFor(date);
    const existing = lessonsByDate[key] ?? [];
    return existing.some((l) => 
      l.startTime === startTime && 
      (l.studentName ?? "") === studentName
    );
  }, [lessonsByDate]);

  const refreshLessons = useCallback(async () => {
    await loadLessons();
  }, [loadLessons]);

  const value = useMemo(() => ({
    lessonsByDate,
    getLessonsForDate,
    addLesson,
    removeLessonById,
    removeLessonsByRecurringId,
    keyFor,
    checkForDuplicateStudent,
    refreshLessons,
    lessonsLoading: isLoading,
  }), [lessonsByDate, getLessonsForDate, addLesson, removeLessonById, removeLessonsByRecurringId, checkForDuplicateStudent, refreshLessons, isLoading]);

  return value;
});
