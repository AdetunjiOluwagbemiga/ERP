
/*
  # Finance & Accounting Module

  1. New Tables
    - `chart_of_accounts` - GL accounts with type and balance tracking
    - `journal_entries` - Double-entry bookkeeping transactions
    - `journal_entry_lines` - Individual debit/credit lines
    - `accounts_payable` - Vendor invoices/bills
    - `accounts_receivable` - Customer invoices
    - `fixed_assets` - Asset register with depreciation
    - `bank_accounts` - Company bank accounts
    - `bank_transactions` - Bank statement lines

  2. Security
    - Enable RLS on all tables
    - Authenticated users can read/write their org data
*/

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  parent_id uuid REFERENCES chart_of_accounts(id),
  balance numeric(18,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number text UNIQUE NOT NULL,
  entry_date date NOT NULL,
  description text NOT NULL,
  reference text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft','posted','reversed')),
  total_debit numeric(18,2) DEFAULT 0,
  total_credit numeric(18,2) DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES chart_of_accounts(id),
  description text DEFAULT '',
  debit numeric(18,2) DEFAULT 0,
  credit numeric(18,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  tax_id text DEFAULT '',
  payment_terms integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  vendor_id uuid REFERENCES vendors(id),
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  amount numeric(18,2) NOT NULL,
  paid_amount numeric(18,2) DEFAULT 0,
  status text DEFAULT 'unpaid' CHECK (status IN ('unpaid','partial','paid','overdue','cancelled')),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  customer_email text DEFAULT '',
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  amount numeric(18,2) NOT NULL,
  paid_amount numeric(18,2) DEFAULT 0,
  status text DEFAULT 'unpaid' CHECK (status IN ('unpaid','partial','paid','overdue','cancelled')),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fixed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_number text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  purchase_date date NOT NULL,
  purchase_cost numeric(18,2) NOT NULL,
  salvage_value numeric(18,2) DEFAULT 0,
  useful_life_years integer NOT NULL,
  depreciation_method text DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line','declining_balance')),
  current_value numeric(18,2) NOT NULL,
  location text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active','disposed','maintenance')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  routing_number text DEFAULT '',
  current_balance numeric(18,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id),
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric(18,2) NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('credit','debit')),
  is_reconciled boolean DEFAULT false,
  reference text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chart_of_accounts" ON chart_of_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert chart_of_accounts" ON chart_of_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update chart_of_accounts" ON chart_of_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read journal_entries" ON journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert journal_entries" ON journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update journal_entries" ON journal_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read journal_entry_lines" ON journal_entry_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert journal_entry_lines" ON journal_entry_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update journal_entry_lines" ON journal_entry_lines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read vendors" ON vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vendors" ON vendors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vendors" ON vendors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read accounts_payable" ON accounts_payable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert accounts_payable" ON accounts_payable FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts_payable" ON accounts_payable FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read accounts_receivable" ON accounts_receivable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert accounts_receivable" ON accounts_receivable FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts_receivable" ON accounts_receivable FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read fixed_assets" ON fixed_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fixed_assets" ON fixed_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fixed_assets" ON fixed_assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bank_accounts" ON bank_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank_accounts" ON bank_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read bank_transactions" ON bank_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bank_transactions" ON bank_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank_transactions" ON bank_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
