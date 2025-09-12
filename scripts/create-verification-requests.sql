-- Create verification_requests table for VerificationQueue component
-- Run this in Supabase Dashboard SQL Editor

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
    CREATE TYPE verification_type AS ENUM (
        'age',
        'identity', 
        'professional',
        'business'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    verification_type verification_type NOT NULL,
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
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
CREATE POLICY "Users can view own verification requests" ON verification_requests
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM users_profile WHERE id = verification_requests.user_id
    ));

DROP POLICY IF EXISTS "Users can create own verification requests" ON verification_requests;
CREATE POLICY "Users can create own verification requests" ON verification_requests
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM users_profile WHERE id = verification_requests.user_id
    ));

DROP POLICY IF EXISTS "Admins can manage all verification requests" ON verification_requests;
CREATE POLICY "Admins can manage all verification requests" ON verification_requests
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users_profile 
        WHERE user_id = auth.uid() 
        AND 'ADMIN' = ANY(role_flags)
    ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_type ON verification_requests(verification_type);
CREATE INDEX IF NOT EXISTS idx_verification_requests_submitted_at ON verification_requests(submitted_at DESC);

-- Function to update updated_at
DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON verification_requests;
CREATE TRIGGER update_verification_requests_updated_at
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert some sample verification requests for testing (optional)
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
        INSERT INTO verification_requests (user_id, verification_type, status, submitted_at, additional_data) VALUES
        (sample_user_id, 'age', 'pending', NOW() - INTERVAL '2 days', '{"birth_date": "1995-03-15", "document_type": "drivers_license"}'),
        (sample_user_id, 'identity', 'reviewing', NOW() - INTERVAL '1 day', '{"document_type": "passport", "document_number": "REDACTED"}')
        ON CONFLICT DO NOTHING;
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