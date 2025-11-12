-- Add fields to student_profiles table for personal information
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- Add comment to table
COMMENT ON TABLE student_profiles IS 'Extended profile information for students';
COMMENT ON COLUMN student_profiles.first_name IS 'Student first name';
COMMENT ON COLUMN student_profiles.last_name IS 'Student last name';
COMMENT ON COLUMN student_profiles.birth_date IS 'Student date of birth';
COMMENT ON COLUMN student_profiles.address IS 'Student home address';
COMMENT ON COLUMN student_profiles.parent_name IS 'Name of parent or contact person';
COMMENT ON COLUMN student_profiles.parent_phone IS 'Phone number of parent or contact person';
