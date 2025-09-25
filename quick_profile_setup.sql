-- Quick setup for your current OAuth user

INSERT INTO public.users_profile (
    user_id,
    display_name,
    handle,
    bio,
    role_flags,
    subscription_tier,
    subscription_status
) VALUES (
    '57fe9bb7-b5a0-4f71-bff5-241eecdd4dfd',
    'Jude Okun',  -- From your Google profile
    'judeokun_57fe9bb7',
    'Welcome to Preset!',
    ARRAY['TALENT']::user_role[],
    'FREE'::subscription_tier,
    'ACTIVE'::subscription_status
)
ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    handle = EXCLUDED.handle;

SELECT '✅ Your profile is ready! Go to dashboard.' as result;
