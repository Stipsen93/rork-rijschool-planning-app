-- Instructor Linking Feature Schema
-- Run this SQL in your Supabase SQL Editor after running the base schema

-- Add instructor_number column to instructor_profiles table
ALTER TABLE instructor_profiles 
ADD COLUMN IF NOT EXISTS instructor_number VARCHAR(7) UNIQUE;

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
