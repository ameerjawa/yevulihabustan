-- Add missing columns to search_stats table
ALTER TABLE search_stats 
ADD COLUMN IF NOT EXISTS filters jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS category text;

-- Drop existing function
DROP FUNCTION IF EXISTS get_search_insights;

-- Create improved search insights function without filters column dependency
CREATE OR REPLACE FUNCTION get_search_insights(
  search_start_date timestamptz,
  min_search_count integer DEFAULT 2
)
RETURNS TABLE (
  term text,
  count bigint,
  avg_results numeric,
  success_rate numeric,
  last_searched timestamptz,
  top_results jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH search_stats_aggregated AS (
    SELECT 
      LOWER(TRIM(s.term)) as normalized_term,
      COUNT(*) as search_count,
      AVG(s.results_count)::numeric as average_results,
      MAX(s.timestamp) as last_search_time,
      SUM(CASE WHEN s.results_count > 0 THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric as success_rate,
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'term', s.term,
          'results', s.results_count,
          'category', s.category,
          'timestamp', s.timestamp
        ) ORDER BY s.timestamp DESC
      ) as search_details
    FROM search_stats s
    WHERE s.timestamp >= search_start_date
    GROUP BY LOWER(TRIM(s.term))
    HAVING COUNT(*) >= min_search_count
  )
  SELECT 
    s.normalized_term as term,
    s.search_count as count,
    ROUND(s.average_results, 2) as avg_results,
    ROUND(s.success_rate, 2) as success_rate,
    s.last_search_time as last_searched,
    s.search_details as top_results
  FROM search_stats_aggregated s
  ORDER BY s.search_count DESC, s.success_rate DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;