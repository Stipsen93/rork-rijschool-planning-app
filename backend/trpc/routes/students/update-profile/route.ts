import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const updateStudentProfileSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  parent_name: z.string().nullable(),
  parent_phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

export const updateStudentProfileProcedure = protectedProcedure
  .input(updateStudentProfileSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    console.log("[updateStudentProfileProcedure] Updating student profile for user:", userId);

    const { data: existingProfile, error: checkError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("[updateStudentProfileProcedure] Error checking student profile:", checkError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check student profile",
      });
    }

    if (existingProfile) {
      const { error: updateError } = await supabase
        .from("student_profiles")
        .update({
          first_name: input.first_name,
          last_name: input.last_name,
          birth_date: input.birth_date,
          address: input.address,
          parent_name: input.parent_name,
          parent_phone: input.parent_phone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[updateStudentProfileProcedure] Error updating student profile:", updateError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update student profile",
        });
      }
    } else {
      const { error: insertError } = await supabase
        .from("student_profiles")
        .insert({
          user_id: userId,
          first_name: input.first_name,
          last_name: input.last_name,
          birth_date: input.birth_date,
          address: input.address,
          parent_name: input.parent_name,
          parent_phone: input.parent_phone,
        });

      if (insertError) {
        console.error("[updateStudentProfileProcedure] Error inserting student profile:", insertError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create student profile",
        });
      }
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        full_name: `${input.first_name} ${input.last_name}`,
        phone: input.phone,
        avatar_url: input.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("[updateStudentProfileProcedure] Error updating profile:", profileUpdateError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update profile",
      });
    }

    console.log("[updateStudentProfileProcedure] Student profile updated successfully");

    return { success: true };
  });
