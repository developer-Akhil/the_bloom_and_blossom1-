-- ==============================================================================
-- The Bloom & Blossom - Consolidated Unified Database Schema
-- Target Schema: bb_ecommerce_sc
-- ==============================================================================
-- This script contains all necessary tables, triggers, indexes, permissions,
-- and policies to run the entire storefront (including Auth, Reviews, and Payments).
--
-- Execute this entire script in your Supabase SQL Editor.
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS bb_ecommerce_sc;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant usage on schema to required roles
GRANT USAGE ON SCHEMA bb_ecommerce_sc TO postgres, anon, authenticated, service_role;


-- ==============================================================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ==============================================================================

-- 1.1 Custom App Users (Custom Email Verification Flow)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "isVerified" BOOLEAN DEFAULT FALSE,
  "verificationToken" TEXT,
  "tokenExpiry" TIMESTAMPTZ,
  full_name TEXT,
  phone TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- For existing app_users table, ensure columns are added:
ALTER TABLE bb_ecommerce_sc.app_users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE bb_ecommerce_sc.app_users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 1.2 Profiles Table (Automatically synced with auth.users)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  has_used_first_discount BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.3 Admin Users Table (Custom quick-fix prototype auth)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ==============================================================================
-- 2. STORE CATALOG & PRODUCTS
-- ==============================================================================

-- 2.1 Categories Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.2 Products Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES bb_ecommerce_sc.categories(id),
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_customizable BOOLEAN DEFAULT false,
  rating DECIMAL(2, 1) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.3 Dynamic Pricing Lookup Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.dynamic_prices (
  product_id TEXT PRIMARY KEY,
  price DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.4 Product Availability Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.product_availability (
  product_id TEXT PRIMARY KEY,
  in_stock BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.5 Product Attributes Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.product_attributes (
  product_id TEXT PRIMARY KEY,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  is_on_sale BOOLEAN DEFAULT FALSE,
  is_festival BOOLEAN DEFAULT FALSE,
  original_price DECIMAL(10, 2),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Idempotent column check for existing databases:
ALTER TABLE bb_ecommerce_sc.product_attributes ADD COLUMN IF NOT EXISTS is_festival BOOLEAN DEFAULT FALSE;
ALTER TABLE bb_ecommerce_sc.product_attributes ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE bb_ecommerce_sc.product_attributes ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE;
ALTER TABLE bb_ecommerce_sc.product_attributes ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE bb_ecommerce_sc.product_attributes ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);
ALTER TABLE bb_ecommerce_sc.product_attributes ADD COLUMN IF NOT EXISTS description TEXT;

-- 2.6 Store Global Settings Table (Festival drop configuration, banners, announcements)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.7 Wishlist Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES bb_ecommerce_sc.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id)
);


-- ==============================================================================
-- 3. ORDERS & SALES
-- ==============================================================================

-- 3.1 Orders Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_phone TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_applied DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  order_status TEXT DEFAULT 'processing', -- processing, shipped, delivered, cancelled
  shipping_address JSONB,
  payment_id TEXT, -- Payment gateway transaction ID
  product_name TEXT,
  product_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3.2 Order Items Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES bb_ecommerce_sc.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES bb_ecommerce_sc.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  customization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ==============================================================================
-- 4. PRODUCT REVIEW SYSTEM
-- ==============================================================================

