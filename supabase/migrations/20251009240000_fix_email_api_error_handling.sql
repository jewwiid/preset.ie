-- Add error handling to call_email_api function
-- This prevents email API failures from blocking database operations

CREATE OR REPLACE FUNCTION call_email_api(
  endpoint TEXT,
  payload JSONB
) RETURNS void AS $$
DECLARE
  api_url TEXT;
BEGIN
  -- Use production URL
  api_url := 'https://presetie.com';

  -- Make the HTTP call with error handling
  BEGIN
    PERFORM net.http_post(
      url := api_url || endpoint,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key', true)
      ),
      body := payload::text
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Email API call failed for %: %', endpoint, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
