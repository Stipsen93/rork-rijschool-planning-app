-- Fix missing profile + instructor profile columns used by the app
-- Run inside the Supabase SQL editor (idempotent)
DO $$
BEGIN
  -- Profiles table requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN full_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN last_name TEXT;
  END IF;

  -- Instructor profile baseline columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN last_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN birth_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'instructor_number'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN instructor_number VARCHAR(7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'wrm_pass_number'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN wrm_pass_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'driving_school_name'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN driving_school_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'driving_school_affiliation'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN driving_school_affiliation TEXT[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN years_experience INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'tax_id'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN tax_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'business_address'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN business_address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'iban'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN iban TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'specializations'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN specializations TEXT[] DEFAULT '{}'::text[];
  END IF;

  -- Scheduling & configuration columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'working_hours'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN working_hours JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'vacation_periods'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN vacation_periods JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'base_lesson_duration'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN base_lesson_duration INTEGER DEFAULT 60;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'product_durations'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN product_durations JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'break_between_lessons'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN break_between_lessons INTEGER DEFAULT 15;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'automatic_breaks'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN automatic_breaks BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'require_confirmation'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN require_confirmation BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'cancellation_notice_hours'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN cancellation_notice_hours INTEGER DEFAULT 24;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'products'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN products JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'packages'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN packages JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN hourly_rate DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'hourly_vat_status'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN hourly_vat_status TEXT DEFAULT 'incl';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'max_lessons_per_week'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN max_lessons_per_week INTEGER DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'max_lessons_per_day'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN max_lessons_per_day INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'consecutive_lessons'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN consecutive_lessons INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'advance_booking_days'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN advance_booking_days INTEGER DEFAULT 7;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'allow_weekend_booking'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN allow_weekend_booking BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'require_parent_approval'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN require_parent_approval BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'allow_student_cancellation'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN allow_student_cancellation BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'student_cancellation_hours'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN student_cancellation_hours INTEGER DEFAULT 24;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'late_cancellation_penalty'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN late_cancellation_penalty BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'penalty_amount'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN penalty_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'require_prepayment'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN require_prepayment BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'allow_payment_plans'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN allow_payment_plans BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'max_unpaid_lessons'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN max_unpaid_lessons INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'send_reminders'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN send_reminders BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'reminder_hours'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN reminder_hours INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'send_progress_reports'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN send_progress_reports BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'allow_direct_contact'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN allow_direct_contact BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'lesson_card_categories'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN lesson_card_categories JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'lesson_card_status_config'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN lesson_card_status_config JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'notification_settings'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN notification_settings JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instructor_profiles' AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE instructor_profiles ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Ensure unique constraint on instructor_number for new installs
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'instructor_profiles_instructor_number_key'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD CONSTRAINT instructor_profiles_instructor_number_key UNIQUE (instructor_number);
  END IF;
END $$;
