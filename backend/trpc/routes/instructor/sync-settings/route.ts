import { z } from "zod";
import { instructorProcedure } from "../../../create-context";

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

    const updateData: Record<string, any> = {
      synced_at: new Date().toISOString(),
    };

    const profileUpdate: Record<string, any> = {};

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
        updateData.first_name = normalizedFirstName;
        profileUpdate.first_name = normalizedFirstName;
      }

      let normalizedLastName: string | null | undefined;
      if (lastName !== undefined) {
        const trimmedLastName = lastName.trim();
        normalizedLastName = trimmedLastName.length > 0 ? trimmedLastName : null;
        updateData.last_name = normalizedLastName;
        profileUpdate.last_name = normalizedLastName;
      }

      if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();
        profileUpdate.email = normalizedEmail.length > 0 ? normalizedEmail : null;
      }

      if (phoneNumber !== undefined) {
        const sanitizedPhone = phoneNumber.trim();
        const phoneValue = sanitizedPhone.length > 0 ? sanitizedPhone : null;
        updateData.phone = phoneValue;
        profileUpdate.phone = phoneValue;
      }

      if (birthDate !== undefined) {
        updateData.birth_date = birthDate ?? null;
        profileUpdate.birth_date = birthDate ?? null;
      }

      if (instructorNumber !== undefined) {
        const sanitizedInstructorNumber = instructorNumber.trim();
        updateData.instructor_number = sanitizedInstructorNumber.length > 0 ? sanitizedInstructorNumber : null;
      }

      if (certificationNumber !== undefined) {
        const sanitizedCertification = certificationNumber.trim();
        updateData.wrm_pass_number = sanitizedCertification.length > 0 ? sanitizedCertification : null;
      }

      if (drivingSchoolName !== undefined) {
        const sanitizedDrivingSchoolName = drivingSchoolName.trim();
        updateData.driving_school_name =
          sanitizedDrivingSchoolName.length > 0 ? sanitizedDrivingSchoolName : null;
      }

      if (drivingSchools !== undefined) {
        const sanitizedDrivingSchools = drivingSchools
          .map((school) => school.trim())
          .filter((school) => school.length > 0);
        updateData.driving_school_affiliation = sanitizedDrivingSchools;
      }

      if (experienceYears !== undefined) {
        const trimmedYears = experienceYears.trim();
        const parsedYears = trimmedYears.length > 0 ? parseInt(trimmedYears, 10) : null;
        updateData.years_experience = Number.isNaN(parsedYears) ? null : parsedYears;
      }

      if (taxId !== undefined) {
        const sanitizedTaxId = taxId.trim();
        updateData.tax_id = sanitizedTaxId.length > 0 ? sanitizedTaxId : null;
      }

      if (address !== undefined) {
        const sanitizedAddress = address.trim();
        updateData.business_address = sanitizedAddress.length > 0 ? sanitizedAddress : null;
      }

      if (iban !== undefined) {
        const sanitizedIban = iban.trim();
        updateData.iban = sanitizedIban.length > 0 ? sanitizedIban : null;
      }

      if (specializations !== undefined) {
        const sanitizedSpecializations = specializations
          .map((specialization) => specialization.trim())
          .filter((specialization) => specialization.length > 0);
        updateData.specializations = sanitizedSpecializations;
      }

      if (normalizedFirstName !== undefined || normalizedLastName !== undefined) {
        const finalFirstName =
          normalizedFirstName !== undefined ? normalizedFirstName : ctx.profile.first_name;
        const finalLastName = normalizedLastName !== undefined ? normalizedLastName : ctx.profile.last_name;
        const nameParts = [finalFirstName, finalLastName]
          .filter((part): part is string => Boolean(part && part.trim().length > 0))
          .map((part) => part.trim());
        profileUpdate.full_name = nameParts.length > 0 ? nameParts.join(" ") : null;
      }
    }

    if (input.workingHours) {
      updateData.working_hours = input.workingHours;
    }

    if (input.vacationPeriods) {
      updateData.vacation_periods = input.vacationPeriods;
    }

    if (input.lessonConfig) {
      updateData.base_lesson_duration = input.lessonConfig.baseLessonDuration;
      updateData.product_durations = input.lessonConfig.productDurations;
      updateData.break_between_lessons = input.lessonConfig.breakBetweenLessons;
      updateData.automatic_breaks = input.lessonConfig.automaticBreaks;
      updateData.require_confirmation = input.lessonConfig.requireConfirmation;
      updateData.cancellation_notice_hours = input.lessonConfig.cancellationNoticeHours;
    }

    if (input.products) {
      updateData.products = input.products;
    }

    if (input.packages) {
      updateData.packages = input.packages;
    }

    if (input.hourlyRates) {
      updateData.hourly_rate = input.hourlyRates.price;
      updateData.hourly_vat_status = input.hourlyRates.vatStatus;
    }

    if (input.studentConfig) {
      updateData.max_lessons_per_week = input.studentConfig.maxPerWeek;
      updateData.max_lessons_per_day = input.studentConfig.maxPerDay;
      updateData.consecutive_lessons = input.studentConfig.consecutive;
      updateData.advance_booking_days = input.studentConfig.advanceDays;
      updateData.allow_weekend_booking = input.studentConfig.allowWeekend;
      updateData.require_parent_approval = input.studentConfig.requireParentApproval;
      updateData.allow_student_cancellation = input.studentConfig.allowStudentCancellation;
      updateData.student_cancellation_hours = input.studentConfig.cancellationHours;
      updateData.late_cancellation_penalty = input.studentConfig.penaltyLate;
      updateData.penalty_amount = input.studentConfig.penaltyAmount;
      updateData.require_prepayment = input.studentConfig.requirePaymentBefore;
      updateData.allow_payment_plans = input.studentConfig.allowPaymentPlans;
      updateData.max_unpaid_lessons = input.studentConfig.maxUnpaid;
      updateData.send_reminders = input.studentConfig.sendReminders;
      updateData.reminder_hours = input.studentConfig.reminderHours;
      updateData.send_progress_reports = input.studentConfig.sendReports;
      updateData.allow_direct_contact = input.studentConfig.allowDirectContact;
    }

    if (input.lessonCard) {
      updateData.lesson_card_categories = input.lessonCard.categories;
      updateData.lesson_card_status_config = input.lessonCard.statusConfig;
    }

    if (input.notifications) {
      updateData.notification_settings = input.notifications;
    }

    const response: any = await (ctx.supabase as any)
      .from("instructor_profiles")
      .update(updateData)
      .eq("user_id", userId);
    
    const { error: instructorError } = response;

    if (instructorError) {
      console.error("[syncSettings] Error syncing to Supabase:", instructorError);
      throw new Error("Failed to sync settings");
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await (ctx.supabase.from("profiles") as any)
        .update(profileUpdate)
        .eq("id", userId);

      if (profileError) {
        console.error("[syncSettings] Error syncing profile table:", profileError);
        throw new Error("Failed to sync profile");
      }
    }

    console.log("[syncSettings] Successfully synced settings to Supabase");

    return { success: true, syncedAt: updateData.synced_at };
  });
