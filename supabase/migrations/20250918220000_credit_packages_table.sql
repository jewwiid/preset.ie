-- Create credit_packages table
CREATE TABLE IF NOT EXISTS public.credit_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    price_usd DECIMAL(10,4) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active packages
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON public.credit_packages(is_active);

-- Enable RLS
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active credit packages" ON public.credit_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage all credit packages" ON public.credit_packages
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default credit packages
INSERT INTO public.credit_packages (id, name, credits, price_usd, is_active) VALUES
    ('starter', 'Starter Pack', 10, 12.99, true),
    ('creative', 'Creative Bundle', 50, 39.99, true),
    ('pro', 'Pro Pack', 100, 69.99, true),
    ('studio', 'Studio Pack', 500, 299.99, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    credits = EXCLUDED.credits,
    price_usd = EXCLUDED.price_usd,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create RPC function to get credit packages
CREATE OR REPLACE FUNCTION get_credit_packages()
RETURNS TABLE (
    id VARCHAR(50),
    name VARCHAR(100),
    credits INTEGER,
    price_usd DECIMAL(10,4),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.name,
        cp.credits,
        cp.price_usd,
        cp.is_active,
        cp.created_at
    FROM credit_packages cp
    WHERE cp.is_active = true
    ORDER BY cp.credits;
END;
$$;
