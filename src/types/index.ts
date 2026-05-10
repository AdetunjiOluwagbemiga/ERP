export interface User {
  id: string
  email: string
}

export interface ChartOfAccount {
  id: string
  code: string
  name: string
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  balance: number
  is_active: boolean
  created_at: string
}

export interface JournalEntry {
  id: string
  entry_number: string
  entry_date: string
  description: string
  reference: string
  status: 'draft' | 'posted' | 'reversed'
  total_debit: number
  total_credit: number
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  payment_terms: number
  is_active: boolean
  created_at: string
}

export interface AccountsPayable {
  id: string
  invoice_number: string
  vendor_id: string
  invoice_date: string
  due_date: string
  amount: number
  paid_amount: number
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  description: string
  vendors?: { name: string }
}

export interface AccountsReceivable {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string
  invoice_date: string
  due_date: string
  amount: number
  paid_amount: number
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  description: string
}

export interface FixedAsset {
  id: string
  asset_number: string
  name: string
  category: string
  purchase_date: string
  purchase_cost: number
  current_value: number
  useful_life_years: number
  depreciation_method: string
  status: 'active' | 'disposed' | 'maintenance'
  location: string
}

export interface BankAccount {
  id: string
  account_name: string
  bank_name: string
  account_number: string
  current_balance: number
  currency: string
  is_active: boolean
}

export interface Department {
  id: string
  name: string
  code: string
  budget: number
  is_active: boolean
}

export interface Employee {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  job_title: string
  employment_type: string
  hire_date: string
  salary: number
  status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  departments?: { name: string }
  department_id: string | null
}

export interface PayrollRun {
  id: string
  period_start: string
  period_end: string
  pay_date: string
  status: 'draft' | 'processing' | 'completed' | 'cancelled'
  total_gross: number
  total_net: number
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  employees?: { first_name: string; last_name: string }
  leave_types?: { name: string }
}

export interface JobPosting {
  id: string
  title: string
  department_id: string | null
  description: string
  salary_min: number | null
  salary_max: number | null
  employment_type: string
  location: string
  status: 'draft' | 'published' | 'closed' | 'cancelled'
  posted_date: string | null
  departments?: { name: string }
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string
  unit_cost: number
  unit_price: number
  reorder_point: number
  is_active: boolean
  product_categories?: { name: string }
  category_id: string | null
}

export interface Inventory {
  id: string
  product_id: string
  warehouse_id: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  products?: { name: string; sku: string }
  warehouses?: { name: string }
}

export interface PurchaseOrder {
  id: string
  po_number: string
  vendor_id: string | null
  order_date: string
  expected_date: string | null
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
  total_amount: number
  notes: string
  vendors?: { name: string }
}

export interface CustomerOrder {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  order_date: string
  status: 'pending' | 'confirmed' | 'picking' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  notes: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  job_title: string
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: string
  title: string
  company: string
  value: number
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  probability: number
  expected_close: string | null
  contacts?: { first_name: string; last_name: string }
  contact_id: string | null
}

export interface BillOfMaterials {
  id: string
  finished_product_id: string
  version: string
  description: string
  production_quantity: number
  is_active: boolean
  products?: { name: string; sku: string }
}

export interface ProductionOrder {
  id: string
  order_number: string
  bom_id: string
  quantity_planned: number
  quantity_produced: number
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  planned_start: string | null
  planned_end: string | null
  bill_of_materials?: { finished_product_id: string; products?: { name: string } }
}

export interface Notification {
  id: string
  title: string
  message: string
  notification_type: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  created_at: string
}
