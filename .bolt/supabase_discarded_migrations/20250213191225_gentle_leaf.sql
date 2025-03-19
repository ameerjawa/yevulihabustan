-- Drop existing trigger function
DROP FUNCTION IF EXISTS update_prices_at_midnight CASCADE;

-- Create new trigger function for 5 minute intervals
CREATE OR REPLACE FUNCTION update_prices_at_interval()
RETURNS trigger AS $$
BEGIN
  -- Check if 5 minutes have passed since the last price update
  IF NEW.price_updated_at IS NULL OR 
     EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem' - NEW.price_updated_at AT TIME ZONE 'Asia/Jerusalem'))/60 >= 5 THEN
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

-- Create new trigger
CREATE TRIGGER update_prices_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_prices_at_interval();

-- Update all existing products to trigger the price update
UPDATE products SET price_updated_at = price_updated_at WHERE tomorrow_price IS NOT NULL;