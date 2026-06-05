-- =============================================
-- ANTAR SCENTS — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  phone text,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  handle text UNIQUE NOT NULL,
  body_html text,
  vendor text,
  product_type text,
  tags text[],
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  images jsonb DEFAULT '[]',
  variants jsonb DEFAULT '[]',
  buying_price decimal(10,2),
  selling_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number serial UNIQUE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  delivery_name text,
  delivery_phone text,
  delivery_matatu_route text,
  delivery_notes text,
  items jsonb NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  delivery_fee decimal(10,2) NOT NULL DEFAULT 200,
  total decimal(10,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('mpesa_till','mpesa_stk','paystack_card','paystack_mobile')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed')),
  mpesa_code text,
  mpesa_checkout_id text,
  paystack_reference text,
  order_status text DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FAVOURITES
CREATE TABLE IF NOT EXISTS favourites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- BROWSING HISTORY
CREATE TABLE IF NOT EXISTS browsing_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id text,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- SEED DEFAULT SETTINGS
-- =============================================
INSERT INTO settings (key, value) VALUES
  ('whatsapp_number', '254792274842'),
  ('contact_email', 'info@antarscents.shop'),
  ('shop_name', 'Antar Scents'),
  ('tagline', 'Discover Your Signature Scent'),
  ('announcement_bar', '🚚 Free delivery on orders above KES 5,000 | 📞 +254922748842'),
  ('mpesa_till_number', '000000'),
  ('delivery_fee_cbd', '200'),
  ('delivery_fee_nairobi', '300'),
  ('delivery_fee_outside', '500'),
  ('delivery_fee_far', '1000')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE browsing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read active products
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (status = 'active');

-- Products: service role can do anything (handled by backend using service role key)
CREATE POLICY "Service role full access products" ON products
  USING (auth.role() = 'service_role');

-- Settings: anyone can read
CREATE POLICY "Public read settings" ON settings
  FOR SELECT USING (true);

-- Settings: service role can modify
CREATE POLICY "Service role modify settings" ON settings
  USING (auth.role() = 'service_role');

-- Orders: service role full access (backend uses service role key)
CREATE POLICY "Service role full access orders" ON orders
  USING (auth.role() = 'service_role');

-- Favourites: service role full access
CREATE POLICY "Service role full access favourites" ON favourites
  USING (auth.role() = 'service_role');

-- Users: service role full access
CREATE POLICY "Service role full access users" ON users
  USING (auth.role() = 'service_role');

-- Browsing history: service role full access
CREATE POLICY "Service role full access browsing" ON browsing_history
  USING (auth.role() = 'service_role');

-- =============================================
-- INDEXES (for performance)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_handle ON products(handle);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_browsing_user_id ON browsing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_session_id ON browsing_history(session_id);
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON favourites(user_id);

-- PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT one_token_per_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);

-- RLS for password_reset_tokens (service role only)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access prt" ON password_reset_tokens
  USING (auth.role() = 'service_role');

-- =============================================
-- STORAGE BUCKET
-- Create in the Supabase dashboard:
-- Storage > New bucket > "product-images" > Public = true
-- =============================================

-- =============================================
-- SCHEMA ADDITIONS & OPTIMIZATIONS
-- All statements are idempotent (safe to re-run)
-- =============================================

-- 1. Missing column: users.email_verified
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- 2. Missing table: email_verification_tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT one_evt_per_user UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_verification_tokens' AND policyname = 'Service role full access evt'
  ) THEN
    CREATE POLICY "Service role full access evt" ON email_verification_tokens
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 3. Missing table: categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public read active categories'
  ) THEN
    CREATE POLICY "Public read active categories" ON categories
      FOR SELECT USING (active = true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Service role full access categories'
  ) THEN
    CREATE POLICY "Service role full access categories" ON categories
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 4. Missing indexes: products (query filtering and sorting)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON products(selling_price);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
-- Composite: most product list queries filter status then sort created_at
CREATE INDEX IF NOT EXISTS idx_products_status_created_at ON products(status, created_at DESC);

-- 5. Missing indexes: browsing_history
CREATE INDEX IF NOT EXISTS idx_browsing_product_id ON browsing_history(product_id);
-- viewed_at used in ORDER BY DESC for recommendation history queries
CREATE INDEX IF NOT EXISTS idx_browsing_viewed_at ON browsing_history(viewed_at DESC);

-- 6. Missing index: favourites.product_id (FK + delete path)
CREATE INDEX IF NOT EXISTS idx_favourites_product_id ON favourites(product_id);

-- 7. Missing indexes: orders (payment callback lookups + dashboard aggregation)
-- Partial indexes keep them small: only rows that have these values set
CREATE INDEX IF NOT EXISTS idx_orders_mpesa_checkout_id ON orders(mpesa_checkout_id)
  WHERE mpesa_checkout_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_mpesa_code ON orders(mpesa_code)
  WHERE mpesa_code IS NOT NULL;
-- Composite: dashboard queries always filter payment_status then sort by date
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at ON orders(payment_status, created_at DESC);

-- 8. Seed footer settings (new admin-editable keys)
INSERT INTO settings (key, value) VALUES
  ('footer_description', 'Premium fragrances curated for every personality. Genuine products delivered across Kenya.'),
  ('footer_copyright', '© 2025 Antar Scents. All rights reserved.'),
  ('footer_email', 'info@antarscents.shop'),
  ('footer_phone', '+254 792 274 842'),
  ('footer_whatsapp', '254792274842'),
  ('footer_location', 'Nairobi, Kenya'),
  ('footer_hours', 'Mon–Sat, 8AM–8PM'),
  ('footer_instagram', 'https://instagram.com'),
  ('footer_facebook', 'https://facebook.com'),
  ('footer_tiktok', 'https://tiktok.com'),
  ('footer_twitter', 'https://twitter.com')
ON CONFLICT (key) DO NOTHING;
