import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";

const deleteStudentSchema = z.object({
  studentId: z.string().uuid(),
});

export const deleteStudentProcedure = protectedProcedure
  .input(deleteStudentSchema)
  .mutation(async ({ ctx, input }) => {
    console.log("[DeleteStudent] Deleting student", input.studentId);
    
    const { supabase, user } = ctx;
    const userId = user.id;

    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("user_id, instructor_id")
      .eq("user_id", input.studentId)
      .single();

    if (!studentProfile || (studentProfile as any).instructor_id !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Je hebt geen toestemming om deze leerling te verwijderen",
      });
    }

    const { error: unlinkError } = await (supabase
      .from("student_profiles") as any)
      .update({ instructor_id: null })
      .eq("user_id", input.studentId)
      .eq("instructor_id", userId);

    if (unlinkError) {
      console.error("[DeleteStudent] Error unlinking student:", unlinkError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Fout bij ontkoppelen leerling: ${unlinkError.message}`,
      });
    }

    console.log("[DeleteStudent] Student unlinked successfully");

    return {
      success: true,
      studentId: input.studentId,
    };
  });
