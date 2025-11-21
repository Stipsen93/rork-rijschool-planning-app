import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";

const updateStudentSchema = z.object({
  studentId: z.string().uuid(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.string().nullable().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "irregular", "inactive"]).optional(),
});

export const updateStudentProcedure = protectedProcedure
  .input(updateStudentSchema)
  .mutation(async ({ ctx, input }) => {
    console.log("[UpdateStudent] Updating student", input.studentId);
    
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
        message: "Je hebt geen toestemming om deze leerling te wijzigen",
      });
    }

    const profileUpdates: any = {};
    if (input.firstName !== undefined) profileUpdates.first_name = input.firstName;
    if (input.lastName !== undefined) profileUpdates.last_name = input.lastName;
    if (input.email !== undefined) profileUpdates.email = input.email;
    if (input.phone !== undefined) profileUpdates.phone = input.phone;
    if (input.birthDate !== undefined) {
      profileUpdates.birth_date = input.birthDate ? new Date(input.birthDate).toISOString().split('T')[0] : null;
    }
    
    if (input.firstName || input.lastName) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", input.studentId)
        .single();
      
      const firstName = input.firstName || (currentProfile as any)?.first_name || "";
      const lastName = input.lastName || (currentProfile as any)?.last_name || "";
      profileUpdates.full_name = `${firstName} ${lastName}`.trim();
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await (supabase
        .from("profiles") as any)
        .update(profileUpdates)
        .eq("id", input.studentId);

      if (profileError) {
        console.error("[UpdateStudent] Error updating profile:", profileError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Fout bij updaten profiel: ${profileError.message}`,
        });
      }
    }

    const { data: currentStudentProfile } = await supabase
      .from("student_profiles")
      .select("learning_preferences")
      .eq("user_id", input.studentId)
      .single();

    const currentPreferences = (currentStudentProfile as any)?.learning_preferences || {};
    const newPreferences = { ...currentPreferences };
    
    if (input.emergencyContactName !== undefined) {
      newPreferences.emergencyContactName = input.emergencyContactName;
    }
    if (input.emergencyContactPhone !== undefined) {
      newPreferences.emergencyContactPhone = input.emergencyContactPhone;
    }
    if (input.notes !== undefined) {
      newPreferences.notes = input.notes;
    }

    const { error: studentProfileError } = await (supabase
      .from("student_profiles") as any)
      .update({
        learning_preferences: newPreferences,
      })
      .eq("user_id", input.studentId);

    if (studentProfileError) {
      console.error("[UpdateStudent] Error updating student profile:", studentProfileError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Fout bij updaten leerling profiel: ${studentProfileError.message}`,
      });
    }

    console.log("[UpdateStudent] Student updated successfully");

    return {
      success: true,
      studentId: input.studentId,
    };
  });
