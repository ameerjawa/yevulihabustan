-- Add new columns for dynamic pricing
ALTER TABLE products
ADD COLUMN IF NOT EXISTS tomorrow_price decimal(10,2),
ADD COLUMN IF NOT EXISTS price_updated_at timestamptz DEFAULT now();

-- Create function to update prices
CREATE OR REPLACE FUNCTION update_daily_prices()
RETURNS void AS $$
BEGIN
  UPDATE products
  SET 
    price = COALESCE(tomorrow_price, price),
    tomorrow_price = NULL,
    price_updated_at = now()
  WHERE tomorrow_price IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if prices need updating
CREATE OR REPLACE FUNCTION should_update_prices()
RETURNS table (
  price_updated_at timestamptz,
  needs_update boolean
) AS $$
DECLARE
  last_update timestamptz;
BEGIN
  -- Get the oldest price update timestamp
  SELECT MIN(p.price_updated_at) INTO last_update FROM products p;
  
  -- Return the result
  RETURN QUERY
  SELECT 
    last_update as price_updated_at,
    CASE 
      WHEN last_update IS NULL THEN false
      ELSE DATE_TRUNC('day', last_update) < DATE_TRUNC('day', CURRENT_TIMESTAMP)
    END as needs_update;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and update prices
CREATE OR REPLACE FUNCTION check_and_update_prices()
RETURNS void AS $$
DECLARE
  update_info record;
BEGIN
  -- Check if update is needed
  SELECT * INTO update_info FROM should_update_prices();
  
  -- If prices need updating, run the update
  IF update_info.needs_update THEN
    PERFORM update_daily_prices();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_tomorrow_price ON products(tomorrow_price) WHERE tomorrow_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_updated_at ON products(price_updated_at);