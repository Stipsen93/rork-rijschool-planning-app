-- Insert test data for packages, products and student assignments
-- This assumes you have a student with ID from profiles table

-- First, let's get the instructor and student IDs
DO $$
DECLARE
  v_instructor_id UUID;
  v_student_id UUID;
  v_package_id_1 UUID;
  v_package_id_2 UUID;
  v_product_id_1 UUID;
  v_product_id_2 UUID;
  v_product_id_3 UUID;
BEGIN
  -- Get instructor ID (assuming Stephen is the instructor)
  SELECT p.id INTO v_instructor_id
  FROM profiles p
  INNER JOIN instructor_profiles ip ON p.id = ip.user_id
  WHERE p.full_name = 'Stephen'
  LIMIT 1;

  -- Get student ID (Leerling 1)
  SELECT p.id INTO v_student_id
  FROM profiles p
  WHERE p.role = 'student'
  AND p.full_name ILIKE '%leerling 1%'
  LIMIT 1;

  IF v_instructor_id IS NULL OR v_student_id IS NULL THEN
    RAISE NOTICE 'Could not find instructor or student. Please check the data.';
    RETURN;
  END IF;

  RAISE NOTICE 'Instructor ID: %', v_instructor_id;
  RAISE NOTICE 'Student ID: %', v_student_id;

  -- Insert packages if they don't exist
  INSERT INTO packages (id, instructor_id, name, description, total_hours, price, is_active)
  VALUES 
    (uuid_generate_v4(), v_instructor_id, 'Basis Rijlessen Pakket', '10 rijlessen voor beginners', 10, 550.00, true),
    (uuid_generate_v4(), v_instructor_id, 'Uitgebreid Pakket', '20 rijlessen inclusief snelweg training', 20, 1000.00, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_package_id_1;

  -- Get package IDs
  SELECT id INTO v_package_id_1 FROM packages WHERE instructor_id = v_instructor_id AND name = 'Basis Rijlessen Pakket' LIMIT 1;
  SELECT id INTO v_package_id_2 FROM packages WHERE instructor_id = v_instructor_id AND name = 'Uitgebreid Pakket' LIMIT 1;

  -- Assign packages to student
  INSERT INTO student_packages (student_id, package_id, total_hours, hours_used, price_total, price_paid, status, start_date)
  VALUES 
    (v_student_id, v_package_id_1, 10, 6.5, 550.00, 550.00, 'active', NOW() - INTERVAL '2 months'),
    (v_student_id, v_package_id_2, 20, 8.0, 1000.00, 600.00, 'active', NOW() - INTERVAL '1 month')
  ON CONFLICT DO NOTHING;

  -- Insert products
  INSERT INTO products (id, instructor_id, name, description, category, price, is_active)
  VALUES 
    (uuid_generate_v4(), v_instructor_id, 'Theorie Examen', 'CBR theorie examen', 'exam', 37.50, true),
    (uuid_generate_v4(), v_instructor_id, 'Praktijk Examen', 'CBR praktijk examen', 'exam', 280.00, true),
    (uuid_generate_v4(), v_instructor_id, 'Online Theorie Cursus', 'Toegang tot online theorie platform', 'theory', 49.95, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_product_id_1;

  -- Get product IDs
  SELECT id INTO v_product_id_1 FROM products WHERE instructor_id = v_instructor_id AND name = 'Theorie Examen' LIMIT 1;
  SELECT id INTO v_product_id_2 FROM products WHERE instructor_id = v_instructor_id AND name = 'Praktijk Examen' LIMIT 1;
  SELECT id INTO v_product_id_3 FROM products WHERE instructor_id = v_instructor_id AND name = 'Online Theorie Cursus' LIMIT 1;

  -- Assign products to student
  INSERT INTO student_products (student_id, product_id, quantity, quantity_used, price_total, price_paid, status, purchase_date)
  VALUES 
    (v_student_id, v_product_id_1, 2, 1, 75.00, 75.00, 'active', NOW() - INTERVAL '3 months'),
    (v_student_id, v_product_id_2, 1, 0, 280.00, 0, 'active', NOW() - INTERVAL '1 month'),
    (v_student_id, v_product_id_3, 1, 1, 49.95, 49.95, 'used', NOW() - INTERVAL '4 months')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Test data created successfully!';
END $$;
