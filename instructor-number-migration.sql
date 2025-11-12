-- Add instructor_number to instructor_profiles table
ALTER TABLE instructor_profiles 
ADD COLUMN IF NOT EXISTS instructor_number TEXT;

-- Function to generate unique 7-digit instructor number
CREATE OR REPLACE FUNCTION generate_instructor_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 7-digit number
    new_number := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    
    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM instructor_profiles WHERE instructor_number = new_number) INTO number_exists;
    
    -- If unique, return it
    IF NOT number_exists THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to set instructor number before insert
CREATE OR REPLACE FUNCTION set_instructor_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.instructor_number IS NULL OR NEW.instructor_number = '' THEN
    NEW.instructor_number := generate_instructor_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS set_instructor_number_trigger ON instructor_profiles;

-- Create trigger to auto-generate instructor number
CREATE TRIGGER set_instructor_number_trigger
  BEFORE INSERT ON instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_instructor_number();

-- Add unique constraint to ensure no duplicates
ALTER TABLE instructor_profiles
ADD CONSTRAINT instructor_number_unique UNIQUE (instructor_number);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_instructor_number ON instructor_profiles(instructor_number);

-- Update existing records with instructor numbers (if any exist without one)
UPDATE instructor_profiles
SET instructor_number = generate_instructor_number()
WHERE instructor_number IS NULL OR instructor_number = '';
