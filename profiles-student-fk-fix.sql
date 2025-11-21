-- Fix foreign key constraint on profiles to allow instructor-created student records
-- Run this script in Supabase after deploying

-- Remove the strict FK requirement to auth.users so instructors can add internal-only students
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ensure newly inserted records (like manually created students) can generate their own IDs when none provided
ALTER TABLE profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Keep data integrity by ensuring instructor-created profiles still mark the role as student
-- (validation handled in TRPC + RLS policy "Instructors can insert student profiles")
