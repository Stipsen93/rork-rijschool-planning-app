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

  return {
    first_name: studentProfile?.first_name || profile.full_name?.split(" ")[0] || "",
    last_name: studentProfile?.last_name || profile.full_name?.split(" ").slice(1).join(" ") || "",
    birth_date: studentProfile?.birth_date || null,
    email: profile.email || "",
    address: studentProfile?.address || null,
    phone: profile.phone || null,
    parent_name: studentProfile?.parent_name || null,
    parent_phone: studentProfile?.parent_phone || null,
    avatar_url: profile.avatar_url || null,
  };
});
