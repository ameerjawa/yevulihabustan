-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_prices_trigger ON products;
DROP FUNCTION IF EXISTS update_prices_at_midnight;

-- Create improved trigger function with strict timing control
CREATE OR REPLACE FUNCTION update_prices_at_midnight()
RETURNS trigger AS $$
DECLARE
  current_time_israel timestamptz;
  last_update_day date;
  current_day date;
BEGIN
  -- Get current time in Israel
  current_time_israel := CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem';
  
  -- Get the day of last update and current day in Israel timezone
  last_update_day := (NEW.price_updated_at AT TIME ZONE 'Asia/Jerusalem')::date;
  current_day := current_time_israel::date;
  
  -- Only update if:
  -- 1. It's a new day (after midnight)
  -- 2. The last update was on a different day
  -- 3. There is a tomorrow_price set
  IF NEW.tomorrow_price IS NOT NULL AND 
     (NEW.price_updated_at IS NULL OR last_update_day < current_day) THEN
    NEW.price := NEW.tomorrow_price;
    NEW.tomorrow_price := NULL;
    NEW.price_updated_at := current_time_israel;
  ELSE
    -- If we're just updating tomorrow_price, don't touch the current price
    IF TG_OP = 'UPDATE' AND OLD.tomorrow_price IS DISTINCT FROM NEW.tomorrow_price THEN
      NEW.price := OLD.price;
      NEW.price_updated_at := OLD.price_updated_at;
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