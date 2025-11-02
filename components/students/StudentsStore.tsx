import { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useAgenda } from "../agenda/AgendaStore";

export interface StudentItem {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  status: "active" | "irregular" | "inactive";
  passed?: boolean;
  theoryPassed?: boolean;
  practicalExamBooked?: boolean;
  dateAdded?: Date;
}

function seedStudents(): StudentItem[] {
  const now = new Date();
  return Array.from({ length: 2 }).map((_, i) => {
    const daysAgo = Math.floor(Math.random() * 180);
    const dateAdded = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return {
      id: String(i + 1),
      name: `Leerling ${i + 1}`,
      email: `student${i + 1}@mail.com`,
      status: i % 3 === 0 ? "active" : i % 3 === 1 ? "irregular" : "inactive",
      passed: i % 5 === 0,
      theoryPassed: i % 2 === 0,
      practicalExamBooked: i % 4 === 0,
      dateAdded,
    };
  });
}

export const [StudentsProvider, useStudents] = createContextHook(() => {
  const [customStudents, setCustomStudents] = useState<StudentItem[]>([]);
  const [deletedStudentIds, setDeletedStudentIds] = useState<Set<string>>(new Set());
  const seedData = useMemo(() => seedStudents(), []);
  const { lessonsByDate } = useAgenda();
  
  const allStudents = useMemo(() => {
    const customIds = new Set(customStudents.map(s => s.id));
    const filteredSeed = seedData.filter(s => !customIds.has(s.id) && !deletedStudentIds.has(s.id));
    const filteredCustom = customStudents.filter(s => !deletedStudentIds.has(s.id));
    return [...filteredCustom, ...filteredSeed];
  }, [customStudents, seedData, deletedStudentIds]);

  const studentActivity = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeWeeksLater = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    const allLessons = Object.values(lessonsByDate).flat();

    const studentActivityData = allStudents.map(student => {
      const studentLessons = allLessons.filter(
        lesson => lesson.studentName?.toLowerCase() === student.name.toLowerCase()
      );

      const pastLessons = studentLessons.filter(
        lesson => lesson.date >= oneMonthAgo && lesson.date < now
      ).length;

      const futureLessons = studentLessons.filter(
        lesson => lesson.date >= now && lesson.date <= threeWeeksLater
      ).length;

      const futureToFourWeeks = studentLessons.filter(
        lesson => lesson.date >= now && lesson.date <= fourWeeksLater
      ).length;

      const lastLesson = studentLessons
        .filter(lesson => lesson.date < now)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      const daysSinceLastLesson = lastLesson
        ? Math.floor((now.getTime() - lastLesson.date.getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      return {
        student,
        pastLessons,
        futureLessons,
        futureToFourWeeks,
        daysSinceLastLesson,
      };
    });

    const activeStudents = studentActivityData
      .filter(s => s.pastLessons >= 3 && s.futureLessons >= 2)
      .map(s => ({
        name: s.student.name,
        pastLessons: s.pastLessons,
        futureLessons: s.futureLessons,
        daysSinceLastLesson: s.daysSinceLastLesson,
        profileImage: `https://i.pravatar.cc/150?u=${s.student.id}`,
      }));

    const irregularStudents = studentActivityData
      .filter(s => s.pastLessons <= 2 && s.futureLessons === 1)
      .map(s => ({
        name: s.student.name,
        pastLessons: s.pastLessons,
        futureLessons: s.futureLessons,
        daysSinceLastLesson: s.daysSinceLastLesson,
        profileImage: `https://i.pravatar.cc/150?u=${s.student.id}`,
      }));

    const nonActiveStudents = studentActivityData
      .filter(s => s.daysSinceLastLesson >= 30 && s.futureToFourWeeks === 0)
      .map(s => ({
        name: s.student.name,
        pastLessons: s.pastLessons,
        futureLessons: s.futureLessons,
        daysSinceLastLesson: s.daysSinceLastLesson,
        profileImage: `https://i.pravatar.cc/150?u=${s.student.id}`,
      }));

    return {
      activeStudents,
      irregularStudents,
      nonActiveStudents,
    };
  }, [allStudents, lessonsByDate]);

  const addStudent = useCallback((student: StudentItem | Omit<StudentItem, "id">) => {
    const newStudent: StudentItem = "id" in student ? student : {
      id: String(Date.now()),
      ...student
    };
    setCustomStudents((prev) => [newStudent, ...prev]);
  }, []);

  const updateStudent = useCallback((id: string, updates: Partial<StudentItem>) => {
    const existsInCustom = customStudents.some(s => s.id === id);
    const existsInSeed = seedData.some(s => s.id === id);
    
    if (existsInCustom) {
      setCustomStudents((prev) => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } else if (existsInSeed) {
      const seedStudent = seedData.find(s => s.id === id);
      if (seedStudent) {
        setCustomStudents((prev) => [
          ...prev,
          { ...seedStudent, ...updates }
        ]);
      }
    }
  }, [customStudents, seedData]);

  const deleteStudent = useCallback((id: string) => {
    setDeletedStudentIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    setCustomStudents((prev) => prev.filter(s => s.id !== id));
  }, []);

  const value = useMemo(() => ({
    students: allStudents,
    studentActivity,
    addStudent,
    updateStudent,
    deleteStudent,
  }), [allStudents, studentActivity, addStudent, updateStudent, deleteStudent]);

  return value;
});


