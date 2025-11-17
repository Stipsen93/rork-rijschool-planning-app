import { z } from "zod";
import { studentProcedure } from "../../../create-context";

export const searchInstructorsProcedure = studentProcedure
  .input(
    z.object({
      query: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    console.log("[searchInstructors] Query:", input.query);

    let query = ctx.supabase
      .from("instructor_profiles")
      .select(
        `
        id,
        user_id,
        instructor_number,
        company_name,
        bio,
        rating,
        total_lessons,
        specializations,
        profiles!instructor_profiles_user_id_fkey (
          first_name,
          last_name,
          avatar_url,
          phone
        )
      `
      )
      .order("created_at", { ascending: false });

    if (input.query && input.query.trim() !== "") {
      const searchTerm = input.query.toLowerCase().trim();
      
      query = query.or(
        `instructor_number.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,profiles.first_name.ilike.%${searchTerm}%,profiles.last_name.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[searchInstructors] Error:", error);
      throw new Error("Kon instructeurs niet ophalen");
    }

    console.log("[searchInstructors] Found:", data?.length, "instructors");

    const instructors = (data || []).map((instructor: any) => {
      const profile = Array.isArray(instructor.profiles)
        ? instructor.profiles[0]
        : instructor.profiles;

      return {
        id: instructor.user_id,
        instructorProfileId: instructor.id,
        name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || "Onbekende instructeur",
        photo: profile?.avatar_url || `https://i.pravatar.cc/150?u=${instructor.user_id}`,
        rating: instructor.rating || 0,
        reviewCount: instructor.total_lessons || 0,
        school: instructor.company_name || "Onbekende rijschool",
        instructorNumber: instructor.instructor_number || "",
        specializations: instructor.specializations || [],
        bio: instructor.bio || "",
      };
    });

    return instructors;
  });
