-- Fix RLS policy for instructor_link_requests UPDATE
-- The issue: USING clause checks OLD row (must be pending), 
-- but WITH CHECK also needs to allow NEW row to be accepted/rejected

-- Drop the existing policy
DROP POLICY IF EXISTS "Instructors can update requests sent to them" ON instructor_link_requests;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Instructors can update requests sent to them"
  ON instructor_link_requests FOR UPDATE
  USING (instructor_id = auth.uid() AND status = 'pending')
  WITH CHECK (
    instructor_id = auth.uid() 
    AND status IN ('accepted', 'rejected')
  );

-- Also update the student policy to allow cancellation
DROP POLICY IF EXISTS "Students can update their own pending requests" ON instructor_link_requests;

CREATE POLICY "Students can update their own pending requests"
  ON instructor_link_requests FOR UPDATE
  USING (student_id = auth.uid() AND status = 'pending')
  WITH CHECK (
    student_id = auth.uid() 
    AND status = 'cancelled'
  );
