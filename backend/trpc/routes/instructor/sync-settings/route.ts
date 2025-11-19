import { z } from "zod";
import { instructorProcedure } from "../../../create-context";
import { Database } from "@/types/supabase";

type InstructorProfileUpdate = Database["public"]["Tables"]["instructor_profiles"]["Update"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

type JsonCompatible = Record<string, unknown> | unknown[] | string | number | boolean | null;

const sanitizeJson = <T extends JsonCompatible | undefined>(value: T): T => {
  if (value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value ?? null)) as T;
};

export const syncSettingsProcedure = instructorProcedure
  .input(
    z.object({
      profile: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
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
      }).optional(),
      workingHours: z.any().optional(),
      vacationPeriods: z.array(z.any()).optional(),
      lessonConfig: z.any().optional(),
      products: z.array(z.any()).optional(),
      packages: z.array(z.any()).optional(),
      hourlyRates: z.any().optional(),
      studentConfig: z.any().optional(),
      lessonCard: z.any().optional(),
      notifications: z.any().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    const existingProfileResponse = await ctx.supabase
      .from("instructor_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfileResponse.error) {
      console.error("[syncSettings] Failed to load instructor profile before syncing", existingProfileResponse.error);
      throw new Error("Failed to prepare instructor profile for syncing");
    }

    let instructorRow = existingProfileResponse.data;

    if (!instructorRow) {
      const insertPayload: Database["public"]["Tables"]["instructor_profiles"]["Insert"] = {
        user_id: userId,
        first_name: ctx.profile.first_name,
        last_name: ctx.profile.last_name,
      };

      const insertResponse = await (ctx.supabase.from("instructor_profiles") as any)
        .insert(insertPayload)
        .select("*")
        .single();

      if (insertResponse.error) {
        console.error("[syncSettings] Failed to bootstrap instructor profile", insertResponse.error);
        throw new Error("Failed to initialize instructor profile before syncing");
      }

      instructorRow = insertResponse.data;
    }

    if (!instructorRow) {
      console.error("[syncSettings] Instructor profile row missing after initialization");
      throw new Error("Unable to load instructor profile for syncing");
    }

    const availableColumns = new Set<string>(Object.keys(instructorRow));
    availableColumns.add("synced_at");

    const updateData: InstructorProfileUpdate = {
      synced_at: new Date().toISOString(),
    };

    const profileUpdate: ProfileUpdate = {};

    const assignField = <K extends keyof InstructorProfileUpdate>(field: K, value: InstructorProfileUpdate[K]) => {
      if (value === undefined) {
        return;
      }

      if (!availableColumns.has(field as string)) {
        console.warn(`[syncSettings] Skipping column ${String(field)}; column not present in instructor_profiles`);
        return;
      }

      updateData[field] = value;
    };

    if (input.profile) {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        birthDate,
        instructorNumber,
        certificationNumber,
        drivingSchoolName,
        drivingSchools,
        experienceYears,
        taxId,
        address,
        iban,
        specializations,
      } = input.profile;

      let normalizedFirstName: string | null | undefined;
      if (firstName !== undefined) {
        const trimmedFirstName = firstName.trim();
        normalizedFirstName = trimmedFirstName.length > 0 ? trimmedFirstName : null;
        assignField("first_name", normalizedFirstName);
        profileUpdate.first_name = normalizedFirstName;
      }

      let normalizedLastName: string | null | undefined;
      if (lastName !== undefined) {
        const trimmedLastName = lastName.trim();
        normalizedLastName = trimmedLastName.length > 0 ? trimmedLastName : null;
        assignField("last_name", normalizedLastName);
        profileUpdate.last_name = normalizedLastName;
      }

      if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();
        profileUpdate.email = normalizedEmail.length > 0 ? normalizedEmail : undefined;
      }

      if (phoneNumber !== undefined) {
        const sanitizedPhone = phoneNumber.trim();
        const phoneValue = sanitizedPhone.length > 0 ? sanitizedPhone : null;
        assignField("phone", phoneValue);
        profileUpdate.phone = phoneValue;
      }

      if (birthDate !== undefined) {
        assignField("birth_date", birthDate ?? null);
        profileUpdate.birth_date = birthDate ?? null;
      }

      if (instructorNumber !== undefined) {
        const sanitizedInstructorNumber = instructorNumber.trim();
        assignField("instructor_number", sanitizedInstructorNumber.length > 0 ? sanitizedInstructorNumber : null);
      }

      if (certificationNumber !== undefined) {
        const sanitizedCertification = certificationNumber.trim();
        assignField("wrm_pass_number", sanitizedCertification.length > 0 ? sanitizedCertification : null);
      }

      if (drivingSchoolName !== undefined) {
        const sanitizedDrivingSchoolName = drivingSchoolName.trim();
        assignField(
          "driving_school_name",
          sanitizedDrivingSchoolName.length > 0 ? sanitizedDrivingSchoolName : null,
        );
      }

      if (drivingSchools !== undefined) {
        const sanitizedDrivingSchools = drivingSchools
          .map((school) => school.trim())
          .filter((school) => school.length > 0);
        assignField("driving_school_affiliation", sanitizedDrivingSchools);
      }

      if (experienceYears !== undefined) {
        const trimmedYears = experienceYears.trim();
        const parsedYears = trimmedYears.length > 0 ? Number.parseInt(trimmedYears, 10) : null;
        assignField("years_experience", Number.isNaN(parsedYears) ? null : parsedYears);
      }

      if (taxId !== undefined) {
        const sanitizedTaxId = taxId.trim();
        assignField("tax_id", sanitizedTaxId.length > 0 ? sanitizedTaxId : null);
      }

      if (address !== undefined) {
        const sanitizedAddress = address.trim();
        assignField("business_address", sanitizedAddress.length > 0 ? sanitizedAddress : null);
      }

      if (iban !== undefined) {
        const sanitizedIban = iban.trim();
        assignField("iban", sanitizedIban.length > 0 ? sanitizedIban : null);
      }

      if (specializations !== undefined) {
        const sanitizedSpecializations = specializations
          .map((specialization) => specialization.trim())
          .filter((specialization) => specialization.length > 0);
        assignField("specializations", sanitizedSpecializations);
      }

      if (normalizedFirstName !== undefined || normalizedLastName !== undefined) {
        const finalFirstName = normalizedFirstName !== undefined ? normalizedFirstName : ctx.profile.first_name;
        const finalLastName = normalizedLastName !== undefined ? normalizedLastName : ctx.profile.last_name;
        const nameParts = [finalFirstName, finalLastName]
          .filter((part): part is string => Boolean(part && part.trim().length > 0))
          .map((part) => part.trim());
        profileUpdate.full_name = nameParts.length > 0 ? nameParts.join(" ") : null;
      }
    }

    if (input.workingHours) {
      assignField("working_hours", sanitizeJson(input.workingHours));
    }

    if (input.vacationPeriods) {
      assignField("vacation_periods", sanitizeJson(input.vacationPeriods));
    }

    if (input.lessonConfig) {
      if (input.lessonConfig.baseLessonDuration !== undefined) {
        assignField("base_lesson_duration", input.lessonConfig.baseLessonDuration ?? null);
      }

      if (input.lessonConfig.productDurations !== undefined) {
        assignField("product_durations", sanitizeJson(input.lessonConfig.productDurations ?? {}));
      }

      if (input.lessonConfig.breakBetweenLessons !== undefined) {
        assignField("break_between_lessons", input.lessonConfig.breakBetweenLessons ?? null);
      }

      if (input.lessonConfig.automaticBreaks !== undefined) {
        assignField("automatic_breaks", Boolean(input.lessonConfig.automaticBreaks));
      }

      if (input.lessonConfig.requireConfirmation !== undefined) {
        assignField("require_confirmation", Boolean(input.lessonConfig.requireConfirmation));
      }

      if (input.lessonConfig.cancellationNoticeHours !== undefined) {
        assignField("cancellation_notice_hours", input.lessonConfig.cancellationNoticeHours ?? null);
      }
    }

    if (input.products !== undefined) {
      assignField("products", sanitizeJson(input.products));
    }

    if (input.packages !== undefined) {
      assignField("packages", sanitizeJson(input.packages));
    }

    if (input.hourlyRates) {
      if (input.hourlyRates.price !== undefined) {
        const price = Number.isFinite(input.hourlyRates.price) ? Number(input.hourlyRates.price) : null;
        assignField("hourly_rate", price);
      }

      if (input.hourlyRates.vatStatus !== undefined) {
        assignField("hourly_vat_status", input.hourlyRates.vatStatus ?? null);
      }
    }

    if (input.studentConfig) {
      if (input.studentConfig.maxPerWeek !== undefined) {
        assignField("max_lessons_per_week", input.studentConfig.maxPerWeek ?? null);
      }

      if (input.studentConfig.maxPerDay !== undefined) {
        assignField("max_lessons_per_day", input.studentConfig.maxPerDay ?? null);
      }

      if (input.studentConfig.consecutive !== undefined) {
        assignField("consecutive_lessons", input.studentConfig.consecutive ?? null);
      }

      if (input.studentConfig.advanceDays !== undefined) {
        assignField("advance_booking_days", input.studentConfig.advanceDays ?? null);
      }

      if (input.studentConfig.allowWeekend !== undefined) {
        assignField("allow_weekend_booking", Boolean(input.studentConfig.allowWeekend));
      }

      if (input.studentConfig.requireParentApproval !== undefined) {
        assignField("require_parent_approval", Boolean(input.studentConfig.requireParentApproval));
      }

      if (input.studentConfig.allowStudentCancellation !== undefined) {
        assignField("allow_student_cancellation", Boolean(input.studentConfig.allowStudentCancellation));
      }

      if (input.studentConfig.cancellationHours !== undefined) {
        assignField("student_cancellation_hours", input.studentConfig.cancellationHours ?? null);
      }

      if (input.studentConfig.penaltyLate !== undefined) {
        assignField("late_cancellation_penalty", Boolean(input.studentConfig.penaltyLate));
      }

      if (input.studentConfig.penaltyAmount !== undefined) {
        const penaltyAmount = Number.isFinite(input.studentConfig.penaltyAmount)
          ? Number(input.studentConfig.penaltyAmount)
          : null;
        assignField("penalty_amount", penaltyAmount);
      }

      if (input.studentConfig.requirePaymentBefore !== undefined) {
        assignField("require_prepayment", Boolean(input.studentConfig.requirePaymentBefore));
      }

      if (input.studentConfig.allowPaymentPlans !== undefined) {
        assignField("allow_payment_plans", Boolean(input.studentConfig.allowPaymentPlans));
      }

      if (input.studentConfig.maxUnpaid !== undefined) {
        assignField("max_unpaid_lessons", input.studentConfig.maxUnpaid ?? null);
      }

      if (input.studentConfig.sendReminders !== undefined) {
        assignField("send_reminders", Boolean(input.studentConfig.sendReminders));
      }

      if (input.studentConfig.reminderHours !== undefined) {
        assignField("reminder_hours", input.studentConfig.reminderHours ?? null);
      }

      if (input.studentConfig.sendReports !== undefined) {
        assignField("send_progress_reports", Boolean(input.studentConfig.sendReports));
      }

      if (input.studentConfig.allowDirectContact !== undefined) {
        assignField("allow_direct_contact", Boolean(input.studentConfig.allowDirectContact));
      }
    }

    if (input.lessonCard) {
      if (input.lessonCard.categories !== undefined) {
        assignField("lesson_card_categories", sanitizeJson(input.lessonCard.categories));
      }

      if (input.lessonCard.statusConfig !== undefined) {
        assignField("lesson_card_status_config", sanitizeJson(input.lessonCard.statusConfig));
      }
    }

    if (input.notifications !== undefined) {
      assignField("notification_settings", sanitizeJson(input.notifications));
    }

    const updateResponse = await (ctx.supabase.from("instructor_profiles") as any)
      .update(updateData)
      .eq("user_id", userId);

    if (updateResponse.error) {
      console.error("[syncSettings] Error syncing to Supabase:", updateResponse.error);
      throw new Error(updateResponse.error.message ?? "Failed to sync settings");
    }

    if (Object.keys(profileUpdate).length > 0) {
      const profileResponse = await (ctx.supabase.from("profiles") as any)
        .update(profileUpdate)
        .eq("id", userId);

      if (profileResponse.error) {
        console.error("[syncSettings] Error syncing profile table:", profileResponse.error);
        throw new Error(profileResponse.error.message ?? "Failed to sync profile");
      }
    }

    console.log("[syncSettings] Successfully synced settings to Supabase");

    return { success: true, syncedAt: updateData.synced_at ?? new Date().toISOString() };
  });
