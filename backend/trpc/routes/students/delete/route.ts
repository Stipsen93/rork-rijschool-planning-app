import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";

const deleteStudentSchema = z.object({
  studentId: z.string().uuid(),
});

export const deleteStudentProcedure = protectedProcedure
  .input(deleteStudentSchema)
  .mutation(async ({ ctx, input }) => {
    console.log("[DeleteStudent] Unlinking student from instructor", {
      studentId: input.studentId,
    });

    const { supabase, user } = ctx;
    const instructorId = user.id;

    const { data: studentProfile, error: studentProfileError } = await supabase
      .from("student_profiles")
      .select("user_id, instructor_id")
      .eq("user_id", input.studentId)
      .maybeSingle();

    if (studentProfileError) {
      console.error("[DeleteStudent] Error loading student profile:", studentProfileError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Fout bij laden leerling: ${studentProfileError.message}`,
      });
    }

    if (!studentProfile || (studentProfile as any).instructor_id !== instructorId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Je hebt geen toestemming om deze leerling te verwijderen",
      });
    }

    const { error: deleteError } = await (supabase
      .from("student_profiles") as any)
      .delete()
      .eq("user_id", input.studentId)
      .eq("instructor_id", instructorId);

    if (deleteError) {
      console.error("[DeleteStudent] Error unlinking student:", deleteError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Fout bij verwijderen leerling uit je lijst: ${deleteError.message}`,
      });
    }

    console.log("[DeleteStudent] Student unlinked successfully");

    return {
      success: true,
      studentId: input.studentId,
    };
  });
