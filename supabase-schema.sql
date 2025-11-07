-- DrivePlan Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create user role enum
CREATE TYPE user_role AS ENUM ('instructor', 'student');
CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE transmission_type AS ENUM ('manual', 'automatic');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
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
CREATE TABLE instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  license_number TEXT,
  bio TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  years_experience INTEGER,
  specializations TEXT[],
  working_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Student profiles
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_streak INTEGER DEFAULT 0,
  level TEXT,
  total_lessons_completed INTEGER DEFAULT 0,
  hours_driven DECIMAL(5, 2) DEFAULT 0,
  overall_progress DECIMAL(3, 2) DEFAULT 0,
  instructor_id UUID REFERENCES profiles(id),
  package_id UUID,
  learning_preferences JSONB,
  skills_progress JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Packages
CREATE TABLE packages (
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
CREATE TABLE vehicles (
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
CREATE TABLE lessons (
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
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_instructor_profiles_user_id ON instructor_profiles(user_id);
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_instructor_id ON student_profiles(instructor_id);
CREATE INDEX idx_lessons_instructor_id ON lessons(instructor_id);
CREATE INDEX idx_lessons_student_id ON lessons(student_id);
CREATE INDEX idx_lessons_start_time ON lessons(start_time);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_packages_instructor_id ON packages(instructor_id);
CREATE INDEX idx_vehicles_instructor_id ON vehicles(instructor_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    true
  );
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert demo accounts (Run this AFTER creating the auth users manually)
-- First, create these users in Supabase Dashboard -> Authentication -> Users:
-- 1. instructor@example.com / password123
-- 2. student1@example.com / password123  
-- 3. student2@example.com / password123

-- Then run this SQL to complete demo setup:
/*
-- Demo Instructor Profile
INSERT INTO profiles (id, email, full_name, role, phone, is_active, birth_date)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'instructor@example.com'),
  'instructor@example.com',
  'Jan van der Berg',
  'instructor',
  '+31612345678',
  true,
  '1985-03-15'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  birth_date = EXCLUDED.birth_date;

-- Demo Instructor Extended Profile
INSERT INTO instructor_profiles (user_id, company_name, license_number, rating, total_lessons, years_experience, bio)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'instructor@example.com'),
  'Rijschool Centrum',
  'WRM123456',
  4.8,
  0,
  10,
  'Ervaren rijinstructeur met passie voor lesgeven'
) ON CONFLICT (user_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  license_number = EXCLUDED.license_number;

-- Demo Student 1 Profile
INSERT INTO profiles (id, email, full_name, role, phone, is_active, birth_date)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'student1@example.com'),
  'student1@example.com',
  'Emma Jansen',
  'student',
  '+31698765432',
  true,
  '2003-07-22'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  birth_date = EXCLUDED.birth_date;

-- Demo Student 1 Extended Profile
INSERT INTO student_profiles (
  user_id, 
  lesson_streak, 
  level, 
  total_lessons_completed, 
  hours_driven, 
  overall_progress,
  instructor_id,
  skills_progress
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'student1@example.com'),
  7,
  'Gevorderd',
  45,
  67.5,
  0.72,
  (SELECT id FROM auth.users WHERE email = 'instructor@example.com'),
  '{
    "parking": 0.85,
    "highway": 0.72,
    "cityDriving": 0.91,
    "nightDriving": 0.43,
    "weatherConditions": 0.67
  }'::jsonb
) ON CONFLICT (user_id) DO UPDATE SET
  lesson_streak = EXCLUDED.lesson_streak,
  level = EXCLUDED.level,
  instructor_id = EXCLUDED.instructor_id;

-- Demo Student 2 Profile
INSERT INTO profiles (id, email, full_name, role, phone, is_active, birth_date)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'student2@example.com'),
  'student2@example.com',
  'Tom de Vries',
  'student',
  '+31687654321',
  true,
  '2004-11-08'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  birth_date = EXCLUDED.birth_date;

-- Demo Student 2 Extended Profile
INSERT INTO student_profiles (
  user_id,
  lesson_streak,
  level,
  total_lessons_completed,
  hours_driven,
  overall_progress,
  instructor_id,
  skills_progress
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'student2@example.com'),
  3,
  'Beginner',
  12,
  18.0,
  0.35,
  (SELECT id FROM auth.users WHERE email = 'instructor@example.com'),
  '{
    "parking": 0.45,
    "highway": 0.20,
    "cityDriving": 0.55,
    "nightDriving": 0.10,
    "weatherConditions": 0.30
  }'::jsonb
) ON CONFLICT (user_id) DO UPDATE SET
  lesson_streak = EXCLUDED.lesson_streak,
  level = EXCLUDED.level,
  instructor_id = EXCLUDED.instructor_id;

-- Demo Vehicle for Instructor
INSERT INTO vehicles (instructor_id, make, model, year, license_plate, transmission, fuel_type, color, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'instructor@example.com'),
  'Toyota',
  'Yaris',
  2022,
  'AB-123-CD',
  'manual',
  'Benzine',
  'Zilver',
  true
);

-- Demo Lessons
INSERT INTO lessons (
  instructor_id,
  student_id,
  title,
  lesson_type,
  start_time,
  end_time,
  duration,
  location,
  status,
  notes
)
VALUES
-- Upcoming lesson for student 1
(
  (SELECT id FROM auth.users WHERE email = 'instructor@example.com'),
  (SELECT id FROM auth.users WHERE email = 'student1@example.com'),
  'Stadsrijden',
  'Stadsrijden',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days' + INTERVAL '90 minutes',
  90,
  'Rijschool Centrum',
  'scheduled',
  'Focus op parkeren in krappe ruimtes'
),
-- Completed lesson for student 1
(
  (SELECT id FROM auth.users WHERE email = 'instructor@example.com'),
  (SELECT id FROM auth.users WHERE email = 'student1@example.com'),
  'Snelweg rijden',
  'Snelweg',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days' + INTERVAL '90 minutes',
  90,
  'A2 Snelweg',
  'completed',
  'Goede vooruitgang met invoegen'
),
-- Upcoming lesson for student 2
(
  (SELECT id FROM auth.users WHERE email = 'instructor@example.com'),
  (SELECT id FROM auth.users WHERE email = 'student2@example.com'),
  'Basis rijvaardigheden',
  'Basis',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '90 minutes',
  90,
  'Rijschool Centrum',
  'scheduled',
  'Oefenen met schakelen'
);
*/
