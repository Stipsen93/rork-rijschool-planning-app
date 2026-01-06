import { instructorProcedure } from "../../../../create-context";

export const getInstructorProfileProcedure = instructorProcedure.query(async ({ ctx }) => {
  const ip = ctx.instructorProfile as any;

  console.log("[instructor.getProfile] user=", ctx.user.id);

  return {
    profile: {
      firstName: (ip?.first_name as string | null) ?? "",
      lastName: (ip?.last_name as string | null) ?? "",
      email: (ctx.profile?.email as string | null) ?? "",
      phoneNumber: (ip?.phone as string | null) ?? "",
      certificationNumber: (ip?.wrm_pass_number as string | null) ?? "",
      drivingSchoolName: (ip?.driving_school_name as string | null) ?? "",
      drivingSchools: Array.isArray(ip?.driving_school_affiliation)
        ? (ip.driving_school_affiliation as unknown[]).filter((v): v is string => typeof v === "string")
        : [],
      birthDate: (ip?.birth_date as string | null) ?? null,
      instructorNumber: (ip?.instructor_number as string | null) ?? "",
      experienceYears:
        ip?.years_experience !== null && ip?.years_experience !== undefined
          ? String(ip.years_experience)
          : "",
      taxId: (ip?.tax_id as string | null) ?? "",
      address: (ip?.business_address as string | null) ?? "",
      iban: (ip?.iban as string | null) ?? "",
      specializations: Array.isArray(ip?.specializations)
        ? (ip.specializations as unknown[]).filter((v): v is string => typeof v === "string")
        : [],
      profileImageUrl: (ip?.profile_image_url as string | null) ?? null,
    },
    syncedAt: (ip?.synced_at as string | null) ?? null,
  };
});
