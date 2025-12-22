-- Fix Profile Data Sync Issues
-- This ensures profile data is properly synced between profiles and instructor_profiles tables

-- ========================================
-- STEP 1: Sync data FROM profiles TO instructor_profiles
-- ========================================

-- Update instructor_profiles with data from profiles table
UPDATE instructor_profiles ip
SET
  first_name = COALESCE(ip.first_name, p.first_name),
  last_name = COALESCE(ip.last_name, p.last_name),
  phone = COALESCE(ip.phone, p.phone),
  birth_date = COALESCE(ip.birth_date, p.birth_date),
  updated_at = now(),
  synced_at = now()
FROM profiles p
WHERE 
  ip.user_id = p.id 
  AND p.role = 'instructor'
  AND (
    ip.first_name IS NULL OR ip.first_name = '' OR
    ip.last_name IS NULL OR ip.last_name = '' OR
    ip.phone IS NULL OR ip.phone = ''
  );

-- ========================================
-- STEP 2: Sync data FROM instructor_profiles TO profiles
-- ========================================

-- Update profiles with data from instructor_profiles table
UPDATE profiles p
SET
  first_name = COALESCE(p.first_name, ip.first_name),
  last_name = COALESCE(p.last_name, ip.last_name),
  phone = COALESCE(p.phone, ip.phone),
  birth_date = COALESCE(p.birth_date, ip.birth_date),
  full_name = COALESCE(
    NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ip.first_name, ''), ' ', COALESCE(p.last_name, ip.last_name, ''))), ''),
    p.email
  ),
  updated_at = now()
FROM instructor_profiles ip
WHERE 
  p.id = ip.user_id 
  AND p.role = 'instructor'
  AND (
    p.first_name IS NULL OR p.first_name = '' OR
    p.last_name IS NULL OR p.last_name = '' OR
    p.phone IS NULL OR p.phone = ''
  );

-- ========================================
-- STEP 3: Sync data from auth.users metadata if profiles/instructor_profiles are still empty
-- ========================================

-- Update profiles from auth.users metadata
UPDATE profiles p
SET
  first_name = COALESCE(
    NULLIF(p.first_name, ''), 
    (u.raw_user_meta_data->>'first_name')::text
  ),
  last_name = COALESCE(
    NULLIF(p.last_name, ''), 
    (u.raw_user_meta_data->>'last_name')::text
  ),
  phone = COALESCE(
    NULLIF(p.phone, ''), 
    (u.raw_user_meta_data->>'phone')::text
  ),
  birth_date = COALESCE(
    p.birth_date, 
    (u.raw_user_meta_data->>'birth_date')::date
  ),
  full_name = COALESCE(
    NULLIF(p.full_name, ''),
    (u.raw_user_meta_data->>'full_name')::text,
    NULLIF(TRIM(CONCAT(
      COALESCE(p.first_name, (u.raw_user_meta_data->>'first_name')::text, ''), 
      ' ', 
      COALESCE(p.last_name, (u.raw_user_meta_data->>'last_name')::text, '')
    )), ''),
    p.email
  ),
  updated_at = now()
FROM auth.users u
WHERE 
  p.id = u.id 
  AND p.role = 'instructor'
  AND (
    p.first_name IS NULL OR p.first_name = '' OR
    p.last_name IS NULL OR p.last_name = ''
  );

-- Update instructor_profiles from auth.users metadata
UPDATE instructor_profiles ip
SET
  first_name = COALESCE(
    NULLIF(ip.first_name, ''), 
    (u.raw_user_meta_data->>'first_name')::text
  ),
  last_name = COALESCE(
    NULLIF(ip.last_name, ''), 
    (u.raw_user_meta_data->>'last_name')::text
  ),
  phone = COALESCE(
    NULLIF(ip.phone, ''), 
    (u.raw_user_meta_data->>'phone')::text
  ),
  birth_date = COALESCE(
    ip.birth_date, 
    (u.raw_user_meta_data->>'birth_date')::date
  ),
  wrm_pass_number = COALESCE(
    NULLIF(ip.wrm_pass_number, ''), 
    (u.raw_user_meta_data->>'wrm_pass_number')::text
  ),
  driving_school_name = COALESCE(
    NULLIF(ip.driving_school_name, ''), 
    (u.raw_user_meta_data->>'driving_school_name')::text
  ),
  updated_at = now(),
  synced_at = now()
FROM auth.users u
WHERE 
  ip.user_id = u.id 
  AND (
    ip.first_name IS NULL OR ip.first_name = '' OR
    ip.last_name IS NULL OR ip.last_name = ''
  );

-- ========================================
-- STEP 4: Ensure RLS policies are correct
-- ========================================

-- Enable RLS on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 5: Verify the fix
-- ========================================

-- Show all instructor data
SELECT 
  p.id,
  p.email,
  p.role,
  p.first_name as profile_first_name,
  p.last_name as profile_last_name,
  p.phone as profile_phone,
  p.full_name as profile_full_name,
  ip.first_name as instructor_first_name,
  ip.last_name as instructor_last_name,
  ip.phone as instructor_phone,
  ip.instructor_number,
  ip.wrm_pass_number,
  ip.driving_school_name,
  ip.synced_at,
  ip.created_at,
  u.raw_user_meta_data->>'first_name' as meta_first_name,
  u.raw_user_meta_data->>'last_name' as meta_last_name
FROM profiles p
LEFT JOIN instructor_profiles ip ON ip.user_id = p.id
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'instructor'
ORDER BY p.created_at DESC;

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- Profile data should now be properly synced and visible after login.
