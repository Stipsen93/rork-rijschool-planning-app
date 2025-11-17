import { protectedProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const fetchSettingsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.id;

  const { data, error } = await supabase
    .from("instructor_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[fetchSettings] Error fetching from Supabase:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    profile: {
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      phoneNumber: data.phone || "",
      birthDate: data.birth_date || null,
      instructorNumber: data.instructor_number || "",
      certificationNumber: data.wrm_pass_number || "",
      drivingSchoolName: data.driving_school_name || "",
      drivingSchools: data.driving_school_affiliation || [],
      experienceYears: data.years_experience?.toString() || "",
      taxId: data.tax_id || "",
      address: data.business_address || "",
      iban: data.iban || "",
      specializations: data.specializations || [],
    },
    workingHours: data.working_hours,
    vacationPeriods: data.vacation_periods || [],
    lessonConfig: {
      baseLessonDuration: data.base_lesson_duration || 60,
      productDurations: data.product_durations || {},
      breakBetweenLessons: data.break_between_lessons || 15,
      automaticBreaks: data.automatic_breaks || false,
      requireConfirmation: data.require_confirmation || true,
      cancellationNoticeHours: data.cancellation_notice_hours || 24,
    },
    products: data.products || [],
    packages: data.packages || [],
    hourlyRates: {
      price: data.hourly_rate || 0,
      vatStatus: data.hourly_vat_status || "incl",
    },
    studentConfig: {
      maxPerWeek: data.max_lessons_per_week || 3,
      maxPerDay: data.max_lessons_per_day || 2,
      consecutive: data.consecutive_lessons || 1,
      advanceDays: data.advance_booking_days || 7,
      allowWeekend: data.allow_weekend_booking ?? true,
      requireParentApproval: data.require_parent_approval ?? false,
      allowStudentCancellation: data.allow_student_cancellation ?? true,
      cancellationHours: data.student_cancellation_hours || 24,
      penaltyLate: data.late_cancellation_penalty ?? false,
      penaltyAmount: data.penalty_amount || 0,
      requirePaymentBefore: data.require_prepayment ?? false,
      allowPaymentPlans: data.allow_payment_plans ?? true,
      maxUnpaid: data.max_unpaid_lessons || 2,
      sendReminders: data.send_reminders ?? true,
      reminderHours: data.reminder_hours || 2,
      sendReports: data.send_progress_reports ?? true,
      allowDirectContact: data.allow_direct_contact ?? true,
    },
    lessonCard: {
      categories: data.lesson_card_categories || [],
      statusConfig: data.lesson_card_status_config || [],
    },
    notifications: data.notification_settings || null,
    syncedAt: data.synced_at,
  };
});
