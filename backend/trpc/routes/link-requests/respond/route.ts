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
    console.log("[respondLinkRequest] input", input);

    const { data: request, error: fetchError } = await (ctx.supabase
      .from("instructor_link_requests") as any)
      .select("*")
      .eq("id", input.requestId)
      .eq("instructor_id", ctx.user.id)
      .eq("status", "pending")
      .single();

    if (fetchError || !request) {
      console.error("[respondLinkRequest] request fetch error", fetchError);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Koppelverzoek niet gevonden",
      });
    }

    const newStatus = input.accept ? "accepted" : "rejected";
    const respondedAt = new Date().toISOString();

    if (input.accept) {
      console.log("[respondLinkRequest] Accepting request -> linking student to instructor", {
        studentId: request.student_id,
        instructorId: ctx.user.id,
      });

      const { error: studentUpdateError } = await (ctx.supabase
        .from("student_profiles") as any)
        .update({ instructor_id: ctx.user.id })
        .eq("user_id", request.student_id);

      if (studentUpdateError) {
        console.error("[respondLinkRequest] student_profiles update error", studentUpdateError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kon leerling niet koppelen aan instructeur",
        });
      }

      console.log("[respondLinkRequest] student linked successfully");
    }

    const { data, error } = await (ctx.supabase
      .from("instructor_link_requests") as any)
      .update({
        status: newStatus,
        responded_at: respondedAt,
        updated_at: respondedAt,
      } satisfies LinkRequestUpdate)
      .eq("id", input.requestId)
      .select()
      .single();

    if (error) {
      console.error("[respondLinkRequest] link request update error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Kon niet reageren op koppelverzoek",
      });
    }

    return data;
  });
