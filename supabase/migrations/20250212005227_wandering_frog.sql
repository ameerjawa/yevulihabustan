-- Create product watches table
CREATE TABLE IF NOT EXISTS product_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_watches ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create index for better performance on timestamp queries
CREATE INDEX IF NOT EXISTS idx_product_watches_timestamp ON product_watches(timestamp);