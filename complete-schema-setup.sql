-- DrivePlan Complete Database Schema Setup
-- Run this SQL in your Supabase SQL Editor
-- This combines all schema files in the correct order

-- ========================================
-- PART 1: BASE SCHEMA (from supabase-schema.sql)
-- ========================================

-- Create user role enum (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('instructor', 'student');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_status') THEN
    CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transmission_type') THEN
    CREATE TYPE transmission_type AS ENUM ('manual', 'automatic');
  END IF;
END $$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL,
  phone TEXT,
  birth_date DATE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instructor profiles
CREATE TABLE IF NOT EXISTS instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Persoonlijke gegevens
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  birth_date DATE,
  instructor_number VARCHAR(7) UNIQUE,
  wrm_pass_number TEXT,
  driving_school_name TEXT,
  driving_school_affiliation TEXT[],
  years_experience INTEGER,
  tax_id TEXT,
  business_address TEXT,
  iban TEXT,
  specializations TEXT[],
  
  -- Legacy fields
  company_name TEXT,
  license_number TEXT,
  bio TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  
  -- Werkuren en vakanties
  working_hours JSONB,
  vacation_periods JSONB,
  
  -- Lesconfiguratie
  base_lesson_duration INTEGER DEFAULT 60,
  product_durations JSONB,
  break_between_lessons INTEGER DEFAULT 15,
  automatic_breaks BOOLEAN DEFAULT false,
  require_confirmation BOOLEAN DEFAULT true,
  cancellation_notice_hours INTEGER DEFAULT 24,
  
  -- Producten en pakketten
  products JSONB,
  packages JSONB,
  hourly_rate DECIMAL(10, 2),
  hourly_vat_status TEXT DEFAULT 'incl',
  
  -- Leerlingconfiguratie
  max_lessons_per_week INTEGER DEFAULT 3,
  max_lessons_per_day INTEGER DEFAULT 2,
  consecutive_lessons INTEGER DEFAULT 1,
  advance_booking_days INTEGER DEFAULT 7,
  allow_weekend_booking BOOLEAN DEFAULT true,
  require_parent_approval BOOLEAN DEFAULT false,
  allow_student_cancellation BOOLEAN DEFAULT true,
  student_cancellation_hours INTEGER DEFAULT 24,
  late_cancellation_penalty BOOLEAN DEFAULT false,
  penalty_amount DECIMAL(10, 2) DEFAULT 0,
  require_prepayment BOOLEAN DEFAULT false,
  allow_payment_plans BOOLEAN DEFAULT true,
  max_unpaid_lessons INTEGER DEFAULT 2,
  send_reminders BOOLEAN DEFAULT true,
  reminder_hours INTEGER DEFAULT 2,
  send_progress_reports BOOLEAN DEFAULT true,
  allow_direct_contact BOOLEAN DEFAULT true,
  
  -- Leskaart
  lesson_card_categories JSONB,
  lesson_card_status_config JSONB,
  
  -- Meldingen
  notification_settings JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_streak INTEGER DEFAULT 0,
  level TEXT,
  total_lessons_completed INTEGER DEFAULT 0,
  hours_driven DECIMAL(5, 2) DEFAULT 0,
  overall_progress DECIMAL(5, 2) DEFAULT 0,
  instructor_id UUID REFERENCES profiles(id),
  package_id UUID,
  learning_preferences JSONB,
  skills_progress JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Packages
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_hours INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT NOT NULL,
  transmission transmission_type NOT NULL,
  fuel_type TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons (shared between instructors and students)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  student_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  location TEXT,
  pickup_location TEXT,
  vehicle_id UUID REFERENCES vehicles(id),
  status lesson_status DEFAULT 'scheduled',
  notes TEXT,
  instructor_notes TEXT,
  student_notes TEXT,
  rating DECIMAL(2, 1),
  skills_improved TEXT[],
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles (limited fields)" ON profiles;
DROP POLICY IF EXISTS "Instructors can view their own profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Instructors can update their own profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Students can view their instructor profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Anyone can view all instructor profiles" ON instructor_profiles;
DROP POLICY IF EXISTS "Students can view their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can update their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Instructors can view their students profiles" ON student_profiles;
DROP POLICY IF EXISTS "Anyone can view active packages" ON packages;
DROP POLICY IF EXISTS "Instructors can manage their own packages" ON packages;
DROP POLICY IF EXISTS "Instructors can manage their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Students can view their instructor's vehicles" ON vehicles;
DROP POLICY IF EXISTS "Instructors can view their own lessons" ON lessons;
DROP POLICY IF EXISTS "Students can view their own lessons" ON lessons;
DROP POLICY IF EXISTS "Instructors can create lessons for themselves" ON lessons;
DROP POLICY IF EXISTS "Students can create lessons for themselves" ON lessons;
DROP POLICY IF EXISTS "Instructors can update their own lessons" ON lessons;
DROP POLICY IF EXISTS "Students can update their own lessons" ON lessons;
DROP POLICY IF EXISTS "Instructors can delete their own lessons" ON lessons;
DROP POLICY IF EXISTS "Students can delete their own lessons" ON lessons;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view other profiles (limited fields)"
  ON profiles FOR SELECT
  USING (true);

-- Instructor profiles policies
CREATE POLICY "Instructors can view their own profile"
  ON instructor_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can update their own profile"
  ON instructor_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Students can view their instructor profile"
  ON instructor_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE student_profiles.user_id = auth.uid()
      AND student_profiles.instructor_id = instructor_profiles.user_id
    )
  );

