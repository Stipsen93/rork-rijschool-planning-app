import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const getStudentProfileProcedure = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.id;

  console.log("[getStudentProfileProcedure] Fetching student profile for user:", userId);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("[getStudentProfileProcedure] Error fetching profile:", profileError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch profile",
    });
  }

  const { data: studentProfile, error: studentError } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (studentError && studentError.code !== "PGRST116") {
    console.error("[getStudentProfileProcedure] Error fetching student profile:", studentError);
  }

  const profileData = profile as any;
  const studentData = studentProfile as any;

  return {
    first_name: studentData?.first_name || profileData?.first_name || "",
    last_name: studentData?.last_name || profileData?.last_name || "",
    birth_date: studentData?.birth_date || null,
    email: profileData?.email || "",
    address: studentData?.address || null,
    phone: profileData?.phone || null,
    parent_name: studentData?.parent_name || null,
    parent_phone: studentData?.parent_phone || null,
    avatar_url: profileData?.avatar_url || null,
  };
});
