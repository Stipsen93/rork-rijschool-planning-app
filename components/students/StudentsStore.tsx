import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useAgenda } from "../agenda/AgendaStore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../auth/AuthStore";

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
  const [isLoading, setIsLoading] = useState(false);
  const seedData = useMemo(() => seedStudents(), []);
  const { lessonsByDate } = useAgenda();
  const { user } = useAuth();
  
  const fetchStudents = useCallback(async () => {
    if (!user?.id) {
      console.log("[StudentsStore] No user ID, skipping fetch");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("[StudentsStore] Fetching students from Supabase");
      
      const { data: studentsData, error } = await supabase
        .from("student_profiles")
        .select(`
          user_id,
          instructor_id,
          level,
          total_lessons_completed,
          hours_driven,
          overall_progress,
          learning_preferences,
          profiles!student_profiles_user_id_fkey (
            id,
            email,
            full_name,
            first_name,
            last_name,
            phone,
            birth_date,
            role,
            is_active
          )
        `)
        .eq("instructor_id", user.id);
      
      if (error) {
        console.error("[StudentsStore] Error fetching students:", error);
        return;
      }
      
      if (studentsData) {
        const students: StudentItem[] = studentsData.map((s: any) => {
          const profile = s.profiles;
          const learningPrefs = s.learning_preferences || {};
          
          return {
            id: s.user_id,
            name: profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
            firstName: profile?.first_name || "",
            lastName: profile?.last_name || "",
            email: profile?.email || "",
            phone: profile?.phone || "",
            birthDate: profile?.birth_date || null,
            emergencyContactName: learningPrefs.emergencyContactName || null,
            emergencyContactPhone: learningPrefs.emergencyContactPhone || null,
            notes: learningPrefs.notes || null,
            status: "active" as const,
            passed: false,
            theoryPassed: false,
            practicalExamBooked: false,
            dateAdded: new Date(),
          };
        });
        
        console.log("[StudentsStore] Fetched", students.length, "students");
        setCustomStudents(students);
      }
    } catch (error) {
      console.error("[StudentsStore] Failed to fetch students:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);
  
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  
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
    
    if (!user?.id) {
      throw new Error("Gebruiker niet ingelogd");
    }
    
    try {
      const firstName = student.firstName || student.name.split(" ")[0] || "";
      const lastName = student.lastName || student.name.split(" ").slice(1).join(" ") || "";
      const fullName = `${firstName} ${lastName}`.trim();
      
      const { data: existingProfile, error: existingProfileError } = await (supabase
        .from("profiles") as any)
        .select("id, role")
        .eq("email", student.email)
        .maybeSingle();
      
      if (existingProfileError) {
        console.error("[StudentsStore] Error checking existing profile:", existingProfileError);
        throw new Error("Kon niet controleren of dit e-mailadres al bestaat");
      }
      
      if (existingProfile && existingProfile.role !== "student") {
        throw new Error("Dit e-mailadres is al gekoppeld aan een ander account");
      }
      
      let studentId = existingProfile?.id ?? crypto.randomUUID();
      let createdProfile = false;
      
      if (!existingProfile) {
        const { error: profileError } = await (supabase
          .from("profiles") as any)
          .insert({
            id: studentId,
            email: student.email,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            role: "student",
            phone: student.phone || null,
            birth_date: student.birthDate ? new Date(student.birthDate).toISOString().split("T")[0] : null,
            is_active: true,
          });
        
        if (profileError) {
          console.error("[StudentsStore] Error creating profile:", profileError);
          throw new Error(`Fout bij aanmaken profiel: ${profileError.message}`);
        }
        
        createdProfile = true;
      }
      
      const { data: existingStudentProfile, error: existingStudentProfileError } = await (supabase
        .from("student_profiles") as any)
        .select("instructor_id")
        .eq("user_id", studentId)
        .maybeSingle();
      
      if (existingStudentProfileError) {
        console.error("[StudentsStore] Error checking student profile:", existingStudentProfileError);
        if (createdProfile) {
          await (supabase.from("profiles") as any).delete().eq("id", studentId);
        }
        throw new Error("Kon bestaande leerlinggegevens niet controleren");
      }
      
      if (existingStudentProfile) {
        if (existingStudentProfile.instructor_id === user.id) {
          throw new Error("Deze leerling staat al in je lijst");
        }
        throw new Error("Dit e-mailadres is al gekoppeld aan een andere instructeur");
      }
      
      const { error: studentProfileError } = await (supabase
        .from("student_profiles") as any)
        .insert({
          user_id: studentId,
          instructor_id: user.id,
          level: "Beginner",
          total_lessons_completed: 0,
          hours_driven: 0,
          overall_progress: 0,
          learning_preferences: {
            emergencyContactName: student.emergencyContactName || null,
            emergencyContactPhone: student.emergencyContactPhone || null,
            notes: student.notes || null,
          },
        });
      
      if (studentProfileError) {
        console.error("[StudentsStore] Error creating student profile:", studentProfileError);
        if (createdProfile) {
          await (supabase.from("profiles") as any).delete().eq("id", studentId);
        }
        throw new Error(`Fout bij aanmaken leerling profiel: ${studentProfileError.message}`);
      }
      
      console.log("[StudentsStore] Student created successfully", studentId);
      await fetchStudents();
    } catch (error) {
      console.error("[StudentsStore] Failed to add student:", error);
      throw error;
    }
  }, [user?.id, fetchStudents]);

  const updateStudent = useCallback(async (id: string, updates: Partial<StudentItem>) => {
    console.log("[StudentsStore] Updating student", id, updates);
    
    setCustomStudents((prev) => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    
    try {
      if (updates.firstName || updates.lastName || updates.email || updates.phone || updates.birthDate) {
        const profileUpdates: any = {};
        if (updates.firstName) profileUpdates.first_name = updates.firstName;
        if (updates.lastName) profileUpdates.last_name = updates.lastName;
        if (updates.email) profileUpdates.email = updates.email;
        if (updates.phone) profileUpdates.phone = updates.phone;
        if (updates.birthDate) profileUpdates.birth_date = updates.birthDate;
        
        if (updates.firstName && updates.lastName) {
          profileUpdates.full_name = `${updates.firstName} ${updates.lastName}`.trim();
        }
        
        const { error: profileError } = await (supabase
          .from("profiles") as any)
          .update(profileUpdates)
          .eq("id", id);
        
        if (profileError) {
          console.error("[StudentsStore] Failed to update profile:", profileError);
        }
      }
      
      if (updates.emergencyContactName || updates.emergencyContactPhone || updates.notes) {
        const { data: currentStudent } = await (supabase
          .from("student_profiles") as any)
          .select("learning_preferences")
          .eq("user_id", id)
          .single();
        
        const currentPrefs = (currentStudent?.learning_preferences as any) || {};
        const updatedPrefs = { ...currentPrefs };
        
        if (updates.emergencyContactName !== undefined) updatedPrefs.emergencyContactName = updates.emergencyContactName;
        if (updates.emergencyContactPhone !== undefined) updatedPrefs.emergencyContactPhone = updates.emergencyContactPhone;
        if (updates.notes !== undefined) updatedPrefs.notes = updates.notes;
        
        const { error: studentProfileError } = await (supabase
          .from("student_profiles") as any)
          .update({ learning_preferences: updatedPrefs })
          .eq("user_id", id);
        
        if (studentProfileError) {
          console.error("[StudentsStore] Failed to update student profile:", studentProfileError);
        }
      }
      
      console.log("[StudentsStore] Student updated");
      await fetchStudents();
    } catch (error) {
      console.error("[StudentsStore] Failed to update student:", error);
    }
  }, [fetchStudents]);

  const deleteStudent = useCallback(async (id: string) => {
    console.log("[StudentsStore] Deleting student", id);
    
    setDeletedStudentIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    setCustomStudents((prev) => prev.filter(s => s.id !== id));
    
    try {
      const { error } = await (supabase
        .from("student_profiles") as any)
        .delete()
        .eq("user_id", id);
      
      if (error) {
        console.error("[StudentsStore] Failed to delete student:", error);
        throw error;
      }
      
      console.log("[StudentsStore] Student deleted", id);
      await fetchStudents();
    } catch (error) {
      console.error("[StudentsStore] Failed to delete student:", error);
      throw error;
    }
  }, [fetchStudents]);

  const value = useMemo(() => ({
    students: allStudents,
    studentActivity,
    addStudent,
    updateStudent,
    deleteStudent,
    isLoading,
    refetch: fetchStudents,
  }), [allStudents, studentActivity, addStudent, updateStudent, deleteStudent, isLoading, fetchStudents]);

  return value;
});