-- Allow students to view all instructor profiles (for searching)
CREATE POLICY "Anyone can view all instructor profiles"
  ON instructor_profiles FOR SELECT
  USING (true);

-- Student profiles policies
CREATE POLICY "Students can view their own profile"
  ON student_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Students can update their own profile"
  ON student_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view their students profiles"
  ON student_profiles FOR SELECT
  USING (
    instructor_id = auth.uid()
  );

-- Packages policies
CREATE POLICY "Anyone can view active packages"
  ON packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Instructors can manage their own packages"
  ON packages FOR ALL
  USING (instructor_id = auth.uid());

-- Vehicles policies
CREATE POLICY "Instructors can manage their own vehicles"
  ON vehicles FOR ALL
  USING (instructor_id = auth.uid());

CREATE POLICY "Students can view their instructor's vehicles"
  ON vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE student_profiles.user_id = auth.uid()
      AND student_profiles.instructor_id = vehicles.instructor_id
    )
  );

-- Lessons policies
CREATE POLICY "Instructors can view their own lessons"
  ON lessons FOR SELECT
  USING (instructor_id = auth.uid());

CREATE POLICY "Students can view their own lessons"
  ON lessons FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can create lessons for themselves"
  ON lessons FOR INSERT
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Students can create lessons for themselves"
  ON lessons FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors can update their own lessons"
  ON lessons FOR UPDATE
  USING (instructor_id = auth.uid());

CREATE POLICY "Students can update their own lessons"
  ON lessons FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can delete their own lessons"
  ON lessons FOR DELETE
  USING (instructor_id = auth.uid());

