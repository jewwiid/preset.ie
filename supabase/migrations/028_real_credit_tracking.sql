-- Add columns for real credit tracking to platform_credits table
ALTER TABLE platform_credits 
ADD COLUMN IF NOT EXISTS last_api_balance INTEGER,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'pending';

-- Create platform alerts table for low balance warnings
CREATE TABLE IF NOT EXISTS platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  provider VARCHAR(50),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create platform settings table for auto-sync configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create credit sync logs table
CREATE TABLE IF NOT EXISTS credit_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  sync_type VARCHAR(20) NOT NULL, -- 'manual' or 'automatic'
  api_credits_before INTEGER,
  api_credits_after INTEGER,
  db_credits_before INTEGER,
  db_credits_after INTEGER,
  consumed_credits INTEGER,
  sync_status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  synced_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_alerts_type ON platform_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_platform_alerts_severity ON platform_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_platform_alerts_created ON platform_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_sync_logs_provider ON credit_sync_logs(provider);
CREATE INDEX IF NOT EXISTS idx_credit_sync_logs_created ON credit_sync_logs(created_at DESC);

-- RLS Policies
ALTER TABLE platform_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_sync_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage alerts
CREATE POLICY platform_alerts_admin_all ON platform_alerts
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can manage settings
CREATE POLICY platform_settings_admin_all ON platform_settings
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can view sync logs
CREATE POLICY credit_sync_logs_admin_all ON credit_sync_logs
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Function to log credit sync
CREATE OR REPLACE FUNCTION log_credit_sync(
  p_provider VARCHAR,
  p_sync_type VARCHAR,
  p_api_credits INTEGER,
  p_db_credits_before INTEGER,
  p_status VARCHAR,
  p_error TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_consumed INTEGER;
BEGIN
  -- Calculate consumed credits
  v_consumed := GREATEST(0, p_db_credits_before - p_api_credits);
  
  -- Insert sync log
  INSERT INTO credit_sync_logs (
    provider,
    sync_type,
    api_credits_before,
    api_credits_after,
    db_credits_before,
    db_credits_after,
    consumed_credits,
    sync_status,
    error_message,
    synced_by
  ) VALUES (
    p_provider,
    p_sync_type,
    p_db_credits_before,
    p_api_credits,
    p_db_credits_before,
    p_api_credits,
    v_consumed,
    p_status,
    p_error,
    p_user_id
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and alert on low credits
CREATE OR REPLACE FUNCTION check_credit_alerts() RETURNS VOID AS $$
DECLARE
  v_credit RECORD;
  v_alert_exists BOOLEAN;
BEGIN
  -- Check each provider
  FOR v_credit IN 
    SELECT * FROM platform_credits 
  LOOP
    -- Check if credits are below threshold
    IF v_credit.current_balance < v_credit.low_balance_threshold THEN
      -- Check if unresolved alert already exists
      SELECT EXISTS(
        SELECT 1 FROM platform_alerts 
        WHERE provider = v_credit.provider 
        AND alert_type = 'low_credits'
        AND resolved_at IS NULL
      ) INTO v_alert_exists;
      
      -- Create alert if doesn't exist
      IF NOT v_alert_exists THEN
        INSERT INTO platform_alerts (
          alert_type,
          provider,
          severity,
          message,
          metadata
        ) VALUES (
          'low_credits',
          v_credit.provider,
          CASE 
            WHEN v_credit.current_balance < 50 THEN 'critical'
            WHEN v_credit.current_balance < v_credit.low_balance_threshold / 2 THEN 'warning'
            ELSE 'info'
          END,
          format('Low credits for %s: %s remaining (threshold: %s)', 
            v_credit.provider, 
            v_credit.current_balance, 
            v_credit.low_balance_threshold
          ),
          jsonb_build_object(
            'current_balance', v_credit.current_balance,
            'threshold', v_credit.low_balance_threshold,
            'ratio', v_credit.credit_ratio
          )
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('credit_auto_sync', '{"enabled": false, "interval_ms": 3600000, "providers": ["nanobanana"]}', 'Automatic credit sync configuration'),
  ('low_credit_alert_threshold', '{"nanobanana": 100, "openai": 50, "pexels": 100}', 'Low credit alert thresholds per provider'),
  ('credit_refill_amounts', '{"quick_refills": [1000, 5000, 10000]}', 'Quick refill button amounts')
ON CONFLICT (key) DO NOTHING;