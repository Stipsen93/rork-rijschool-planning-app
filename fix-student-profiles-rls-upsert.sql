-- Fix RLS policies for student_profiles to allow instructor upserts on link request accept
-- Run this in Supabase SQL Editor

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Students can select their student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students can insert their student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students can update their student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Instructors can select their students profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Instructors can insert student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Instructors can insert student_profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Instructors can update their students profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Instructors can update student profiles" ON public.student_profiles;

-- SELECT policies
CREATE POLICY "Students can view own profile"
  ON public.student_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view their students"
  ON public.student_profiles
  FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());

-- INSERT policies
CREATE POLICY "Students can create own profile"
  ON public.student_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND instructor_id IS NOT NULL);

CREATE POLICY "Instructors can create student profiles"
  ON public.student_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'instructor'
    )
  );

-- UPDATE policies
CREATE POLICY "Students can update own profile"
  ON public.student_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can update their students"
  ON public.student_profiles
  FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- DELETE policies (instructors can remove students)
CREATE POLICY "Instructors can delete their students"
  ON public.student_profiles
  FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid());

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'student_profiles'
ORDER BY cmd, policyname;
