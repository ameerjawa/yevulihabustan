-- Add price_unit column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_unit text NOT NULL DEFAULT 'kg' CHECK (price_unit IN ('kg', 'g', 'unit'));

-- Update existing products to use kg as default
UPDATE products SET price_unit = 'kg' WHERE price_unit IS NULL;