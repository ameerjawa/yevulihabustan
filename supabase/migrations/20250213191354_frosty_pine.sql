-- Drop existing trigger function
DROP FUNCTION IF EXISTS update_prices_at_interval CASCADE;
DROP FUNCTION IF EXISTS update_prices_at_midnight CASCADE;

-- Create new trigger function for specific time
CREATE OR REPLACE FUNCTION update_prices_at_specific_time()
RETURNS trigger AS $$
BEGIN
  -- Check if it's update time (21:17) and price hasn't been updated today
  IF (CURRENT_TIME AT TIME ZONE 'Asia/Jerusalem')::time >= '21:17:00'::time AND 
     (NEW.price_updated_at IS NULL OR 
      DATE_TRUNC('day', NEW.price_updated_at AT TIME ZONE 'Asia/Jerusalem') < 
      DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem')) THEN
    -- Update the price with tomorrow's price if it exists
    IF NEW.tomorrow_price IS NOT NULL THEN
      NEW.price := NEW.tomorrow_price;
      NEW.tomorrow_price := NULL;
      NEW.price_updated_at := CURRENT_TIMESTAMP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_prices_trigger ON products;

-- Create new trigger
CREATE TRIGGER update_prices_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_prices_at_specific_time();

-- Update all existing products to trigger the price update
UPDATE products SET price_updated_at = price_updated_at WHERE tomorrow_price IS NOT NULL;