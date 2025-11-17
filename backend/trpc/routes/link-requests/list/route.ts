import { instructorProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";

export const listLinkRequestsProcedure = instructorProcedure.query(
  async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("instructor_link_requests")
      .select(
        `
        *,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          phone
        )
      `
      )
      .eq("instructor_id", ctx.user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[listLinkRequests] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Kon koppelverzoeken niet ophalen",
      });
    }

    return data || [];
  }
);
