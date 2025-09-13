-- Create credit_packages table and populate with sample data
-- Run this in your Supabase SQL Editor

-- Create credit_packages table if it doesn't exist
CREATE TABLE IF NOT EXISTS credit_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    stripe_price_id VARCHAR(255), -- Stripe Price ID for this package
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to view active packages
CREATE POLICY "Users can view active credit packages" ON credit_packages
    FOR SELECT USING (is_active = true);

-- Insert sample credit packages
INSERT INTO credit_packages (id, name, description, credits, price_usd, is_popular, sort_order) VALUES
    ('starter', 'Starter Pack', 'Perfect for trying out image enhancements', 10, 2.99, false, 1),
    ('basic', 'Basic Pack', 'Great for regular users', 25, 6.99, false, 2),
    ('popular', 'Popular Pack', 'Most popular choice - best value', 50, 12.99, true, 3),
    ('pro', 'Pro Pack', 'For power users and professionals', 100, 24.99, false, 4),
    ('enterprise', 'Enterprise Pack', 'Maximum credits for heavy usage', 250, 59.99, false, 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    credits = EXCLUDED.credits,
    price_usd = EXCLUDED.price_usd,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- Verify the packages were created
SELECT 'Credit packages created successfully' as status,
       count(*) as package_count
FROM credit_packages 
WHERE is_active = true;
