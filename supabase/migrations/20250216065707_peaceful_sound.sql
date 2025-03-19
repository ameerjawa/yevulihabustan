-- Clear all tomorrow_price values that have already been applied
UPDATE products 
SET tomorrow_price = NULL 
WHERE tomorrow_price IS NOT NULL;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_prices_trigger ON products;
DROP FUNCTION IF EXISTS update_prices_at_midnight;

-- Create improved trigger function
CREATE OR REPLACE FUNCTION update_prices_at_midnight()
RETURNS trigger AS $$
BEGIN
  -- Check if it's a new day (after midnight) and price hasn't been updated today
  IF (NEW.price_updated_at IS NULL OR 
      DATE_TRUNC('day', NEW.price_updated_at AT TIME ZONE 'Asia/Jerusalem') < 
      DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem')) THEN
    -- Update the price with tomorrow's price if it exists
    IF NEW.tomorrow_price IS NOT NULL THEN
      NEW.price := NEW.tomorrow_price;
      NEW.tomorrow_price := NULL;  -- Explicitly clear tomorrow_price
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
  EXECUTE FUNCTION update_prices_at_midnight();