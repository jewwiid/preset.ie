-- Fix call_email_api to use production URL
-- Since we can't set app.base_url on Supabase Cloud, hardcode the production URL

CREATE OR REPLACE FUNCTION call_email_api(endpoint TEXT, payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url TEXT;
BEGIN
  -- Use production URL
  -- Change this to your actual production domain
  api_url := 'https://presetie.com';
  
  -- Make the HTTP call using pg_net
  PERFORM net.http_post(
    url := api_url || endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  );
  
  -- Log the attempt
  INSERT INTO email_logs (endpoint, payload, status, created_at)
  VALUES (endpoint, payload, 'pending', NOW());
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  INSERT INTO email_logs (endpoint, payload, status, error, created_at)
  VALUES (endpoint, payload, 'failed', SQLERRM, NOW());
  
  RAISE WARNING 'Email API call failed: %', SQLERRM;
END;
$$;

-- Comment explaining the configuration
COMMENT ON FUNCTION call_email_api IS 
'Calls email API endpoints. Update the api_url variable in this function to change the base URL.';

