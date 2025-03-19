-- Create a function to update prices at midnight
CREATE OR REPLACE FUNCTION update_prices_at_midnight()
RETURNS trigger AS $$
BEGIN
  -- Check if it's a new day since the last price update
  IF NEW.price_updated_at IS NULL OR 
     DATE_TRUNC('day', NEW.price_updated_at) < DATE_TRUNC('day', CURRENT_TIMESTAMP) THEN
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_prices_trigger ON products;

-- Create trigger to run before each update or insert
CREATE TRIGGER update_prices_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_prices_at_midnight();

-- Update all existing products to trigger the price update
UPDATE products SET price_updated_at = price_updated_at WHERE tomorrow_price IS NOT NULL;