-- Fix infinite recursion errors on student_profiles policies
-- Run this in the Supabase SQL editor

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON student_profiles', pol.policyname);
  END LOOP;
END
$$;

CREATE POLICY "Students can select their student profile"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students can insert their student profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update their student profile"
  ON student_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can select their students profiles"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can insert student profiles"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can update their students profiles"
  ON student_profiles FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());
