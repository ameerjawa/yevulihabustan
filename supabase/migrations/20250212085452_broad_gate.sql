-- Create a new function for better search insights
CREATE OR REPLACE FUNCTION get_search_insights(
  start_date timestamptz
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
          'filters', s.filters
        )
      ) as search_details
    FROM search_stats s
    WHERE s.timestamp >= start_date
    GROUP BY LOWER(TRIM(s.term))
    HAVING COUNT(*) >= 2
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