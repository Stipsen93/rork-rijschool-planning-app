-- Fix for function return type error
-- Drop existing function and recreate with correct signature

-- Drop the existing function first
DROP FUNCTION IF EXISTS generate_instructor_number();

-- Recreate the function with TEXT return type
CREATE OR REPLACE FUNCTION generate_instructor_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-digit number
    new_number := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Check if number already exists
    SELECT EXISTS(
      SELECT 1 FROM instructor_profiles WHERE instructor_number = new_number
    ) INTO number_exists;
    
    -- If number doesn't exist, return it
    IF NOT number_exists THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger function as well
DROP FUNCTION IF EXISTS auto_generate_instructor_number() CASCADE;

CREATE OR REPLACE FUNCTION auto_generate_instructor_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.instructor_number IS NULL OR NEW.instructor_number = '' THEN
    NEW.instructor_number := generate_instructor_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS ensure_instructor_number ON instructor_profiles;
CREATE TRIGGER ensure_instructor_number
  BEFORE INSERT ON instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_instructor_number();

-- Update all instructors without an instructor number
UPDATE instructor_profiles
SET instructor_number = generate_instructor_number()
WHERE instructor_number IS NULL OR instructor_number = '';

-- Ensure instructor_number is NOT NULL and unique
ALTER TABLE instructor_profiles 
  ALTER COLUMN instructor_number SET NOT NULL;

-- Add constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'instructor_profiles_instructor_number_key'
  ) THEN
    ALTER TABLE instructor_profiles 
      ADD CONSTRAINT instructor_profiles_instructor_number_key UNIQUE (instructor_number);
  END IF;
END $$;
