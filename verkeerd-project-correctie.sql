-- DrivePlan Database Cleanup Script
-- Run this SQL in the WRONG Supabase project to clean up all tables, functions, triggers, and policies
-- WARNING: This will delete ALL data in these tables!

-- ========================================
-- DROP TABLES (in reverse dependency order)
-- ========================================

-- Drop student products and packages tables
DROP TABLE IF EXISTS student_products CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS student_packages CASCADE;

-- Drop main application tables
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS instructor_link_requests CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS instructor_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ========================================
-- DROP FUNCTIONS
-- ========================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_student_user() CASCADE;
DROP FUNCTION IF EXISTS generate_instructor_number() CASCADE;
DROP FUNCTION IF EXISTS set_instructor_number() CASCADE;
DROP FUNCTION IF EXISTS handle_accepted_link_request() CASCADE;

-- ========================================
-- DROP ENUMS (TYPES)
-- ========================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS lesson_status CASCADE;
DROP TYPE IF EXISTS transmission_type CASCADE;

-- ========================================
-- CLEANUP COMPLETE
-- ========================================
-- All DrivePlan tables, functions, triggers, and enums have been removed.
-- The database has been cleaned up.
