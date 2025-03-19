-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description text,
  description_en text,
  description_ar text,
  price decimal(10,2) NOT NULL,
  price_unit text NOT NULL DEFAULT 'kg' CHECK (price_unit IN ('kg', 'g', 'unit')),
  category uuid REFERENCES categories(id),
  image text,
  in_stock boolean DEFAULT true,
  quality text CHECK (quality IN ('premium', 'a', 'b', 'c')),
  in_season boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  restaurant_name text NOT NULL,
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  image text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  discount_price decimal(10,2) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Website settings table
CREATE TABLE IF NOT EXISTS website_settings (
  id integer PRIMARY KEY DEFAULT 1,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT website_settings_singleton CHECK (id = 1)
);

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
  DROP POLICY IF EXISTS "Allow admin full access to categories" ON categories;
  DROP POLICY IF EXISTS "Allow public read access to products" ON products;
  DROP POLICY IF EXISTS "Allow admin full access to products" ON products;
  DROP POLICY IF EXISTS "Allow public read access to approved reviews" ON reviews;
  DROP POLICY IF EXISTS "Allow admin full access to reviews" ON reviews;
  DROP POLICY IF EXISTS "Allow public read access to active promotions" ON promotions;
  DROP POLICY IF EXISTS "Allow admin full access to promotions" ON promotions;
  DROP POLICY IF EXISTS "Allow public read access to website settings" ON website_settings;
  DROP POLICY IF EXISTS "Allow admin full access to website settings" ON website_settings;
END $$;

-- Create policies
CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to approved reviews"
  ON reviews FOR SELECT
  TO public
  USING (is_approved = true);

CREATE POLICY "Allow admin full access to reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to active promotions"
  ON promotions FOR SELECT
  TO public
  USING (end_date >= CURRENT_TIMESTAMP);

CREATE POLICY "Allow admin full access to promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to website settings"
  ON website_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to website settings"
  ON website_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default website settings if not exists
INSERT INTO website_settings (id, settings)
VALUES (1, '{
  "show_language_switcher": true,
  "default_language": "he",
  "available_languages": ["he", "en", "ar"],
  "site_name": "יבולי הבוסתן",
  "contact_email": "contact@example.com",
  "contact_phone": "050-XXX-XXXX",
  "whatsapp_number": "972XXXXXXXXX",
  "show_reviews_section": true,
  "show_featured_products": true,
  "show_promotions": true,
  "business_hours": {
    "sunday": "06:00 - 17:00",
    "monday": "06:00 - 17:00",
    "tuesday": "06:00 - 17:00",
    "wednesday": "06:00 - 17:00",
    "thursday": "06:00 - 17:00",
    "friday": "06:00 - 14:00",
    "saturday": "סגור"
  }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;