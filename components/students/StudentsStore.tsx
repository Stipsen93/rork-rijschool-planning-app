import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useAgenda } from "../agenda/AgendaStore";
import { trpc } from "@/lib/trpc";

export interface StudentItem {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  birthDate?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  status: "active" | "irregular" | "inactive";
  passed?: boolean;
  theoryPassed?: boolean;
  practicalExamBooked?: boolean;
  dateAdded?: Date;
}

function seedStudents(): StudentItem[] {
  return [];
}

export const [StudentsProvider, useStudents] = createContextHook(() => {
  const [customStudents, setCustomStudents] = useState<StudentItem[]>([]);
  const [deletedStudentIds, setDeletedStudentIds] = useState<Set<string>>(new Set());
  const seedData = useMemo(() => seedStudents(), []);
  const { lessonsByDate } = useAgenda();
  
  const studentsQuery = trpc.students.list.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const refetchStudents = useCallback(() => studentsQuery.refetch(), [studentsQuery]);
  
  const createStudentMutation = trpc.students.create.useMutation();
  const updateStudentMutation = trpc.students.update.useMutation();
  const deleteStudentMutation = trpc.students.delete.useMutation();
  
  useEffect(() => {
    if (studentsQuery.data) {
      const students = studentsQuery.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone ?? "",
        birthDate: s.birthDate ?? null,
        emergencyContactName: s.emergencyContactName ?? null,
        emergencyContactPhone: s.emergencyContactPhone ?? null,
        notes: s.notes ?? null,
        status: s.status || "active",
        passed: s.passed,
        theoryPassed: s.theoryPassed,
        practicalExamBooked: s.practicalExamBooked,
        dateAdded: s.dateAdded ? new Date(s.dateAdded) : new Date(),
      }));
      setCustomStudents(students);
    }
  }, [studentsQuery.data, studentsQuery.error]);
  
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

  const addStudent = useCallback(async (student: StudentItem | Omit<StudentItem, "id">) => {
    console.log("[StudentsStore] Adding student", student);
    
    if ("id" in student) {
      const newStudent: StudentItem = student;
      setCustomStudents((prev) => [newStudent, ...prev]);
      return;
    }
    
    try {
      const fallbackFirst = student.firstName || student.name.split(" ")[0] || "";
      const fallbackLast = student.lastName || student.name.split(" ").slice(1).join(" ") || "";
      const result = await createStudentMutation.mutateAsync({
        firstName: fallbackFirst,
        lastName: fallbackLast,
        email: student.email,
        phone: student.phone ?? "",
        birthDate: student.birthDate ?? null,
        emergencyContactName: student.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: student.emergencyContactPhone?.trim() || undefined,
        notes: student.notes?.trim() || undefined,
        status: student.status || "active",
      });
      console.log("[StudentsStore] Student created:", result);
      await refetchStudents();
    } catch (error) {
      console.error("[StudentsStore] Failed to add student:", error);
      throw error;
    }
  }, [createStudentMutation, refetchStudents]);

  const updateStudent = useCallback(async (id: string, updates: Partial<StudentItem>) => {
    console.log("[StudentsStore] Updating student", id, updates);
    
    const existsInCustom = customStudents.some(s => s.id === id);
    const existsInSeed = seedData.some(s => s.id === id);
    
    if (existsInCustom) {
      setCustomStudents((prev) => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      
      try {
        await updateStudentMutation.mutateAsync({
          studentId: id,
          firstName: updates.firstName,
          lastName: updates.lastName,
          email: updates.email,
          status: updates.status,
        });
        console.log("[StudentsStore] Student updated");
        await refetchStudents();
      } catch (error) {
        console.error("[StudentsStore] Failed to update student:", error);
      }
    } else if (existsInSeed) {
      const seedStudent = seedData.find(s => s.id === id);
      if (seedStudent) {
        setCustomStudents((prev) => [
          ...prev,
          { ...seedStudent, ...updates }
        ]);
      }
    }
  }, [customStudents, seedData, updateStudentMutation, refetchStudents]);

  const deleteStudent = useCallback(async (id: string) => {
    console.log("[StudentsStore] Deleting student", id);
    
    setDeletedStudentIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    setCustomStudents((prev) => prev.filter(s => s.id !== id));
    
    try {
      await deleteStudentMutation.mutateAsync({ studentId: id });
      console.log("[StudentsStore] Student deleted", id);
      await refetchStudents();
    } catch (error) {
      console.error("[StudentsStore] Failed to delete student:", error);
    }
  }, [deleteStudentMutation, refetchStudents]);

  const value = useMemo(() => ({
    students: allStudents,
    studentActivity,
    addStudent,
    updateStudent,
    deleteStudent,
    isLoading: studentsQuery.isLoading,
    refetch: refetchStudents,
  }), [allStudents, studentActivity, addStudent, updateStudent, deleteStudent, studentsQuery.isLoading, refetchStudents]);

  return value;
});


