/*
  # Add Activities Table

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `type` (text, activity type)
      - `description` (text)
      - `metadata` (jsonb)
      - `actor` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `activities` table
    - Add policies for public and admin access
*/

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('product_view', 'product_update', 'category_update', 'review', 'promotion', 'settings_update')),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  actor text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to insert activities"
  ON activities
  FOR INSERT
  TO public
  WITH CHECK (type = 'product_view');

CREATE POLICY "Allow admin to read activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to insert activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type_created_at ON activities(type, created_at DESC);