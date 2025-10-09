-- Fix call_email_api to properly log to email_logs table
CREATE OR REPLACE FUNCTION call_email_api(endpoint TEXT, payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url TEXT;
  request_id UUID;
BEGIN
  -- Use production URL
  api_url := 'https://presetie.com';
  
  -- Generate request ID
  request_id := gen_random_uuid();
  
  -- Log the attempt BEFORE making the call
  INSERT INTO email_logs (id, endpoint, payload, status, created_at)
  VALUES (request_id, endpoint, payload, 'pending', NOW());
  
  -- Make the HTTP call using pg_net
  BEGIN
    PERFORM net.http_post(
      url := api_url || endpoint,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := payload
    );
    
    -- Update status to sent
    UPDATE email_logs 
    SET status = 'sent'
    WHERE id = request_id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Update status to failed with error
    UPDATE email_logs 
    SET status = 'failed', error = SQLERRM
    WHERE id = request_id;
    
    RAISE WARNING 'Email API call failed for %: %', endpoint, SQLERRM;
  END;
END;
$$;

COMMENT ON FUNCTION call_email_api IS 
'Calls email API endpoints at https://presetie.com. Logs all attempts to email_logs table.';

