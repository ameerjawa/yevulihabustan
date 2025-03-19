/*
  # Add website settings table

  1. New Tables
    - `website_settings`
      - `id` (integer, primary key)
      - `settings` (jsonb, stores all website configuration)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `website_settings` table
    - Add policy for public read access
    - Add policy for admin write access
*/

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS website_settings (
  id integer PRIMARY KEY DEFAULT 1,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public read access to website settings" ON website_settings;
  DROP POLICY IF EXISTS "Allow admin full access to website settings" ON website_settings;
END $$;

-- Create new policies
CREATE POLICY "Allow public read access to website settings"
  ON website_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to website settings"
  ON website_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure only one row exists
DO $$ 
BEGIN
  DROP INDEX IF EXISTS website_settings_singleton;
  CREATE UNIQUE INDEX website_settings_singleton ON website_settings ((id = 1));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_website_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_website_settings_timestamp ON website_settings;
END $$;

-- Create new trigger
CREATE TRIGGER update_website_settings_timestamp
  BEFORE UPDATE ON website_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_website_settings_updated_at();

-- Insert default settings if not exists
INSERT INTO website_settings (id, settings)
VALUES (1, '{
  "show_language_switcher": true,
  "default_language": "he",
  "available_languages": ["he", "en", "ar"],
  "site_name": "יבולי הבוסתן",
  "contact_email": "contact@example.com",
  "contact_phone": "050-XXX-XXXX",
  "whatsapp_number": "972XXXXXXXXX",
  "show_reviews_section": true,
  "show_featured_products": true,
  "show_promotions": true,
  "business_hours": {
    "sunday": "06:00 - 17:00",
    "monday": "06:00 - 17:00",
    "tuesday": "06:00 - 17:00",
    "wednesday": "06:00 - 17:00",
    "thursday": "06:00 - 17:00",
    "friday": "06:00 - 14:00",
    "saturday": "סגור"
  }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;