-- 4.1 Product Reviews Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.product_reviews (
  review_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_variant_id TEXT,
  order_id TEXT NOT NULL,
  order_item_id TEXT,
  user_id UUID NOT NULL REFERENCES bb_ecommerce_sc.app_users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'hidden'
  helpful_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Review Images Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.review_images (
  image_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES bb_ecommerce_sc.product_reviews(review_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT
);

-- 4.3 Review Helpful Table (prevents duplicate voting)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.review_helpful (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES bb_ecommerce_sc.product_reviews(review_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES bb_ecommerce_sc.app_users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL, -- 'helpful' or 'unhelpful'
  CONSTRAINT unique_review_user_vote UNIQUE (review_id, user_id)
);

-- 4.4 Review Reports Table
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.review_reports (
  report_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES bb_ecommerce_sc.product_reviews(review_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES bb_ecommerce_sc.app_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 'Spam', 'Offensive', 'Fake Review', 'Other'
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.5 Customer Feedback Requests Table (Direct & Indirect customer outreach)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.feedback_requests (
  feedback_request_id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES bb_ecommerce_sc.app_users(id) ON DELETE SET NULL,
  order_id TEXT, -- nullable
  source TEXT NOT NULL DEFAULT 'WEBSITE', -- WEBSITE, INSTAGRAM, FACEBOOK, WHATSAPP, PHONE, WALK_IN, OTHER
  feedback_type TEXT NOT NULL DEFAULT 'INDIRECT', -- DIRECT, INDIRECT
  product_id TEXT,
  product_name TEXT,
  customer_name TEXT,
  mobile_number TEXT,
  email_address TEXT,
  notes TEXT,
  request_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED
  feedback_link_token TEXT UNIQUE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.6 Customer Feedback Table (Works with or without website orders)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.feedback (
  feedback_id TEXT PRIMARY KEY,
  feedback_request_id TEXT REFERENCES bb_ecommerce_sc.feedback_requests(feedback_request_id) ON DELETE SET NULL,
  customer_id UUID REFERENCES bb_ecommerce_sc.app_users(id) ON DELETE SET NULL,
  order_id TEXT, -- nullable
  feedback_type TEXT NOT NULL DEFAULT 'INDIRECT', -- DIRECT, INDIRECT
  source TEXT NOT NULL DEFAULT 'WEBSITE',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  customer_name TEXT,
  mobile_number TEXT,
  email_address TEXT,
  product_name TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  google_review_status TEXT DEFAULT 'not_submitted', -- submitted, not_submitted, unknown, clicked, skipped
  google_review_notes TEXT
);

-- 4.7 Google Reviews Tracking Table (Separately tracked from website feedback)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.google_reviews (
  google_review_id TEXT PRIMARY KEY,
  feedback_id TEXT REFERENCES bb_ecommerce_sc.feedback(feedback_id) ON DELETE CASCADE,
  feedback_request_id TEXT REFERENCES bb_ecommerce_sc.feedback_requests(feedback_request_id) ON DELETE SET NULL,
  google_review_reference TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, not_submitted, unknown
  review_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_source ON bb_ecommerce_sc.feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON bb_ecommerce_sc.feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON bb_ecommerce_sc.feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_token ON bb_ecommerce_sc.feedback_requests(feedback_link_token);



-- ==============================================================================
-- 5. PAYMENT & GATEWAY PROCESSING (Razorpay, etc.)
-- ==============================================================================

-- 5.1 Payment Orders (Intent to pay, Razorpay order)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    internal_order_id VARCHAR(100) NOT NULL,
    gateway_order_id VARCHAR(100) UNIQUE,
    gateway_provider VARCHAR(50) DEFAULT 'razorpay',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'created', -- 'created', 'attempted', 'paid', 'failed'
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5.2 Payment Transactions (Actual attempts and captures)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_order_id UUID REFERENCES bb_ecommerce_sc.payment_orders(id) ON DELETE CASCADE,
    gateway_transaction_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL,                -- 'created', 'authorized', 'captured', 'refunded', 'failed'
    method VARCHAR(50),                         -- 'card', 'netbanking', 'wallet', 'emi', 'upi'
    method_details JSONB,
    error_code VARCHAR(100),
    error_description TEXT,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5.3 Webhook Events (Idempotency and background reconciliation)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_provider VARCHAR(50) DEFAULT 'razorpay',
    event_type VARCHAR(100) NOT NULL,
    gateway_event_id VARCHAR(100) UNIQUE,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',       -- 'pending', 'processed', 'failed'
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 5.4 Refunds
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.payment_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_transaction_id UUID REFERENCES bb_ecommerce_sc.payment_transactions(id) ON DELETE CASCADE,
    gateway_refund_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL,                -- 'pending', 'processed', 'failed'
    reason VARCHAR(255),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5.5 Settlements (Gateway bank transfers)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.payment_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_settlement_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    fees DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL,                -- 'created', 'processed', 'failed'
    details JSONB,
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5.6 Payment Audit Logs (Ledger of actions)
CREATE TABLE IF NOT EXISTS bb_ecommerce_sc.payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100),
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==============================================================================
-- 6. PERMISSIONS & GRANTS
-- ==============================================================================

-- General Access
GRANT USAGE ON SCHEMA bb_ecommerce_sc TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA bb_ecommerce_sc TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA bb_ecommerce_sc TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA bb_ecommerce_sc TO anon, authenticated, service_role;

-- Specific Table Grants
GRANT ALL ON TABLE bb_ecommerce_sc.app_users TO service_role;
GRANT ALL ON TABLE bb_ecommerce_sc.product_reviews TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE bb_ecommerce_sc.review_images TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE bb_ecommerce_sc.review_helpful TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE bb_ecommerce_sc.review_reports TO postgres, service_role, anon, authenticated;


-- ==============================================================================
-- 7. PERFORMANCE INDEXES
-- ==============================================================================

-- Reviews System Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON bb_ecommerce_sc.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON bb_ecommerce_sc.product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON bb_ecommerce_sc.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON bb_ecommerce_sc.review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON bb_ecommerce_sc.review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON bb_ecommerce_sc.review_reports(review_id);

-- Payment System Indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_gateway_id ON bb_ecommerce_sc.payment_orders(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON bb_ecommerce_sc.payment_transactions(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON bb_ecommerce_sc.payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_status ON bb_ecommerce_sc.payment_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_gateway_id ON bb_ecommerce_sc.payment_refunds(gateway_refund_id);
CREATE INDEX IF NOT EXISTS idx_payment_settlements_gateway_id ON bb_ecommerce_sc.payment_settlements(gateway_settlement_id);


-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE bb_ecommerce_sc.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_ecommerce_sc.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_ecommerce_sc.dynamic_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_ecommerce_sc.product_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_ecommerce_sc.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_ecommerce_sc.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_ecommerce_sc.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_ecommerce_sc.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_ecommerce_sc.app_users ENABLE ROW LEVEL SECURITY;

-- 8.1 Custom App Users Policy
CREATE POLICY "Deny all access to app_users from client" 
ON bb_ecommerce_sc.app_users FOR ALL TO PUBLIC USING (false);

-- 8.2 Profiles Policies
CREATE POLICY "Users can view own profile" ON bb_ecommerce_sc.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON bb_ecommerce_sc.profiles FOR UPDATE USING (auth.uid() = id);

-- 8.3 Admin Users Policy
CREATE POLICY "Admin users check" ON bb_ecommerce_sc.admin_users FOR SELECT USING (true);

-- 8.4 Dynamic Prices Policies
CREATE POLICY "Dynamic prices are readable by everyone" ON bb_ecommerce_sc.dynamic_prices FOR SELECT USING (true);
CREATE POLICY "Dynamic prices can be updated by authenticated users in admin board" ON bb_ecommerce_sc.dynamic_prices FOR ALL USING (auth.role() = 'authenticated');

-- 8.5 Product Availability Policies
CREATE POLICY "Product availability is readable by everyone" ON bb_ecommerce_sc.product_availability FOR SELECT USING (true);
CREATE POLICY "Product availability can be updated by authenticated users" ON bb_ecommerce_sc.product_availability FOR ALL USING (auth.role() = 'authenticated');

-- 8.6 Product Attributes Policies
CREATE POLICY "Product attributes are readable by everyone" ON bb_ecommerce_sc.product_attributes FOR SELECT USING (true);
CREATE POLICY "Product attributes can be updated by authenticated users" ON bb_ecommerce_sc.product_attributes FOR ALL USING (auth.role() = 'authenticated');

-- 8.7 Store Global Settings Policies
CREATE POLICY "Store settings are readable by everyone" ON bb_ecommerce_sc.store_settings FOR SELECT USING (true);
CREATE POLICY "Store settings can be updated by authenticated users" ON bb_ecommerce_sc.store_settings FOR ALL USING (auth.role() = 'authenticated');

-- 8.8 Orders Policies
CREATE POLICY "Users can view own orders" ON bb_ecommerce_sc.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON bb_ecommerce_sc.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- ==============================================================================
-- 9. TRIGGERS, FUNCTIONS, AND SEED DATA
-- ==============================================================================

-- 9.1 Automatic Profile Creation on Auth Signup
CREATE OR REPLACE FUNCTION bb_ecommerce_sc.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO bb_ecommerce_sc.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE bb_ecommerce_sc.handle_new_user();

-- 9.2 Seed Default Admin User
INSERT INTO bb_ecommerce_sc.admin_users (username, password) 
VALUES ('admin', 'bloom_admin_2024')
ON CONFLICT (username) DO NOTHING;


-- ==============================================================================
-- 10. SCHEMA CACHE REFRESH
-- ==============================================================================
-- Notify PostgREST to reload its schema cache to immediately expose these tables/views
NOTIFY pgrst, 'reload schema';

