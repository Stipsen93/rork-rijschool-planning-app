-- Fix instructor profiles that are missing default values
-- This happens when an instructor logs in for the first time and the profile is created
-- but default values are not properly set

-- Update instructor profiles to have proper default values for all fields
UPDATE instructor_profiles
SET
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
  synced_at = COALESCE(synced_at, now())
WHERE
  -- Only update profiles that have NULL values in critical fields
  working_hours IS NULL
  OR vacation_periods IS NULL
  OR products IS NULL
  OR packages IS NULL
  OR base_lesson_duration IS NULL
  OR hourly_rate IS NULL;

-- Also ensure that profiles table has the correct full_name for instructors
UPDATE profiles p
SET 
  full_name = COALESCE(
    NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), ''),
    p.email
  ),
  updated_at = now()
WHERE 
  p.role = 'instructor'
  AND (p.full_name IS NULL OR p.full_name = '')
  AND p.id IN (SELECT user_id FROM instructor_profiles);

-- Verify the fix
SELECT 
  user_id,
  first_name,
  last_name,
  working_hours IS NOT NULL as has_working_hours,
  vacation_periods IS NOT NULL as has_vacation_periods,
  products IS NOT NULL as has_products,
  packages IS NOT NULL as has_packages,
  base_lesson_duration,
  hourly_rate,
  synced_at
FROM instructor_profiles
ORDER BY created_at DESC
LIMIT 10;
