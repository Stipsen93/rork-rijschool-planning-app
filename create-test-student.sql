-- Create test student account for development
-- Run this in your Supabase SQL Editor

-- First, create the auth user
-- Note: You'll need to run this in the Supabase SQL Editor
-- The password will be hashed automatically

-- Create user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4789-0123-456789abcdef', -- Fixed UUID for student
  'authenticated',
  'authenticated',
  'student1@example.com',
  crypt('password123', gen_salt('bf')), -- Hash the password
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Emma Jansen","role":"student"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create profile for the student
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  birth_date,
  is_active
) VALUES (
  'a1b2c3d4-e5f6-4789-0123-456789abcdef',
  'student1@example.com',
  'Emma Jansen',
  'student',
  '+31612345678',
  '2005-03-15',
  true
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  birth_date = EXCLUDED.birth_date;

-- Create student profile
INSERT INTO student_profiles (
  user_id,
  lesson_streak,
  level,
  total_lessons_completed,
  hours_driven,
  overall_progress,
  learning_preferences,
  skills_progress
) VALUES (
  'a1b2c3d4-e5f6-4789-0123-456789abcdef',
  5,
  'Beginner',
  8,
  12.5,
  35.0,
  '{"preferredTime": "afternoon", "transmission": "manual", "lessonDuration": 60}',
  '{"parking": 60, "cityDriving": 45, "highway": 20, "nightDriving": 10}'
) ON CONFLICT (user_id) DO UPDATE SET
  lesson_streak = EXCLUDED.lesson_streak,
  level = EXCLUDED.level,
  total_lessons_completed = EXCLUDED.total_lessons_completed,
  hours_driven = EXCLUDED.hours_driven,
  overall_progress = EXCLUDED.overall_progress;

-- Update student_profiles to add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='first_name') THEN
    ALTER TABLE student_profiles ADD COLUMN first_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='last_name') THEN
    ALTER TABLE student_profiles ADD COLUMN last_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='birth_date') THEN
    ALTER TABLE student_profiles ADD COLUMN birth_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='address') THEN
    ALTER TABLE student_profiles ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='phone') THEN
    ALTER TABLE student_profiles ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='parent_name') THEN
    ALTER TABLE student_profiles ADD COLUMN parent_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='parent_phone') THEN
    ALTER TABLE student_profiles ADD COLUMN parent_phone TEXT;
  END IF;
END $$;

-- Update the student profile with personal information
UPDATE student_profiles SET
  first_name = 'Emma',
  last_name = 'Jansen',
  birth_date = '2005-03-15',
  address = 'Kerkstraat 123, 1234 AB Amsterdam',
  phone = '+31612345678',
  parent_name = 'Maria Jansen',
  parent_phone = '+31687654321'
WHERE user_id = 'a1b2c3d4-e5f6-4789-0123-456789abcdef';

SELECT 'Test student account created successfully!' AS result;
SELECT 'Email: student1@example.com' AS email;
SELECT 'Password: password123' AS password;
