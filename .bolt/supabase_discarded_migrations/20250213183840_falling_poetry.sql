-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS update_prices_trigger ON products;
DROP FUNCTION IF EXISTS update_prices_at_midnight();
DROP FUNCTION IF EXISTS check_and_update_prices();
DROP FUNCTION IF EXISTS update_all_prices();

-- Create function to update all prices
CREATE OR REPLACE FUNCTION update_all_prices()
RETURNS void AS $$
DECLARE
  updated_count integer;
BEGIN
  WITH price_updates AS (
    UPDATE products
    SET 
      price = tomorrow_price,
      tomorrow_price = NULL,
      price_updated_at = CURRENT_TIMESTAMP
    WHERE 
      tomorrow_price IS NOT NULL AND
      (price_updated_at IS NULL OR DATE_TRUNC('day', price_updated_at) < DATE_TRUNC('day', CURRENT_TIMESTAMP))
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM price_updates;
  
  -- Insert activity log
  IF updated_count > 0 THEN
    INSERT INTO activities (type, description, metadata)
    VALUES (
      'product_update',
      'Automatic price update',
      jsonb_build_object(
        'updated_products', updated_count,
        'update_time', CURRENT_TIMESTAMP
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if prices need updating
CREATE OR REPLACE FUNCTION should_update_prices()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM products
    WHERE tomorrow_price IS NOT NULL
    AND (price_updated_at IS NULL OR DATE_TRUNC('day', price_updated_at) < DATE_TRUNC('day', CURRENT_TIMESTAMP))
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to check and update prices if needed
CREATE OR REPLACE FUNCTION check_and_update_prices()
RETURNS void AS $$
BEGIN
  IF should_update_prices() THEN
    PERFORM update_all_prices();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for individual product updates
CREATE OR REPLACE FUNCTION update_product_price_trigger()
RETURNS trigger AS $$
BEGIN
  -- If tomorrow_price is being set or changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.tomorrow_price IS DISTINCT FROM NEW.tomorrow_price) THEN
    -- Check if we need to update the price immediately
    IF NEW.tomorrow_price IS NOT NULL AND 
       (NEW.price_updated_at IS NULL OR DATE_TRUNC('day', NEW.price_updated_at) < DATE_TRUNC('day', CURRENT_TIMESTAMP)) THEN
      NEW.price := NEW.tomorrow_price;
      NEW.tomorrow_price := NULL;
      NEW.price_updated_at := CURRENT_TIMESTAMP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for individual product updates
CREATE TRIGGER update_product_price_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_price_trigger();

-- Run initial update
SELECT check_and_update_prices();