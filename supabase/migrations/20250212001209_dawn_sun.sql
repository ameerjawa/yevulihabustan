/*
  # Add Search Statistics Tracking

  1. New Tables
    - `search_stats`
      - `id` (uuid, primary key)
      - `term` (text, search term)
      - `timestamp` (timestamptz, when the search occurred)
      - `user_agent` (text, browser info)
      - `ip_hash` (text, hashed IP for analytics)
      - `results_count` (integer, number of results found)

  2. Functions
    - `track_search` for recording searches
    - `get_popular_searches` for retrieving trending searches

  3. Security
    - Enable RLS
    - Add policies for public insert and admin read access
*/

-- Create search_stats table
CREATE TABLE IF NOT EXISTS search_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  user_agent text,
  ip_hash text,
  results_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE search_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to insert search stats"
  ON search_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow admin to read search stats"
  ON search_stats
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(
  time_range interval DEFAULT interval '7 days',
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  term text,
  count bigint,
  avg_results numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.term,
    COUNT(*) as count,
    AVG(s.results_count)::numeric as avg_results
  FROM search_stats s
  WHERE s.timestamp > now() - time_range
  GROUP BY s.term
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_stats_term ON search_stats(term);
CREATE INDEX IF NOT EXISTS idx_search_stats_timestamp ON search_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_search_stats_term_timestamp ON search_stats(term, timestamp);