-- Create function to get current server time in Israel timezone
CREATE OR REPLACE FUNCTION get_current_time()
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jerusalem';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_time() TO authenticated;