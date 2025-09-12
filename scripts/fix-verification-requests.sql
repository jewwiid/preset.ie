-- Fix verification_requests table - Clean recreation
-- Run this in Supabase Dashboard SQL Editor

-- Drop existing table if it has issues
DROP TABLE IF EXISTS verification_requests CASCADE;

-- Verification request statuses
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending',
        'approved', 
        'rejected',
        'reviewing'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verification request types  
DO $$ BEGIN
    CREATE TYPE verification_req_type AS ENUM (
        'age',
        'identity', 
        'professional',
        'business'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create verification_requests table (clean)
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    request_type verification_req_type NOT NULL,
    status verification_status DEFAULT 'pending',
    
    -- Request details
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users_profile(user_id),
    
    -- Document/data
    document_url TEXT,
    document_type TEXT,
    additional_data JSONB,
    
    -- Review details  
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own verification requests" ON verification_requests
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM users_profile WHERE id = verification_requests.user_id
    ));

CREATE POLICY "Users can create own verification requests" ON verification_requests
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM users_profile WHERE id = verification_requests.user_id
    ));

CREATE POLICY "Admins can manage all verification requests" ON verification_requests
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users_profile 
        WHERE user_id = auth.uid() 
        AND 'ADMIN' = ANY(role_flags)
    ));

-- Indexes
CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_type ON verification_requests(request_type);
CREATE INDEX idx_verification_requests_submitted_at ON verification_requests(submitted_at DESC);

-- Function to update updated_at (ensure it exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_verification_requests_updated_at
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert sample verification requests for testing
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Get a sample user for testing
    SELECT id INTO sample_user_id 
    FROM users_profile 
    WHERE date_of_birth IS NOT NULL 
    LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- Insert sample verification requests
        INSERT INTO verification_requests (user_id, request_type, status, submitted_at, additional_data) VALUES
        (sample_user_id, 'age', 'pending', NOW() - INTERVAL '2 days', '{"birth_date": "1995-03-15", "document_type": "drivers_license"}'::jsonb),
        (sample_user_id, 'identity', 'reviewing', NOW() - INTERVAL '1 day', '{"document_type": "passport", "document_number": "REDACTED"}'::jsonb);
    END IF;
END $$;

-- Show results
SELECT 'verification_requests table created successfully!' as status;

SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
FROM verification_requests;