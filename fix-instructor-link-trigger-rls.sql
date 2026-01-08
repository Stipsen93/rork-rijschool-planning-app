-- Fix RLS issue with link request trigger updating student_profiles
-- This allows the trigger to update student_profiles when a link request is accepted

-- Recreate the trigger function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION handle_accepted_link_request()
RETURNS TRIGGER 
SECURITY DEFINER -- This allows the function to bypass RLS policies
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- When request is accepted, update student's instructor_id
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Update or create student_profile with the instructor_id
    INSERT INTO student_profiles (user_id, instructor_id)
    VALUES (NEW.student_id, NEW.instructor_id)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      instructor_id = EXCLUDED.instructor_id,
      updated_at = NOW();
    
    -- Set responded_at timestamp
    NEW.responded_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_link_request_accepted ON instructor_link_requests;

CREATE TRIGGER on_link_request_accepted
  BEFORE UPDATE ON instructor_link_requests
  FOR EACH ROW 
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_accepted_link_request();

-- Verify the trigger
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_link_request_accepted';
