-- Check if platform credit tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'platform_credits',
    'platform_credit_purchases', 
    'credit_packages',
    'user_credit_purchases',
    'platform_credit_consumption'
)
ORDER BY table_name;