import { protectedProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";

export const listStudentsProcedure = protectedProcedure.query(async ({ ctx }) => {
  console.log("[ListStudents] Fetching students for instructor");
  
  const { supabase, user } = ctx;
  const userId = user.id;

  const { data: instructorProfile } = await supabase
    .from("instructor_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  if (!instructorProfile) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Je moet een instructeur zijn om leerlingen te bekijken",
    });
  }

  const { data: studentProfiles, error: studentProfilesError } = await supabase
    .from("student_profiles")
    .select(`
      id,
      user_id,
      level,
      total_lessons_completed,
      hours_driven,
      overall_progress,
      learning_preferences,
      created_at,
      profiles!inner (
        id,
        email,
        full_name,
        first_name,
        last_name,
        phone,
        birth_date
      )
    `)
    .eq("instructor_id", userId);

  if (studentProfilesError) {
    console.error("[ListStudents] Error fetching students:", studentProfilesError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Fout bij ophalen leerlingen: ${studentProfilesError.message}`,
    });
  }

  console.log("[ListStudents] Found students:", studentProfiles?.length || 0);

  const students = (studentProfiles || []).map((sp: any) => {
    const profile = sp.profiles;
    const preferences = sp.learning_preferences || {};
    
    return {
      id: sp.user_id,
      name: profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      birthDate: profile.birth_date,
      status: "active" as const,
      level: sp.level,
      totalLessonsCompleted: sp.total_lessons_completed,
      hoursDriven: sp.hours_driven,
      overallProgress: sp.overall_progress,
      emergencyContactName: preferences.emergencyContactName,
      emergencyContactPhone: preferences.emergencyContactPhone,
      notes: preferences.notes,
      dateAdded: new Date(sp.created_at),
      passed: false,
      theoryPassed: false,
      practicalExamBooked: false,
    };
  });

  return students;
});
