import { z } from "zod";
import { instructorProcedure } from "../../../../create-context";

export const updateInstructorProfileProcedure = instructorProcedure
  .input(
    z.object({
      profile: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phoneNumber: z.string().optional(),
        birthDate: z.string().nullable().optional(),
        instructorNumber: z.string().optional(),
        certificationNumber: z.string().optional(),
        drivingSchoolName: z.string().optional(),
        drivingSchools: z.array(z.string()).optional(),
        experienceYears: z.string().optional(),
        taxId: z.string().optional(),
        address: z.string().optional(),
        iban: z.string().optional(),
        specializations: z.array(z.string()).optional(),
        profileImageUrl: z.string().nullable().optional(),
      }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    console.log("[instructor.updateProfile] user=", userId);

    const p = input.profile;

    const updateData: Record<string, unknown> = {
      synced_at: new Date().toISOString(),
    };

    if (p.firstName !== undefined) updateData.first_name = p.firstName.trim() || null;
    if (p.lastName !== undefined) updateData.last_name = p.lastName.trim() || null;
    if (p.phoneNumber !== undefined) updateData.phone = p.phoneNumber.trim() || null;
    if (p.birthDate !== undefined) updateData.birth_date = p.birthDate ?? null;
    if (p.instructorNumber !== undefined) updateData.instructor_number = p.instructorNumber.trim() || null;
    if (p.certificationNumber !== undefined) updateData.wrm_pass_number = p.certificationNumber.trim() || null;
    if (p.drivingSchoolName !== undefined) updateData.driving_school_name = p.drivingSchoolName.trim() || null;
    if (p.drivingSchools !== undefined) {
      updateData.driving_school_affiliation = p.drivingSchools.map((s) => s.trim()).filter((s) => s.length > 0);
    }
    if (p.experienceYears !== undefined) {
      const parsed = p.experienceYears.trim().length > 0 ? parseInt(p.experienceYears.trim(), 10) : null;
      updateData.years_experience = Number.isNaN(parsed as any) ? null : parsed;
    }
    if (p.taxId !== undefined) updateData.tax_id = p.taxId.trim() || null;
    if (p.address !== undefined) updateData.business_address = p.address.trim() || null;
    if (p.iban !== undefined) updateData.iban = p.iban.trim() || null;
    if (p.specializations !== undefined) {
      updateData.specializations = p.specializations.map((s) => s.trim()).filter((s) => s.length > 0);
    }
    if (p.profileImageUrl !== undefined) updateData.profile_image_url = p.profileImageUrl;

    const { error } = await (ctx.supabase as any)
      .from("instructor_profiles")
      .update(updateData)
      .eq("user_id", userId);

    if (error) {
      console.error("[instructor.updateProfile] update error:", error);
      throw new Error(error.message ?? "Failed to update profile");
    }

    const { data: updated, error: fetchError } = await (ctx.supabase as any)
      .from("instructor_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("[instructor.updateProfile] fetch error:", fetchError);
      throw new Error(fetchError.message ?? "Failed to fetch updated profile");
    }

    return { success: true, profile: updated };
  });
