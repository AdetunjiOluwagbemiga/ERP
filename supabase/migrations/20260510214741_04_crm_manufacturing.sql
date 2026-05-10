
/*
  # Sales CRM & Manufacturing Module

  1. New Tables (CRM)
    - `contacts` - Customer contacts
    - `leads` - Sales pipeline leads
    - `opportunities` - Sales opportunities
    - `activities` - CRM activities/interactions

  2. New Tables (Manufacturing)
    - `bill_of_materials` - Product recipes/BOMs
    - `bom_items` - BOM line items
    - `production_orders` - Shop floor work orders
    - `quality_inspections` - QC records

  3. Cross-functional
    - `audit_logs` - System-wide audit trail
    - `documents` - Document management
    - `notifications` - System notifications

  4. Security - RLS on all tables
*/

-- CRM
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  company text DEFAULT '',
  job_title text DEFAULT '',
  address text DEFAULT '',
  source text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id),
  title text NOT NULL,
  company text DEFAULT '',
  value numeric(18,2) DEFAULT 0,
  stage text DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','proposal','negotiation','won','lost')),
  probability integer DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_close date,
  assigned_to uuid REFERENCES auth.users(id),
  source text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  contact_id uuid REFERENCES contacts(id),
  activity_type text NOT NULL CHECK (activity_type IN ('call','email','meeting','note','task','demo')),
  subject text NOT NULL,
  description text DEFAULT '',
  activity_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 0,
  outcome text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Manufacturing
CREATE TABLE IF NOT EXISTS bill_of_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id uuid NOT NULL REFERENCES products(id),
  version text DEFAULT '1.0',
  description text DEFAULT '',
  production_quantity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES products(id),
  quantity_required numeric(10,3) NOT NULL,
  unit_of_measure text DEFAULT 'each',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  bom_id uuid NOT NULL REFERENCES bill_of_materials(id),
  quantity_planned integer NOT NULL,
  quantity_produced integer DEFAULT 0,
  status text DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','cancelled')),
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid REFERENCES production_orders(id),
  product_id uuid REFERENCES products(id),
  inspection_date date NOT NULL,
  inspector_name text NOT NULL,
  quantity_inspected integer NOT NULL,
  quantity_passed integer NOT NULL,
  quantity_failed integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','passed','failed','conditional')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Cross-functional
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT '',
  file_size integer DEFAULT 0,
  related_table text DEFAULT '',
  related_id text DEFAULT '',
  uploaded_by uuid REFERENCES auth.users(id),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  message text NOT NULL,
  notification_type text DEFAULT 'info' CHECK (notification_type IN ('info','warning','error','success')),
  is_read boolean DEFAULT false,
  related_table text DEFAULT '',
  related_id text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read contacts" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert contacts" ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update contacts" ON contacts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert leads" ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update leads" ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read activities" ON activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert activities" ON activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update activities" ON activities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read bom" ON bill_of_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert bom" ON bill_of_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update bom" ON bill_of_materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read bom_items" ON bom_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert bom_items" ON bom_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update bom_items" ON bom_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read production_orders" ON production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert production_orders" ON production_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update production_orders" ON production_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read quality_inspections" ON quality_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert quality_inspections" ON quality_inspections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update quality_inspections" ON quality_inspections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert documents" ON documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Auth update documents" ON documents FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by) WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users read own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Auth insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
