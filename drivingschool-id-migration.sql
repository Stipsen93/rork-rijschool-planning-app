-- DrivePlan: Migrate from drivingschool_name to drivingschool_id
-- This migration creates the drivingschools table and updates profiles to use foreign key

-- ========================================
-- STEP 1: Create drivingschools table
-- ========================================

CREATE TABLE IF NOT EXISTS public.drivingschools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.drivingschools ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read drivingschools (for selection dropdown)
CREATE POLICY "Anyone can view active drivingschools"
  ON public.drivingschools FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow service role to manage drivingschools
CREATE POLICY "Service role can manage drivingschools"
  ON public.drivingschools FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- STEP 2: Insert some default drivingschools
-- ========================================

INSERT INTO public.drivingschools (name) VALUES
  ('Eigen Rijschool'),
  ('VerkeersPro Rijschool'),
  ('Rij met Succes'),
  ('Drive Expert'),
  ('TopDrive Rijschool')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- STEP 3: Add drivingschool_id to profiles
-- ========================================

-- Add the new column (nullable for now)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS drivingschool_id UUID REFERENCES public.drivingschools(id) ON DELETE SET NULL;

-- ========================================
-- STEP 4: Migrate existing data (if drivingschool_name column exists)
-- ========================================

DO $$
BEGIN
  -- Check if drivingschool_name column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'drivingschool_name'
  ) THEN
    -- First, create drivingschools from existing names
    INSERT INTO public.drivingschools (name)
    SELECT DISTINCT drivingschool_name 
    FROM public.profiles 
    WHERE drivingschool_name IS NOT NULL 
      AND drivingschool_name != ''
    ON CONFLICT (name) DO NOTHING;
    
    -- Then, update profiles to use the new drivingschool_id
    UPDATE public.profiles p
    SET drivingschool_id = d.id
    FROM public.drivingschools d
    WHERE p.drivingschool_name = d.name
      AND p.drivingschool_name IS NOT NULL;
    
    -- Finally, drop the old column
    ALTER TABLE public.profiles DROP COLUMN drivingschool_name;
  END IF;
END $$;

-- ========================================
-- STEP 5: Update the handle_new_user function
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val user_role;
  first_name_val TEXT;
  last_name_val TEXT;
  full_name_val TEXT;
  drivingschool_id_val UUID;
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
  
  -- Get drivingschool_id from metadata (if provided)
  IF NEW.raw_user_meta_data->>'drivingschool_id' IS NOT NULL THEN
    drivingschool_id_val := (NEW.raw_user_meta_data->>'drivingschool_id')::UUID;
  ELSE
    drivingschool_id_val := NULL;
  END IF;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role, phone, drivingschool_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    full_name_val,
    user_role_val,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    drivingschool_id_val,
    true
  );
  
  -- If instructor, create instructor profile
  IF user_role_val = 'instructor' THEN
    INSERT INTO public.instructor_profiles (user_id, rating, total_lessons)
    VALUES (
      NEW.id,
      0,
      0
    );
  END IF;
  
  -- If student, create student profile
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
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.email, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 6: Create index for better performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_drivingschool_id ON public.profiles(drivingschool_id);

-- ========================================
-- SETUP COMPLETE
-- ========================================
