/*
  # Add price unit column to products table

  1. Changes
    - Add price_unit column to products table with type text
    - Set default value to 'kg'
    - Add check constraint to ensure valid values
    - Update existing records to use 'kg' as default
*/

-- Add price_unit column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'price_unit'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN price_unit text NOT NULL DEFAULT 'kg' 
    CHECK (price_unit IN ('kg', 'g', 'unit'));
  END IF;
END $$;

-- Update existing records to use 'kg' as default
UPDATE products SET price_unit = 'kg' WHERE price_unit IS NULL;