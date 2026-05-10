
/*
  # Human Capital Management (HCM) Module

  1. New Tables
    - `departments` - Organizational departments
    - `employees` - Core employee profiles
    - `payroll_runs` - Payroll processing periods
    - `payroll_items` - Individual employee payroll records
    - `time_entries` - Clock in/out records
    - `leave_types` - Types of leave (vacation, sick, etc.)
    - `leave_requests` - Employee leave requests
    - `job_postings` - Open positions
    - `job_applications` - Candidates/applicants

  2. Security
    - RLS enabled on all tables
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  manager_id uuid,
  budget numeric(18,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  department_id uuid REFERENCES departments(id),
  job_title text NOT NULL,
  employment_type text DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contract','intern')),
  hire_date date NOT NULL,
  termination_date date,
  salary numeric(18,2) DEFAULT 0,
  hourly_rate numeric(10,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave','terminated')),
  manager_id uuid REFERENCES employees(id),
  address text DEFAULT '',
  date_of_birth date,
  tax_id text DEFAULT '',
  bank_account text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ADD CONSTRAINT fk_department_manager FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  pay_date date NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','processing','completed','cancelled')),
  total_gross numeric(18,2) DEFAULT 0,
  total_deductions numeric(18,2) DEFAULT 0,
  total_net numeric(18,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id),
  gross_pay numeric(18,2) NOT NULL,
  tax_deduction numeric(18,2) DEFAULT 0,
  benefits_deduction numeric(18,2) DEFAULT 0,
  other_deductions numeric(18,2) DEFAULT 0,
  net_pay numeric(18,2) NOT NULL,
  hours_worked numeric(8,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  hours_worked numeric(6,2),
  break_minutes integer DEFAULT 0,
  notes text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  days_per_year integer DEFAULT 0,
  is_paid boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  leave_type_id uuid NOT NULL REFERENCES leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested integer NOT NULL,
  reason text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by uuid REFERENCES employees(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department_id uuid REFERENCES departments(id),
  description text DEFAULT '',
  requirements text DEFAULT '',
  salary_min numeric(18,2),
  salary_max numeric(18,2),
  employment_type text DEFAULT 'full_time',
  location text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','closed','cancelled')),
  posted_date date,
  closing_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES job_postings(id),
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  applicant_phone text DEFAULT '',
  resume_url text DEFAULT '',
  cover_letter text DEFAULT '',
  status text DEFAULT 'applied' CHECK (status IN ('applied','screening','interview','offer','hired','rejected')),
  applied_at timestamptz DEFAULT now(),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert departments" ON departments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update departments" ON departments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update employees" ON employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read payroll_runs" ON payroll_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert payroll_runs" ON payroll_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update payroll_runs" ON payroll_runs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read payroll_items" ON payroll_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert payroll_items" ON payroll_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update payroll_items" ON payroll_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read time_entries" ON time_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert time_entries" ON time_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update time_entries" ON time_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read leave_types" ON leave_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert leave_types" ON leave_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update leave_types" ON leave_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read leave_requests" ON leave_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert leave_requests" ON leave_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update leave_requests" ON leave_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read job_postings" ON job_postings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert job_postings" ON job_postings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update job_postings" ON job_postings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read job_applications" ON job_applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert job_applications" ON job_applications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update job_applications" ON job_applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
