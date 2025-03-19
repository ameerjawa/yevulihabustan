-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS check_prices_trigger ON products;
DROP FUNCTION IF EXISTS check_and_update_prices();
DROP FUNCTION IF EXISTS update_all_prices();

-- Create a function to update all prices
CREATE OR REPLACE FUNCTION update_all_prices()
RETURNS void AS $$
BEGIN
  UPDATE products
  SET 
    price = tomorrow_price,
    tomorrow_price = NULL,
    price_updated_at = CURRENT_TIMESTAMP
  WHERE 
    tomorrow_price IS NOT NULL AND
    (price_updated_at IS NULL OR DATE_TRUNC('day', price_updated_at) < DATE_TRUNC('day', CURRENT_TIMESTAMP));
END;
$$ LANGUAGE plpgsql;

-- Create a function that checks and updates prices if needed
CREATE OR REPLACE FUNCTION check_and_update_prices()
RETURNS void AS $$
BEGIN
  -- Check if it's a new day
  IF EXISTS (
    SELECT 1 FROM products
    WHERE price_updated_at IS NULL 
       OR DATE_TRUNC('day', price_updated_at) < DATE_TRUNC('day', CURRENT_TIMESTAMP)
  ) THEN
    -- Update prices for all products that need updating
    PERFORM update_all_prices();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Run initial update to fix any outdated prices
SELECT update_all_prices();