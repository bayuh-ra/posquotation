-- backend/seed_employees.sql
-- Creates `employees` table if it doesn't exist and inserts sample employees.

-- Create table (safe: IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  employee_code text UNIQUE,
  email text,
  role text,
  created_at timestamptz DEFAULT now()
);

-- Insert sample employees (use ON CONFLICT DO NOTHING to avoid duplicates)
INSERT INTO public.employees (name, employee_code, email, role)
VALUES
  ('MA''AM CHARISSE', '001', NULL, NULL),
  ('SIR JUDE', '002', NULL, NULL),
  ('SIR GAB', '003', NULL, NULL),
  ('MA''AM CHERYL', '004', NULL, NULL),
  ('SIR JULIUS', '005', NULL, NULL)
ON CONFLICT (employee_code) DO NOTHING;

-- Verify rows
SELECT id, name, employee_code, created_at FROM public.employees ORDER BY employee_code;
