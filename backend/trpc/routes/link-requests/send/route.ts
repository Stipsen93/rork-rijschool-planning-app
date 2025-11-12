import { z } from "zod";
import { studentProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";

export const sendLinkRequestProcedure = studentProcedure
  .input(
    z.object({
      instructorId: z.string().uuid(),
      message: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data: existingRequest } = await ctx.supabase
      .from("instructor_link_requests")
      .select("*")
      .eq("student_id", ctx.user.id)
      .eq("instructor_id", input.instructorId)
      .eq("status", "pending")
      .single();

    if (existingRequest) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Je hebt al een openstaand koppelverzoek naar deze instructeur",
      });
    }

    const { data, error } = await ctx.supabase
      .from("instructor_link_requests")
      .insert({
        student_id: ctx.user.id,
        instructor_id: input.instructorId,
        message: input.message,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[sendLinkRequest] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Kon koppelverzoek niet versturen",
      });
    }

    return data;
  });
