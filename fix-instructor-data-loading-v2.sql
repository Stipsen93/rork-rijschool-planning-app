-- Fix Instructor Data Loading Issues - Version 2
-- This fixes issues where instructor information doesn't load after student_packages table was added
-- This version properly handles already existing policies

-- ========================================
-- STEP 1: Verify and fix RLS policies for instructor_profiles
-- ========================================

-- Drop ALL possible existing policies that might be causing conflicts
DO $$ 
BEGIN
  -- Drop all policies on instructor_profiles
  DROP POLICY IF EXISTS "Instructors can view their own instructor profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Instructors can insert their own instructor profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Instructors can update their own instructor profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Service role can insert instructor profiles" ON instructor_profiles;
  DROP POLICY IF EXISTS "Instructors can view own profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Instructors can update own profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Allow instructors to insert their own profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Instructors can view their own profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Instructors can insert their own profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Instructors can update their own profile" ON instructor_profiles;
  DROP POLICY IF EXISTS "Service role has full access to instructor profiles" ON instructor_profiles;
END $$;

-- Recreate correct RLS policies for instructor_profiles
CREATE POLICY "Instructors can view their own profile"
  ON instructor_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can insert their own profile"
  ON instructor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can update their own profile"
  ON instructor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role has full access to instructor profiles"
  ON instructor_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- STEP 2: Fix profiles table RLS policies
-- ========================================

DO $$ 
BEGIN
  -- Drop all policies on profiles
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
  DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;
END $$;

-- Recreate correct RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- STEP 3: Ensure all instructor profiles have proper default values
-- ========================================

-- Update instructor profiles to have proper default values for all fields
UPDATE instructor_profiles
SET
  -- Basic info from profiles table
  first_name = COALESCE(first_name, (SELECT p.first_name FROM profiles p WHERE p.id = instructor_profiles.user_id)),
  last_name = COALESCE(last_name, (SELECT p.last_name FROM profiles p WHERE p.id = instructor_profiles.user_id)),
  phone = COALESCE(phone, (SELECT p.phone FROM profiles p WHERE p.id = instructor_profiles.user_id)),
  birth_date = COALESCE(birth_date, (SELECT p.birth_date FROM profiles p WHERE p.id = instructor_profiles.user_id)),
  
  -- Working hours - default to Monday-Friday 9:00-18:00
  working_hours = COALESCE(working_hours, jsonb_build_object(
    'Maandag', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '18:00')), 'pauses', jsonb_build_array()),
    'Dinsdag', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '18:00')), 'pauses', jsonb_build_array()),
    'Woensdag', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '18:00')), 'pauses', jsonb_build_array()),
    'Donderdag', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '18:00')), 'pauses', jsonb_build_array()),
    'Vrijdag', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '18:00')), 'pauses', jsonb_build_array()),
    'Zaterdag', jsonb_build_object('enabled', false, 'ranges', jsonb_build_array(), 'pauses', jsonb_build_array()),
    'Zondag', jsonb_build_object('enabled', false, 'ranges', jsonb_build_array(), 'pauses', jsonb_build_array())
  )),
  
  -- Vacation periods - default to empty array
  vacation_periods = COALESCE(vacation_periods, '[]'::jsonb),
  
  -- Lesson configuration
  base_lesson_duration = COALESCE(base_lesson_duration, 60),
  product_durations = COALESCE(product_durations, '{}'::jsonb),
  break_between_lessons = COALESCE(break_between_lessons, 15),
  automatic_breaks = COALESCE(automatic_breaks, false),
  require_confirmation = COALESCE(require_confirmation, true),
  cancellation_notice_hours = COALESCE(cancellation_notice_hours, 24),
  
  -- Products and packages
  products = COALESCE(products, '[]'::jsonb),
  packages = COALESCE(packages, '[]'::jsonb),
  
  -- Hourly rate
  hourly_rate = COALESCE(hourly_rate, 0),
  hourly_vat_status = COALESCE(hourly_vat_status, 'incl'),
  
  -- Student configuration
  max_lessons_per_week = COALESCE(max_lessons_per_week, 3),
  max_lessons_per_day = COALESCE(max_lessons_per_day, 2),
  consecutive_lessons = COALESCE(consecutive_lessons, 1),
  advance_booking_days = COALESCE(advance_booking_days, 7),
  allow_weekend_booking = COALESCE(allow_weekend_booking, true),
  require_parent_approval = COALESCE(require_parent_approval, false),
  allow_student_cancellation = COALESCE(allow_student_cancellation, true),
  student_cancellation_hours = COALESCE(student_cancellation_hours, 24),
  late_cancellation_penalty = COALESCE(late_cancellation_penalty, false),
  penalty_amount = COALESCE(penalty_amount, 0),
  require_prepayment = COALESCE(require_prepayment, false),
  allow_payment_plans = COALESCE(allow_payment_plans, true),
  max_unpaid_lessons = COALESCE(max_unpaid_lessons, 2),
  send_reminders = COALESCE(send_reminders, true),
  reminder_hours = COALESCE(reminder_hours, 2),
  send_progress_reports = COALESCE(send_progress_reports, true),
  allow_direct_contact = COALESCE(allow_direct_contact, true),
  
  -- Lesson card configuration
  lesson_card_categories = COALESCE(lesson_card_categories, '[]'::jsonb),
  lesson_card_status_config = COALESCE(lesson_card_status_config, '[]'::jsonb),
  
  -- Notification settings
  notification_settings = COALESCE(notification_settings, NULL),
  
  -- Other fields
  rating = COALESCE(rating, 0),
  total_lessons = COALESCE(total_lessons, 0),
  driving_school_affiliation = COALESCE(driving_school_affiliation, ARRAY[]::text[]),
  specializations = COALESCE(specializations, ARRAY[]::text[]),
  
  -- Update timestamp
  updated_at = now(),
  synced_at = now();

