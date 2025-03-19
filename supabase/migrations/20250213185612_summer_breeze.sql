-- Set timezone to Israel
ALTER DATABASE postgres SET timezone TO 'Asia/Jerusalem';

-- Update existing trigger function to use Israel timezone
CREATE OR REPLACE FUNCTION update_prices_at_midnight()
RETURNS trigger AS $$
BEGIN
  -- Check if it's a new day since the last price update using Israel timezone
  IF NEW.price_updated_at IS NULL OR 
     DATE_TRUNC('day', NEW.price_updated_at AT TIME ZONE 'Asia/Jerusalem') < 
     DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem') THEN
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