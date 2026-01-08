-- Add active_locations column to instructor_profiles table
-- This field stores the locations where the instructor is active (e.g., "Almere, Amsterdam")

ALTER TABLE instructor_profiles 
ADD COLUMN IF NOT EXISTS active_locations TEXT;

-- Add comment to document the column
COMMENT ON COLUMN instructor_profiles.active_locations IS 'Comma-separated list of cities/locations where the instructor is active (e.g., "Almere, Amsterdam")';
