-- DrivePlan Complete Database Fix
-- Run this SQL in your Supabase SQL Editor
-- This fixes the user creation issues

-- ========================================
-- STEP 1: Drop and recreate the handle_new_user function with proper field handling
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
  
  -- If instructor, create instructor profile
  IF user_role_val = 'instructor' THEN
    INSERT INTO public.instructor_profiles (user_id, first_name, last_name, rating, total_lessons)
    VALUES (
      NEW.id,
      first_name_val,
      last_name_val,
      0,
      0
    );
  END IF;
  
  -- If student, create student profile
  IF user_role_val = 'student' THEN
    INSERT INTO public.student_profiles (user_id, lesson_streak, total_lessons_completed, hours_driven, overall_progress)
    VALUES (
      NEW.id,
      0,
      0,
      0,
      0
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 2: Add INSERT policies for profiles (if user creation happens outside trigger)
-- ========================================

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Instructors can insert their own instructor profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Students can insert their own student profile" ON student_profiles;

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

-- Allow students to insert their own student profile
CREATE POLICY "Students can insert their own student profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ========================================
-- STEP 3: Test the setup
-- ========================================

-- You can now test by creating a user through the app
-- The trigger should automatically:
-- 1. Create a profile with first_name and last_name in full_name
-- 2. Create instructor_profiles or student_profiles based on role
-- 3. Store first_name and last_name in instructor_profiles

-- ========================================
-- OPTIONAL: Clean up any orphaned auth users without profiles
-- ========================================

-- First, let's see if there are any orphaned users (uncomment to check):
-- SELECT u.id, u.email, u.created_at
-- FROM auth.users u
-- LEFT JOIN profiles p ON u.id = p.id
-- WHERE p.id IS NULL;

-- If you want to delete orphaned auth users (BE CAREFUL - this deletes users!):
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
