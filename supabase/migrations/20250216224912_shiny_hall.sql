-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_prices_trigger ON products;
DROP FUNCTION IF EXISTS update_prices_at_midnight;

-- Create simpler trigger function that focuses on core functionality
CREATE OR REPLACE FUNCTION update_prices_at_midnight()
RETURNS trigger AS $$
DECLARE
  israel_time timestamptz;
  last_update_date date;
  today_date date;
BEGIN
  -- Get current time in Israel
  israel_time := CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem';
  
  -- Get dates for comparison
  last_update_date := COALESCE((NEW.price_updated_at AT TIME ZONE 'Asia/Jerusalem')::date, '1970-01-01'::date);
  today_date := israel_time::date;
  
  -- Only update if:
  -- 1. We have a tomorrow_price
  -- 2. It's a new day
  -- 3. The last update was before today
  -- 4. It's exactly 1 AM (hour = 1)
  IF NEW.tomorrow_price IS NOT NULL 
     AND last_update_date < today_date 
     AND EXTRACT(HOUR FROM israel_time) = 1 THEN
    
    -- Update the price
    NEW.price := NEW.tomorrow_price;
    NEW.tomorrow_price := NULL;
    NEW.price_updated_at := israel_time;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER update_prices_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_prices_at_midnight();

-- Clear any invalid states
UPDATE products 
SET tomorrow_price = NULL 
WHERE tomorrow_price IS NOT NULL 
  AND price_updated_at >= CURRENT_DATE;