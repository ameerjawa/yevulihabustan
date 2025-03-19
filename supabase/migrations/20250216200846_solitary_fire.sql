-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_prices_trigger ON products;
DROP FUNCTION IF EXISTS update_prices_at_midnight;

-- Create improved trigger function with strict timing and logging
CREATE OR REPLACE FUNCTION update_prices_at_midnight()
RETURNS trigger AS $$
DECLARE
  current_time_israel timestamptz;
  last_update_day date;
  current_day date;
  is_midnight_passed boolean;
BEGIN
  -- Get current time in Israel
  current_time_israel := CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem';
  
  -- Get the day of last update and current day in Israel timezone
  last_update_day := COALESCE((NEW.price_updated_at AT TIME ZONE 'Asia/Jerusalem')::date, '1970-01-01'::date);
  current_day := current_time_israel::date;
  
  -- Check if we've passed midnight (between 00:00 and 06:00)
  is_midnight_passed := EXTRACT(HOUR FROM current_time_israel) >= 0 
                       AND EXTRACT(HOUR FROM current_time_israel) < 6;

  -- Log the update attempt
  INSERT INTO activities (
    type,
    description,
    metadata
  ) VALUES (
    'product_update',
    'Price update attempt for product ' || NEW.name,
    jsonb_build_object(
      'product_id', NEW.id,
      'current_price', NEW.price,
      'tomorrow_price', NEW.tomorrow_price,
      'current_time', current_time_israel,
      'last_update_day', last_update_day,
      'current_day', current_day,
      'is_midnight_passed', is_midnight_passed
    )
  );

  -- Only update prices if:
  -- 1. We have a tomorrow_price set
  -- 2. It's a new day AND we're in the midnight window (00:00-06:00)
  -- 3. The last price update was before today
  IF NEW.tomorrow_price IS NOT NULL 
     AND is_midnight_passed 
     AND last_update_day < current_day THEN
    
    -- Log the actual price update
    INSERT INTO activities (
      type,
      description,
      metadata
    ) VALUES (
      'product_update',
      'Price updated for product ' || NEW.name,
      jsonb_build_object(
        'product_id', NEW.id,
        'old_price', NEW.price,
        'new_price', NEW.tomorrow_price,
        'update_time', current_time_israel
      )
    );

    -- Perform the update
    NEW.price := NEW.tomorrow_price;
    NEW.tomorrow_price := NULL;
    NEW.price_updated_at := current_time_israel;
  ELSE
    -- If we're just updating tomorrow_price, preserve the current price
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

-- Clear any invalid states
UPDATE products 
SET tomorrow_price = NULL 
WHERE tomorrow_price IS NOT NULL 
  AND price_updated_at >= CURRENT_DATE;