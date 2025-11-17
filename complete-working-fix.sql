-- DrivePlan Complete Working Database Fix
-- Run this SQL in your Supabase SQL Editor
-- This properly fixes the user creation issues

-- ========================================
-- STEP 1: Drop and recreate the handle_new_user function
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val user_role;
  first_name_val TEXT;
  last_name_val TEXT;
  full_name_val TEXT;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role_val := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student');
  
  -- Get first and last name
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  
  -- Build full name
  full_name_val := TRIM(first_name_val || ' ' || last_name_val);
  IF full_name_val = '' THEN
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  END IF;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role, phone, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    full_name_val,
    user_role_val,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    true
  );
  
  -- If instructor, create instructor profile (WITHOUT first_name/last_name as they don't exist in this table)
  IF user_role_val = 'instructor' THEN
    INSERT INTO public.instructor_profiles (user_id, rating, total_lessons)
    VALUES (
      NEW.id,
      0,
      0
    );
  END IF;
  
  -- If student, create student profile (WITH first_name/last_name as they DO exist in this table)
  IF user_role_val = 'student' THEN
    INSERT INTO public.student_profiles (
      user_id, 
      first_name, 
      last_name, 
      lesson_streak, 
      total_lessons_completed, 
      hours_driven, 
      overall_progress
    )
    VALUES (
      NEW.id,
      first_name_val,
      last_name_val,
      0,
      0,
      0,
      0
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and raise it to see in Supabase logs
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
    -- Re-raise the error so signup fails visibly
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 2: Ensure proper INSERT policies exist
-- ========================================

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Instructors can insert their own instructor profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Service role can insert instructor profiles" ON instructor_profiles;
DROP POLICY IF EXISTS "Students can insert their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Service role can insert student profiles" ON student_profiles;

-- Allow authenticated users to insert their own profile (backup mechanism)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service role to insert profiles (for trigger)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow instructors to insert their own instructor profile
CREATE POLICY "Instructors can insert their own instructor profile"
  ON instructor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow service role to insert instructor profiles (for trigger)
CREATE POLICY "Service role can insert instructor profiles"
  ON instructor_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow students to insert their own student profile
CREATE POLICY "Students can insert their own student profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow service role to insert student profiles (for trigger)
CREATE POLICY "Service role can insert student profiles"
  ON student_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ========================================
-- STEP 3: Verify the setup
-- ========================================

-- Check if the trigger was created successfully
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- ========================================
-- OPTIONAL: Clean up orphaned auth users
-- ========================================

-- First, check for orphaned users (users without profiles):
-- SELECT u.id, u.email, u.created_at
-- FROM auth.users u
-- LEFT JOIN profiles p ON u.id = p.id
-- WHERE p.id IS NULL;

-- If you want to delete orphaned auth users, uncomment and run:
-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT u.id
--   FROM auth.users u
--   LEFT JOIN profiles p ON u.id = p.id
--   WHERE p.id IS NULL
-- );

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- You can now test by creating a new user through the signup flow.
-- The trigger should automatically:
-- 1. Create a profile with full_name from first_name + last_name
-- 2. Create instructor_profiles (for instructors) without first_name/last_name
-- 3. Create student_profiles (for students) with first_name/last_name
