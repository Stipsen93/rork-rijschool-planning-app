-- Complete SQL schema for student personal information
-- Run this in your Supabase SQL Editor

-- Add columns to student_profiles table if they don't exist
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Students can insert their own profile" ON student_profiles;

-- Add INSERT policy for student_profiles
-- This is the missing policy that was causing the authentication error
CREATE POLICY "Students can insert their own profile"
  ON student_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Ensure the UPDATE policy is correct
DROP POLICY IF EXISTS "Students can update their own profile" ON student_profiles;

CREATE POLICY "Students can update their own profile"
  ON student_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Ensure the SELECT policy is correct
DROP POLICY IF EXISTS "Students can view their own profile" ON student_profiles;

CREATE POLICY "Students can view their own profile"
  ON student_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE student_profiles IS 'Extended profile information for students including personal details and parent/guardian contact information';
COMMENT ON COLUMN student_profiles.first_name IS 'Student first name';
COMMENT ON COLUMN student_profiles.last_name IS 'Student last name';
COMMENT ON COLUMN student_profiles.birth_date IS 'Student date of birth';
COMMENT ON COLUMN student_profiles.address IS 'Student home address';
COMMENT ON COLUMN student_profiles.parent_name IS 'Name of parent or contact person';
COMMENT ON COLUMN student_profiles.parent_phone IS 'Phone number of parent or contact person';

-- Create a function to automatically create a student_profile when a student user is created
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create student_profiles for users with role 'student'
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_student_profile_created ON profiles;

-- Create trigger to automatically create student_profile for new student users
CREATE TRIGGER on_student_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW 
  WHEN (NEW.role = 'student')
  EXECUTE FUNCTION public.handle_new_student_user();

-- Verify the setup by checking policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'student_profiles'
ORDER BY policyname;
