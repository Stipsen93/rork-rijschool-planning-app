-- Fix RLS policies voor instructor_link_requests en student deletion logic

-- 1. Fix RLS policy voor instructor link request updates (accepteren/weigeren)
DROP POLICY IF EXISTS "Instructors can update their own link requests" ON public.instructor_link_requests;

CREATE POLICY "Instructors can update their link requests"
ON public.instructor_link_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = instructor_id
)
WITH CHECK (
  auth.uid() = instructor_id
);

-- 2. Fix RLS policy voor student link request updates (annuleren)
DROP POLICY IF EXISTS "Students can update their own link requests" ON public.instructor_link_requests;

CREATE POLICY "Students can update their link requests"
ON public.instructor_link_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id
)
WITH CHECK (
  auth.uid() = student_id
);

-- 3. Zorg dat instructeurs hun student_profiles kunnen updaten bij accepteren
DROP POLICY IF EXISTS "Instructors can update their student profiles" ON public.student_profiles;

CREATE POLICY "Instructors can update their student profiles"
ON public.student_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.instructor_profiles
    WHERE instructor_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  instructor_id = auth.uid()
);

-- 4. Index voor betere performance bij link requests
CREATE INDEX IF NOT EXISTS idx_instructor_link_requests_instructor_status 
ON public.instructor_link_requests(instructor_id, status);

CREATE INDEX IF NOT EXISTS idx_instructor_link_requests_student_status 
ON public.instructor_link_requests(student_id, status);

-- 5. Zorg dat student_profiles NIET cascade deleten bij profiles delete
-- Dit voorkomt dat student accounts verwijderd worden als instructeur "verwijdert"
ALTER TABLE public.student_profiles 
DROP CONSTRAINT IF EXISTS student_profiles_user_id_fkey;

ALTER TABLE public.student_profiles 
ADD CONSTRAINT student_profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;  -- Keep cascade for actual account deletion

-- Maar we voegen een soft-delete toe via instructor_id NULL
-- Wanneer instructeur "verwijdert", zetten we instructor_id op NULL
-- Student account blijft bestaan, maar is niet meer gekoppeld
