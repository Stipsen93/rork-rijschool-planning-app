import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const syncSettingsProcedure = protectedProcedure
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

    if (input.profile) {
      updateData.first_name = input.profile.firstName;
      updateData.last_name = input.profile.lastName;
      updateData.phone = input.profile.phoneNumber;
      updateData.birth_date = input.profile.birthDate;
      updateData.wrm_pass_number = input.profile.certificationNumber;
      updateData.driving_school_name = input.profile.drivingSchoolName;
      updateData.driving_school_affiliation = input.profile.drivingSchools;
      updateData.years_experience = input.profile.experienceYears
        ? parseInt(input.profile.experienceYears, 10)
        : null;
      updateData.tax_id = input.profile.taxId;
      updateData.business_address = input.profile.address;
      updateData.iban = input.profile.iban;
      updateData.specializations = input.profile.specializations;
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
    
    const { error } = response;

    if (error) {
      console.error("[syncSettings] Error syncing to Supabase:", error);
      throw new Error("Failed to sync settings");
    }

    console.log("[syncSettings] Successfully synced settings to Supabase");

    return { success: true, syncedAt: updateData.synced_at };
  });
