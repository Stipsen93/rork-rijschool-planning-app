import { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

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

export const [AgendaProvider, useAgenda] = createContextHook(() => {
  const [lessonsByDate, setLessonsByDate] = useState<Record<string, AgendaLesson[]>>(() => seedLessons());

  const getLessonsForDate = useCallback((date: Date): AgendaLesson[] => {
    const key = keyFor(date);
    return (lessonsByDate[key] ?? []).slice().sort(byStartTimeAsc);
  }, [lessonsByDate]);

  const addLesson = useCallback((lesson: Omit<AgendaLesson, "id"> & { id?: string }) => {
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

  const value = useMemo(() => ({
    lessonsByDate,
    getLessonsForDate,
    addLesson,
    removeLessonById,
    removeLessonsByRecurringId,
    keyFor,
  }), [lessonsByDate, getLessonsForDate, addLesson, removeLessonById, removeLessonsByRecurringId]);

  return value;
});
