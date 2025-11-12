import { studentProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";

export const myLinkRequestsProcedure = studentProcedure.query(async ({ ctx }) => {
  const { data, error } = await ctx.supabase
    .from("instructor_link_requests")
    .select(
      `
        *,
        instructor:profiles!instructor_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `
    )
    .eq("student_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[myLinkRequests] Error:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Kon je koppelverzoeken niet ophalen",
    });
  }

  return data || [];
});
