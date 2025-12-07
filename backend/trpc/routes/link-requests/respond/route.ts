import { z } from "zod";
import { instructorProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/types/supabase";

type LinkRequestUpdate = Database["public"]["Tables"]["instructor_link_requests"]["Update"];

export const respondLinkRequestProcedure = instructorProcedure
  .input(
    z.object({
      requestId: z.string().uuid(),
      accept: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: request, error: fetchError } = await (ctx.supabase
      .from("instructor_link_requests") as any)
      .select("*")
      .eq("id", input.requestId)
      .eq("instructor_id", ctx.user.id)
      .eq("status", "pending")
      .single();

    if (fetchError || !request) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Koppelverzoek niet gevonden",
      });
    }

    const newStatus = input.accept ? "accepted" : "rejected";

    const { data, error } = await (ctx.supabase
      .from("instructor_link_requests") as any)
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
      } satisfies LinkRequestUpdate)
      .eq("id", input.requestId)
      .select()
      .single();

    if (error) {
      console.error("[respondLinkRequest] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Kon niet reageren op koppelverzoek",
      });
    }

    return data;
  });
