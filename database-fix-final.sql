-- Complete Database Fix for User Registration
-- This fixes the "Database error saving new user" issue

-- ========================================
-- STEP 1: Drop and recreate the trigger and function
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role_val user_role;
  first_name_val TEXT;
  last_name_val TEXT;
  full_name_val TEXT;
BEGIN
  -- Log the start
  RAISE LOG 'handle_new_user triggered for user %', NEW.id;
  
  -- Get role from metadata, default to 'student'
  user_role_val := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student');
  RAISE LOG 'User role: %', user_role_val;
  
  -- Get first and last name
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  
  -- Build full name
  full_name_val := TRIM(first_name_val || ' ' || last_name_val);
  IF full_name_val = '' THEN
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  END IF;
  
  RAISE LOG 'Creating profile for user % with name %', NEW.id, full_name_val;
  
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
  
  RAISE LOG 'Profile created successfully';
  
  -- If instructor, create instructor profile
  IF user_role_val = 'instructor' THEN
    RAISE LOG 'Creating instructor profile';
    INSERT INTO public.instructor_profiles (user_id, rating, total_lessons)
    VALUES (
      NEW.id,
      0,
      0
    );
    RAISE LOG 'Instructor profile created successfully';
  END IF;
  
  -- If student, create student profile
  IF user_role_val = 'student' THEN
    RAISE LOG 'Creating student profile';
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
    RAISE LOG 'Student profile created successfully';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error information
    RAISE LOG 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
    RAISE LOG 'Error detail: %', SQLSTATE;
    -- Re-raise to make signup fail visibly
    RAISE EXCEPTION 'Failed to create user profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 2: Verify table structure and constraints
-- ========================================

-- Check if profiles table exists and has correct structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'profiles table does not exist';
  END IF;
END $$;

-- Check if instructor_profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'instructor_profiles'
  ) THEN
    RAISE EXCEPTION 'instructor_profiles table does not exist';
  END IF;
END $$;

-- Check if student_profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'student_profiles'
  ) THEN
    RAISE EXCEPTION 'student_profiles table does not exist';
  END IF;
END $$;

-- ========================================
-- STEP 3: Ensure RLS policies are correct
-- ========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Instructors can view their own instructor profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Instructors can insert their own instructor profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Instructors can update their own instructor profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Service role can insert instructor profiles" ON instructor_profiles;

DROP POLICY IF EXISTS "Students can view their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can insert their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can update their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Service role can insert student profiles" ON student_profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Instructor profiles policies
CREATE POLICY "Instructors can view their own instructor profile"
  ON instructor_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can insert their own instructor profile"
  ON instructor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can update their own instructor profile"
  ON instructor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert instructor profiles"
  ON instructor_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Student profiles policies
CREATE POLICY "Students can view their own student profile"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students can insert their own student profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update their own student profile"
  ON student_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert student profiles"
  ON student_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ========================================
-- STEP 4: Grant necessary permissions
-- ========================================

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on tables
GRANT ALL ON profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

GRANT ALL ON instructor_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON instructor_profiles TO authenticated;

GRANT ALL ON student_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON student_profiles TO authenticated;

-- ========================================
-- STEP 5: Test the setup
-- ========================================

-- Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT 
  proname as function_name,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- You should now be able to create new users.
-- If errors still occur, check the Supabase logs for detailed error messages.
