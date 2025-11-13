-- Student Packages, Hours and Products Schema

-- Table for student package assignments
CREATE TABLE IF NOT EXISTS student_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  total_hours NUMERIC(6,2) NOT NULL,
  hours_used NUMERIC(6,2) DEFAULT 0,
  hours_remaining NUMERIC(6,2) GENERATED ALWAYS AS (total_hours - hours_used) STORED,
  price_total NUMERIC(10,2) NOT NULL,
  price_paid NUMERIC(10,2) DEFAULT 0,
  price_remaining NUMERIC(10,2) GENERATED ALWAYS AS (price_total - price_paid) STORED,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for additional products (exams, theory packages, etc.)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('exam', 'theory', 'material', 'other')),
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for student product assignments
CREATE TABLE IF NOT EXISTS student_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  quantity_used INTEGER DEFAULT 0,
  quantity_remaining INTEGER GENERATED ALWAYS AS (quantity - quantity_used) STORED,
  price_total NUMERIC(10,2) NOT NULL,
  price_paid NUMERIC(10,2) DEFAULT 0,
  price_remaining NUMERIC(10,2) GENERATED ALWAYS AS (price_total - price_paid) STORED,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_packages_student_id ON student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_status ON student_packages(status);
CREATE INDEX IF NOT EXISTS idx_products_instructor_id ON products(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_products_student_id ON student_products(student_id);
CREATE INDEX IF NOT EXISTS idx_student_products_status ON student_products(status);

-- Enable Row Level Security
ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_packages
CREATE POLICY "Students can view their own packages"
  ON student_packages FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can view packages for their students"
  ON student_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = student_id
      AND sp.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage packages for their students"
  ON student_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = student_id
      AND sp.instructor_id = auth.uid()
    )
  );

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Instructors can manage their own products"
  ON products FOR ALL
  USING (instructor_id = auth.uid());

-- RLS Policies for student_products
CREATE POLICY "Students can view their own products"
  ON student_products FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can view products for their students"
  ON student_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = student_id
      AND sp.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage products for their students"
  ON student_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = student_id
      AND sp.instructor_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_packages_updated_at
  BEFORE UPDATE ON student_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_products_updated_at
  BEFORE UPDATE ON student_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
