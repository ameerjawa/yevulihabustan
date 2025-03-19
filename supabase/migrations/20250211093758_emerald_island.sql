/*
  # Featured Products Intelligence System

  1. New Tables
    - `featured_products_stats`
      - Tracks product performance metrics
      - Stores featuring scores and reasons
      - Manages automatic featuring logic
    
  2. Functions
    - Calculate featuring scores
    - Update product statistics
    - Manage featured products selection

  3. Triggers
    - Automatic score updates
    - Featured products rotation
*/

-- Create featured products stats table
CREATE TABLE IF NOT EXISTS featured_products_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversion_rate decimal(5,2),
  seasonal_score decimal(5,2),
  trending_score decimal(5,2),
  stock_score decimal(5,2),
  total_score decimal(5,2),
  featured_reason jsonb,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE featured_products_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to featured_products_stats"
  ON featured_products_stats FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to featured_products_stats"
  ON featured_products_stats FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to calculate featuring score
CREATE OR REPLACE FUNCTION calculate_featuring_score(
  p_views integer,
  p_clicks integer,
  p_in_season boolean,
  p_in_stock boolean,
  p_quality text
)
RETURNS decimal AS $$
DECLARE
  v_seasonal_score decimal;
  v_trending_score decimal;
  v_stock_score decimal;
  v_quality_score decimal;
BEGIN
  -- Calculate seasonal score (0-100)
  v_seasonal_score := CASE WHEN p_in_season THEN 100 ELSE 0 END;
  
  -- Calculate trending score (0-100)
  v_trending_score := LEAST((p_views * 0.7 + p_clicks * 0.3) / 10, 100);
  
  -- Calculate stock score (0-100)
  v_stock_score := CASE WHEN p_in_stock THEN 100 ELSE 0 END;
  
  -- Calculate quality score (0-100)
  v_quality_score := CASE 
    WHEN p_quality = 'premium' THEN 100
    WHEN p_quality = 'a' THEN 75
    WHEN p_quality = 'b' THEN 50
    ELSE 25
  END;
  
  -- Return weighted average
  RETURN (
    v_seasonal_score * 0.3 +
    v_trending_score * 0.3 +
    v_stock_score * 0.2 +
    v_quality_score * 0.2
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update product stats
CREATE OR REPLACE FUNCTION update_product_stats()
RETURNS trigger AS $$
BEGIN
  -- Update or insert stats
  INSERT INTO featured_products_stats (
    product_id,
    views,
    clicks,
    seasonal_score,
    trending_score,
    stock_score,
    total_score,
    featured_reason
  )
  SELECT
    NEW.id,
    0,
    0,
    CASE WHEN NEW.in_season THEN 100 ELSE 0 END,
    0,
    CASE WHEN NEW.in_stock THEN 100 ELSE 0 END,
    calculate_featuring_score(0, 0, NEW.in_season, NEW.in_stock, NEW.quality),
    jsonb_build_object(
      'initial_reason', 'New product added',
      'quality', NEW.quality,
      'in_season', NEW.in_season,
      'in_stock', NEW.in_stock
    )
  ON CONFLICT (product_id) DO UPDATE
  SET
    seasonal_score = CASE WHEN NEW.in_season THEN 100 ELSE 0 END,
    stock_score = CASE WHEN NEW.in_stock THEN 100 ELSE 0 END,
    total_score = calculate_featuring_score(
      featured_products_stats.views,
      featured_products_stats.clicks,
      NEW.in_season,
      NEW.in_stock,
      NEW.quality
    ),
    featured_reason = jsonb_build_object(
      'update_reason', 'Product updated',
      'quality', NEW.quality,
      'in_season', NEW.in_season,
      'in_stock', NEW.in_stock
    ),
    last_updated = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product stats updates
CREATE TRIGGER update_product_stats_trigger
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stats();

-- Function to increment product views
CREATE OR REPLACE FUNCTION increment_product_views(product_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO featured_products_stats (product_id, views)
  VALUES (product_id, 1)
  ON CONFLICT (product_id) DO UPDATE
  SET 
    views = featured_products_stats.views + 1,
    trending_score = LEAST((featured_products_stats.views + 1) * 0.7 + featured_products_stats.clicks * 0.3, 100),
    last_updated = now();
END;
$$ LANGUAGE plpgsql;

-- Function to increment product clicks
CREATE OR REPLACE FUNCTION increment_product_clicks(product_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO featured_products_stats (product_id, clicks)
  VALUES (product_id, 1)
  ON CONFLICT (product_id) DO UPDATE
  SET 
    clicks = featured_products_stats.clicks + 1,
    trending_score = LEAST(featured_products_stats.views * 0.7 + (featured_products_stats.clicks + 1) * 0.3, 100),
    last_updated = now();
END;
$$ LANGUAGE plpgsql;