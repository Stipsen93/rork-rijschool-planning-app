-- Allow instructors to INSERT/UPDATE student_profiles for their linked students (needed for upsert on accept)
-- Run this in Supabase SQL Editor

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- INSERT policy (for upsert INSERT path)
DROP POLICY IF EXISTS "Instructors can insert student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Instructors can insert student_profiles" ON public.student_profiles;

CREATE POLICY "Instructors can insert student profiles"
  ON public.student_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.instructor_profiles ip
      WHERE ip.user_id = auth.uid()
    )
  );

-- UPDATE policy (for upsert UPDATE path)
DROP POLICY IF EXISTS "Instructors can update student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Instructors can update their students profiles" ON public.student_profiles;

CREATE POLICY "Instructors can update student profiles"
  ON public.student_profiles
  FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid()
  )
  WITH CHECK (
    instructor_id = auth.uid()
  );

-- Optional: verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'student_profiles'
ORDER BY policyname;
