import { instructorProcedure } from "../../../create-context";

export const fetchSettingsProcedure = instructorProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.id;

  const response: any = await ctx.supabase
    .from("instructor_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data, error } = response;

  if (error) {
    console.error("[fetchSettings] Error fetching from Supabase:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const profileData = data as any;

  return {
    profile: {
      firstName: profileData.first_name || "",
      lastName: profileData.last_name || "",
      phoneNumber: profileData.phone || "",
      birthDate: profileData.birth_date || null,
      instructorNumber: profileData.instructor_number || "",
      certificationNumber: profileData.wrm_pass_number || "",
      drivingSchoolName: profileData.driving_school_name || "",
      drivingSchools: profileData.driving_school_affiliation || [],
      experienceYears: profileData.years_experience?.toString() || "",
      taxId: profileData.tax_id || "",
      address: profileData.business_address || "",
      iban: profileData.iban || "",
      specializations: profileData.specializations || [],
    },
    workingHours: profileData.working_hours,
    vacationPeriods: profileData.vacation_periods || [],
    lessonConfig: {
      baseLessonDuration: profileData.base_lesson_duration || 60,
      productDurations: profileData.product_durations || {},
      breakBetweenLessons: profileData.break_between_lessons || 15,
      automaticBreaks: profileData.automatic_breaks || false,
      requireConfirmation: profileData.require_confirmation || true,
      cancellationNoticeHours: profileData.cancellation_notice_hours || 24,
    },
    products: profileData.products || [],
    packages: profileData.packages || [],
    hourlyRates: {
      price: profileData.hourly_rate || 0,
      vatStatus: profileData.hourly_vat_status || "incl",
    },
    studentConfig: {
      maxPerWeek: profileData.max_lessons_per_week || 3,
      maxPerDay: profileData.max_lessons_per_day || 2,
      consecutive: profileData.consecutive_lessons || 1,
      advanceDays: profileData.advance_booking_days || 7,
      allowWeekend: profileData.allow_weekend_booking ?? true,
      requireParentApproval: profileData.require_parent_approval ?? false,
      allowStudentCancellation: profileData.allow_student_cancellation ?? true,
      cancellationHours: profileData.student_cancellation_hours || 24,
      penaltyLate: profileData.late_cancellation_penalty ?? false,
      penaltyAmount: profileData.penalty_amount || 0,
      requirePaymentBefore: profileData.require_prepayment ?? false,
      allowPaymentPlans: profileData.allow_payment_plans ?? true,
      maxUnpaid: profileData.max_unpaid_lessons || 2,
      sendReminders: profileData.send_reminders ?? true,
      reminderHours: profileData.reminder_hours || 2,
      sendReports: profileData.send_progress_reports ?? true,
      allowDirectContact: profileData.allow_direct_contact ?? true,
    },
    lessonCard: {
      categories: profileData.lesson_card_categories || [],
      statusConfig: profileData.lesson_card_status_config || [],
    },
    notifications: profileData.notification_settings || null,
    syncedAt: profileData.synced_at,
  };
});