CREATE POLICY "Students can delete their own lessons"
  ON lessons FOR DELETE
  USING (student_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user_id ON instructor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_instructor_id ON student_profiles(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_instructor_id ON lessons(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_start_time ON lessons(start_time);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_packages_instructor_id ON packages(instructor_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_instructor_id ON vehicles(instructor_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_instructor_profiles_updated_at ON instructor_profiles;
DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;

-- Add triggers to update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_profiles_updated_at BEFORE UPDATE ON instructor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
DECLARE
  user_role_val user_role;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role_val := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student');
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role, phone, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      TRIM(
        COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      ),
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    ),
    user_role_val,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    true
  );
  
  -- If instructor, create instructor profile
  IF user_role_val = 'instructor' THEN
    INSERT INTO public.instructor_profiles (user_id, first_name, last_name, rating, total_lessons)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
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
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- PART 2: INSTRUCTOR LINKING SCHEMA
-- ========================================

-- Instructor number is already added above

-- Create instructor_link_requests table
CREATE TABLE IF NOT EXISTS instructor_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(student_id, instructor_id, status)
);

-- Enable Row Level Security
ALTER TABLE instructor_link_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own requests" ON instructor_link_requests;
DROP POLICY IF EXISTS "Students can create requests" ON instructor_link_requests;
DROP POLICY IF EXISTS "Students can update their own pending requests" ON instructor_link_requests;
DROP POLICY IF EXISTS "Instructors can view requests sent to them" ON instructor_link_requests;
DROP POLICY IF EXISTS "Instructors can update requests sent to them" ON instructor_link_requests;

-- Policies for instructor_link_requests
CREATE POLICY "Students can view their own requests"
  ON instructor_link_requests FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can create requests"
  ON instructor_link_requests FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own pending requests"
  ON instructor_link_requests FOR UPDATE
  USING (student_id = auth.uid() AND status = 'pending');

CREATE POLICY "Instructors can view requests sent to them"
  ON instructor_link_requests FOR SELECT
  USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can update requests sent to them"
  ON instructor_link_requests FOR UPDATE
  USING (instructor_id = auth.uid() AND status = 'pending');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_link_requests_student_id ON instructor_link_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_link_requests_instructor_id ON instructor_link_requests(instructor_id);
CREATE INDEX IF NOT EXISTS idx_link_requests_status ON instructor_link_requests(status);
CREATE INDEX IF NOT EXISTS idx_instructor_number ON instructor_profiles(instructor_number);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_instructor_link_requests_updated_at ON instructor_link_requests;

CREATE TRIGGER update_instructor_link_requests_updated_at 
  BEFORE UPDATE ON instructor_link_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique 7-digit instructor number
CREATE OR REPLACE FUNCTION generate_instructor_number()
RETURNS VARCHAR(7) AS $$
DECLARE
  new_number VARCHAR(7);
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 7-digit number (1000000 to 9999999)
    new_number := LPAD((FLOOR(RANDOM() * 9000000) + 1000000)::TEXT, 7, '0');
    
    -- Check if number already exists
    SELECT EXISTS(
      SELECT 1 FROM instructor_profiles WHERE instructor_number = new_number
    ) INTO number_exists;
    
    -- Exit loop if number is unique
    EXIT WHEN NOT number_exists;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate instructor number when instructor profile is created
CREATE OR REPLACE FUNCTION set_instructor_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.instructor_number IS NULL THEN
    NEW.instructor_number := generate_instructor_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set instructor number on insert
DROP TRIGGER IF EXISTS set_instructor_number_trigger ON instructor_profiles;

CREATE TRIGGER set_instructor_number_trigger
  BEFORE INSERT ON instructor_profiles
  FOR EACH ROW EXECUTE FUNCTION set_instructor_number();

-- Generate instructor numbers for existing instructor profiles
UPDATE instructor_profiles 
SET instructor_number = generate_instructor_number()
WHERE instructor_number IS NULL;

-- Function to handle accepted link requests
CREATE OR REPLACE FUNCTION handle_accepted_link_request()
RETURNS TRIGGER AS $$
BEGIN
  -- When request is accepted, update student's instructor_id
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE student_profiles
    SET instructor_id = NEW.instructor_id
    WHERE user_id = NEW.student_id;
    
    -- Set responded_at timestamp
    NEW.responded_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle accepted requests
DROP TRIGGER IF EXISTS on_link_request_accepted ON instructor_link_requests;

CREATE TRIGGER on_link_request_accepted
  BEFORE UPDATE ON instructor_link_requests
  FOR EACH ROW 
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_accepted_link_request();

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- All tables, functions, triggers, and policies have been created.
-- You can now use the application.
