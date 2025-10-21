import React, { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

export type AgendaLesson = {
  id: string;
  studentName?: string;
  lessonType?: string;
  startTime: string;
  endTime: string;
  date: Date;
  status?: string;
  location?: string;
  notes?: string;
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

function seedLessons(): Record<string, AgendaLesson[]> {
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  const d = (offset: number) => new Date(today.getTime() + offset * day);
  return {
    [keyFor(d(0))]: [
      { id: uid(), studentName: "Emma", lessonType: "Praktijkles", startTime: "10:00", endTime: "11:00", date: d(0) },
      { id: uid(), studentName: "Lucas", lessonType: "Theorieles", startTime: "13:00", endTime: "14:00", date: d(0) },
    ],
    [keyFor(d(1))]: [
      { id: uid(), studentName: "Sophie", lessonType: "Praktijkles", startTime: "09:00", endTime: "10:00", date: d(1) },
    ],
    [keyFor(d(3))]: [
      { id: uid(), studentName: "Daan", lessonType: "Toets", startTime: "15:00", endTime: "16:00", date: d(3) },
    ],
  };
}

export const [AgendaProvider, useAgenda] = createContextHook(() => {
  const [lessonsByDate, setLessonsByDate] = useState<Record<string, AgendaLesson[]>>(() => seedLessons());

  const getLessonsForDate = useCallback((date: Date): AgendaLesson[] => {
    const key = keyFor(date);
    return lessonsByDate[key] ?? [];
  }, [lessonsByDate]);

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

  const value = useMemo(() => ({
    lessonsByDate,
    getLessonsForDate,
    removeLessonById,
    keyFor,
  }), [lessonsByDate, getLessonsForDate, removeLessonById]);

  return value;
});
