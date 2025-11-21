import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { TRPCError } from "@trpc/server";

const createStudentSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres"),
  phone: z.string().optional(),
  birthDate: z.string().nullable().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "irregular", "inactive"]).default("active"),
});

export const createStudentProcedure = protectedProcedure
  .input(createStudentSchema)
  .mutation(async ({ ctx, input }) => {
    console.log("[CreateStudent] Creating student", input);
    
    const { supabase, user } = ctx;
    const userId = user.id;

    const { data: instructorProfile } = await supabase
      .from("instructor_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (!instructorProfile) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Je moet een instructeur zijn om leerlingen toe te voegen",
      });
    }

    const fullName = `${input.firstName} ${input.lastName}`.trim();

    const studentId = crypto.randomUUID();

    const { error: profileError } = await (supabase
      .from("profiles") as any)
      .insert({
        id: studentId,
        email: input.email,
        full_name: fullName,
        first_name: input.firstName,
        last_name: input.lastName,
        role: "student",
        phone: input.phone || null,
        birth_date: input.birthDate ? new Date(input.birthDate).toISOString().split('T')[0] : null,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error("[CreateStudent] Error creating profile:", profileError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Fout bij aanmaken profiel: ${profileError.message}`,
      });
    }

    const { error: studentProfileError } = await (supabase
      .from("student_profiles") as any)
      .insert({
        user_id: studentId,
        instructor_id: userId,
        level: "Beginner",
        total_lessons_completed: 0,
        hours_driven: 0,
        overall_progress: 0,
        learning_preferences: {
          emergencyContactName: input.emergencyContactName || null,
          emergencyContactPhone: input.emergencyContactPhone || null,
          notes: input.notes || null,
        },
      })
      .select()
      .single();

    if (studentProfileError) {
      console.error("[CreateStudent] Error creating student profile:", studentProfileError);
      
      await (supabase.from("profiles") as any).delete().eq("id", studentId);
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Fout bij aanmaken leerling profiel: ${studentProfileError.message}`,
      });
    }

    console.log("[CreateStudent] Student created successfully", studentId);

    return {
      id: studentId,
      name: fullName,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
      status: input.status,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      notes: input.notes,
      dateAdded: new Date(),
    };
  });
