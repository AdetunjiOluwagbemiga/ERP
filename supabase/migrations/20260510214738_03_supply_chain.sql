
/*
  # Supply Chain & Operations Module

  1. New Tables
    - `warehouses` - Storage locations
    - `product_categories` - Product classification
    - `products` - Product/SKU catalog
    - `inventory` - Stock levels per warehouse
    - `purchase_orders` - POs to vendors
    - `purchase_order_items` - Line items on POs
    - `customer_orders` - Sales/customer orders
    - `customer_order_items` - Line items on customer orders
    - `shipments` - Logistics/delivery tracking

  2. Security - RLS enabled on all tables
*/

CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text DEFAULT '',
  manager_name text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  parent_id uuid REFERENCES product_categories(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES product_categories(id),
  unit_of_measure text DEFAULT 'each',
  unit_cost numeric(18,2) DEFAULT 0,
  unit_price numeric(18,2) DEFAULT 0,
  reorder_point integer DEFAULT 0,
  reorder_quantity integer DEFAULT 0,
  weight_kg numeric(10,3) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  quantity_on_hand integer DEFAULT 0,
  quantity_reserved integer DEFAULT 0,
  quantity_available integer GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  vendor_id uuid REFERENCES vendors(id),
  order_date date NOT NULL,
  expected_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','partial','received','cancelled')),
  subtotal numeric(18,2) DEFAULT 0,
  tax_amount numeric(18,2) DEFAULT 0,
  total_amount numeric(18,2) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity_ordered integer NOT NULL,
  quantity_received integer DEFAULT 0,
  unit_cost numeric(18,2) NOT NULL,
  line_total numeric(18,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text DEFAULT '',
  customer_phone text DEFAULT '',
  order_date date NOT NULL,
  required_date date,
  ship_to_address text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','picking','shipped','delivered','cancelled')),
  subtotal numeric(18,2) DEFAULT 0,
  tax_amount numeric(18,2) DEFAULT 0,
  shipping_cost numeric(18,2) DEFAULT 0,
  total_amount numeric(18,2) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id uuid NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity_ordered integer NOT NULL,
  quantity_shipped integer DEFAULT 0,
  unit_price numeric(18,2) NOT NULL,
  line_total numeric(18,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text UNIQUE NOT NULL,
  customer_order_id uuid REFERENCES customer_orders(id),
  carrier text DEFAULT '',
  ship_date date,
  estimated_delivery date,
  actual_delivery date,
  status text DEFAULT 'pending' CHECK (status IN ('pending','picked_up','in_transit','out_for_delivery','delivered','failed')),
  weight_kg numeric(10,3) DEFAULT 0,
  ship_to_address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read warehouses" ON warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert warehouses" ON warehouses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update warehouses" ON warehouses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read product_categories" ON product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert product_categories" ON product_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update product_categories" ON product_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read inventory" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert inventory" ON inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update inventory" ON inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read purchase_orders" ON purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert purchase_orders" ON purchase_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update purchase_orders" ON purchase_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read purchase_order_items" ON purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert purchase_order_items" ON purchase_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update purchase_order_items" ON purchase_order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read customer_orders" ON customer_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert customer_orders" ON customer_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update customer_orders" ON customer_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read customer_order_items" ON customer_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert customer_order_items" ON customer_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update customer_order_items" ON customer_order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth read shipments" ON shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert shipments" ON shipments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update shipments" ON shipments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
