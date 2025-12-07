import { z } from "zod";
import { studentProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/types/supabase";

type LinkRequestUpdate = Database["public"]["Tables"]["instructor_link_requests"]["Update"];

export const cancelLinkRequestProcedure = studentProcedure
  .input(
    z.object({
      requestId: z.string().uuid(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: request, error: fetchError } = await (ctx.supabase
      .from("instructor_link_requests") as any)
      .select("*")
      .eq("id", input.requestId)
      .eq("student_id", ctx.user.id)
      .eq("status", "pending")
      .single();

    if (fetchError || !request) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Koppelverzoek niet gevonden",
      });
    }

    const { data, error } = await (ctx.supabase
      .from("instructor_link_requests") as any)
      .update({
        status: "cancelled",
      } satisfies LinkRequestUpdate)
      .eq("id", input.requestId)
      .select()
      .single();

    if (error) {
      console.error("[cancelLinkRequest] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Kon koppelverzoek niet annuleren",
      });
    }

    return data;
  });
