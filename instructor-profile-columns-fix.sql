-- Fix missing instructor profile columns
-- Run inside Supabase SQL editor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'advance_booking_days'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN advance_booking_days INTEGER DEFAULT 7;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN birth_date DATE;
  END IF;
END $$;
