import { TRPCError } from "@trpc/server";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { protectedProcedure } from "../../../create-context";

interface DeletionResult {
  success: boolean;
  profileSanitized: boolean;
}

export const deleteAccountProcedure = protectedProcedure.mutation<DeletionResult>(async ({ ctx }) => {
  const userId = ctx.user.id;
  const failures: string[] = [];
  let profileSanitized = false;

  const deleteSingle = async (
    label: string,
    query: PromiseLike<{ error: PostgrestError | null }>,
  ) => {
    const { error } = await query;
    if (error) {
      console.error(`[deleteAccount] Failed on ${label}:`, error.message);
      failures.push(`${label}: ${error.message}`);
    }
  };

  await deleteSingle("lessons as instructor", ctx.supabase.from("lessons").delete().eq("instructor_id", userId));
  await deleteSingle("lessons as student", ctx.supabase.from("lessons").delete().eq("student_id", userId));
  await deleteSingle(
    "link requests",
    ctx.supabase.from("instructor_link_requests").delete().or(`student_id.eq.${userId},instructor_id.eq.${userId}`),
  );
  await deleteSingle("student packages", ctx.supabase.from("student_packages").delete().eq("student_id", userId));
  await deleteSingle("student products", ctx.supabase.from("student_products").delete().eq("student_id", userId));
  await deleteSingle("packages", ctx.supabase.from("packages").delete().eq("instructor_id", userId));
  await deleteSingle("products", ctx.supabase.from("products").delete().eq("instructor_id", userId));
  await deleteSingle("vehicles", ctx.supabase.from("vehicles").delete().eq("instructor_id", userId));
  await deleteSingle(
    "student profiles by instructor",
    ctx.supabase.from("student_profiles").delete().eq("instructor_id", userId),
  );
  await deleteSingle("student profile", ctx.supabase.from("student_profiles").delete().eq("user_id", userId));
  await deleteSingle("instructor profile", ctx.supabase.from("instructor_profiles").delete().eq("user_id", userId));

  const { error: profileDeleteError } = await ctx.supabase.from("profiles").delete().eq("id", userId);

  if (profileDeleteError) {
    console.warn("[deleteAccount] Direct profile removal failed, attempting sanitization", profileDeleteError.message);
    const sanitizePayload = {
      first_name: null,
      last_name: null,
      full_name: null,
      phone: null,
      birth_date: null,
      is_active: false,
      updated_at: new Date().toISOString(),
    } satisfies Database["public"]["Tables"]["profiles"]["Update"];

    const { error: profileUpdateError } = await ctx.supabase
      .from("profiles")
      .update(sanitizePayload as never)
      .eq("id", userId);

    if (profileUpdateError) {
      failures.push(`profiles: ${profileUpdateError.message}`);
    } else {
      profileSanitized = true;
    }
  }

  if (failures.length > 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: failures.join(" | "),
    });
  }

  return {
    success: true,
    profileSanitized,
  };
});
