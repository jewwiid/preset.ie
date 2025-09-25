-- Create profile for your current OAuth user to test the flow

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
    'YJ Nation',
    'yjnationtv_57fe9bb7',
    'Welcome to Preset! Complete your profile to get started.',
    ARRAY['TALENT']::user_role[],
    'FREE'::subscription_tier,
    'ACTIVE'::subscription_status
);

SELECT '✅ Your profile is created! Refresh your app.' as result;
