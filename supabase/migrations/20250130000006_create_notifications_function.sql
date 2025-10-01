-- Create function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Return user's notifications
  RETURN QUERY
  SELECT 
    pn.id,
    pn.type,
    pn.title,
    pn.message,
    pn.data,
    pn.is_read,
    pn.created_at,
    pn.read_at
  FROM preset_notifications pn
  WHERE pn.creator_id = auth.uid()
  ORDER BY pn.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER, INTEGER) TO authenticated;
