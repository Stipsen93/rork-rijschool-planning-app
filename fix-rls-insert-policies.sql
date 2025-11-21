-- Fix RLS INSERT policies for profiles and student_profiles
-- This allows instructors to create student profiles
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Instructors can insert student profiles" ON profiles;
DROP POLICY IF EXISTS "Instructors can insert student_profiles" ON student_profiles;

-- Allow instructors to insert new profiles for students they are creating
CREATE POLICY "Instructors can insert student profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    role = 'student' AND
    EXISTS (
      SELECT 1 FROM instructor_profiles
      WHERE instructor_profiles.user_id = auth.uid()
    )
  );

-- Allow instructors to insert new student_profiles for their students
CREATE POLICY "Instructors can insert student_profiles"
  ON student_profiles FOR INSERT
  WITH CHECK (
    instructor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM instructor_profiles
      WHERE instructor_profiles.user_id = auth.uid()
    )
  );
