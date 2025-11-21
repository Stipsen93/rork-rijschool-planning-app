-- Fix missing instructor profile columns
-- Run inside Supabase SQL editor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'first_name'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'last_name'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN last_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN phone TEXT;
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

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'instructor_number'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN instructor_number VARCHAR(7);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'wrm_pass_number'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN wrm_pass_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'driving_school_name'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN driving_school_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'driving_school_affiliation'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN driving_school_affiliation TEXT[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN years_experience INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'tax_id'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN tax_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'business_address'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN business_address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'iban'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN iban TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'specializations'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN specializations TEXT[] DEFAULT '{}'::text[];
  END IF;

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
      AND column_name = 'allow_direct_contact'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN allow_direct_contact BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'instructor_profiles'
      AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE instructor_profiles
    ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;