-- ========================================
-- STEP 4: Fix profiles table data
-- ========================================

-- Ensure that profiles table has the correct full_name for instructors
UPDATE profiles p
SET 
  full_name = COALESCE(
    NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), ''),
    p.email
  ),
  first_name = COALESCE(p.first_name, (SELECT ip.first_name FROM instructor_profiles ip WHERE ip.user_id = p.id)),
  last_name = COALESCE(p.last_name, (SELECT ip.last_name FROM instructor_profiles ip WHERE ip.user_id = p.id)),
  phone = COALESCE(p.phone, (SELECT ip.phone FROM instructor_profiles ip WHERE ip.user_id = p.id)),
  birth_date = COALESCE(p.birth_date, (SELECT ip.birth_date FROM instructor_profiles ip WHERE ip.user_id = p.id)),
  updated_at = now()
WHERE 
  p.role = 'instructor'
  AND p.id IN (SELECT user_id FROM instructor_profiles);

-- ========================================
-- STEP 5: Grant necessary permissions
-- ========================================

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on instructor_profiles
GRANT ALL ON instructor_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON instructor_profiles TO authenticated;

-- Grant permissions on profiles
GRANT ALL ON profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- ========================================
-- STEP 6: Verify the fix
-- ========================================

-- Show instructor profiles with their data
SELECT 
  ip.user_id,
  p.email,
  p.full_name,
  ip.first_name,
  ip.last_name,
  ip.phone,
  ip.working_hours IS NOT NULL as has_working_hours,
  ip.vacation_periods IS NOT NULL as has_vacation_periods,
  ip.products IS NOT NULL as has_products,
  ip.packages IS NOT NULL as has_packages,
  ip.base_lesson_duration,
  ip.hourly_rate,
  ip.synced_at,
  ip.created_at
FROM instructor_profiles ip
JOIN profiles p ON p.id = ip.user_id
WHERE p.role = 'instructor'
ORDER BY ip.created_at DESC;

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- Instructor data should now load correctly after login.
-- The issue was caused by missing RLS policies or missing default values.
