-- Create product watches table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  ALTER TABLE product_watches ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public to insert product watches" ON product_watches;
  DROP POLICY IF EXISTS "Allow admin to read product watches" ON product_watches;
END $$;

-- Create new policies
CREATE POLICY "Allow public to insert product watches"
  ON product_watches
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow admin to read product watches"
  ON product_watches
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_product_watches_timestamp ON product_watches(timestamp);