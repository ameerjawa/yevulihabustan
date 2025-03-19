/*
  # Add Performance Optimizations

  1. Indexes
    - Single column indexes for common filters
    - Composite indexes for common filter combinations
  
  2. Functions
    - is_promotion_active: Helper function to check promotion validity
*/

-- Add indexes for performance
DO $$ 
BEGIN
  -- Single column indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_category') THEN
    CREATE INDEX idx_products_category ON products(category);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_quality') THEN
    CREATE INDEX idx_products_quality ON products(quality);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_in_stock') THEN
    CREATE INDEX idx_products_in_stock ON products(in_stock);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_in_season') THEN
    CREATE INDEX idx_products_in_season ON products(in_season);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_promotions_product_id') THEN
    CREATE INDEX idx_promotions_product_id ON promotions(product_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_promotions_dates') THEN
    CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_is_approved') THEN
    CREATE INDEX idx_reviews_is_approved ON reviews(is_approved);
  END IF;

  -- Composite indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_stock_season') THEN
    CREATE INDEX idx_products_stock_season ON products(in_stock, in_season);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_category_stock') THEN
    CREATE INDEX idx_products_category_stock ON products(category, in_stock);
  END IF;
END $$;

-- Function to check if a promotion is active
CREATE OR REPLACE FUNCTION is_promotion_active(promotion_row promotions)
RETURNS boolean AS $$
BEGIN
  RETURN 
    promotion_row.start_date <= CURRENT_TIMESTAMP AND
    promotion_row.end_date >= CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;