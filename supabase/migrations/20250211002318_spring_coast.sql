/*
  # Initial Database Setup

  1. New Tables
    - categories: Product categories with multilingual support
    - products: Main products table with category references
    - reviews: Customer reviews and testimonials
    - promotions: Time-based product promotions
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public and authenticated access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table (must be created first due to foreign key reference)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description text,
  description_en text,
  description_ar text,
  price decimal(10,2) NOT NULL,
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id),
  discount_price decimal(10,2) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for products
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for reviews
CREATE POLICY "Allow public read access to approved reviews"
  ON reviews FOR SELECT
  TO public
  USING (is_approved = true);

CREATE POLICY "Allow admin full access to reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for promotions
CREATE POLICY "Allow public read access to active promotions"
  ON promotions FOR SELECT
  TO public
  USING (end_date >= CURRENT_TIMESTAMP);

CREATE POLICY "Allow admin full access to promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);