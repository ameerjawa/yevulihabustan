-- Function to get search insights
CREATE OR REPLACE FUNCTION get_search_insights(
  start_date timestamptz,
  min_count integer DEFAULT 2
)
RETURNS TABLE (
  term text,
  count bigint,
  avg_results numeric,
  categories text[],
  success_rate numeric,
  last_searched timestamptz
) AS $$
BEGIN
  RETURN QUERY
  WITH search_stats_aggregated AS (
    SELECT 
      LOWER(TRIM(s.term)) as normalized_term,
      COUNT(*) as search_count,
      AVG(s.results_count)::numeric as average_results,
      MAX(s.timestamp) as last_search_time,
      SUM(CASE WHEN s.results_count > 0 THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric as success_rate
    FROM search_stats s
    WHERE s.timestamp >= start_date
    GROUP BY LOWER(TRIM(s.term))
    HAVING COUNT(*) >= min_count
  )
  SELECT 
    s.normalized_term as term,
    s.search_count as count,
    ROUND(s.average_results, 2) as avg_results,
    ARRAY[]::text[] as categories,
    ROUND(s.success_rate, 2) as success_rate,
    s.last_search_time as last_searched
  FROM search_stats_aggregated s
  ORDER BY s.search_count DESC, s.success_rate DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;