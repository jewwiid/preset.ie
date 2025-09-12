-- Additional functions and utilities for admin user management
-- This script provides helper functions for managing admin users

-- Function to create admin user (alternative approach using Supabase Admin API format)
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email TEXT,
    admin_password TEXT,
    admin_handle TEXT DEFAULT 'admin',
    admin_display_name TEXT DEFAULT 'Admin User'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    hashed_password TEXT;
BEGIN
    -- Generate new UUID
    new_user_id := gen_random_uuid();
    
    -- Hash the password
    SELECT crypt(admin_password, gen_salt('bf', 10)) INTO hashed_password;
    
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role,
        raw_user_meta_data
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000'::UUID,
        admin_email,
        hashed_password,
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated',
        jsonb_build_object('role', 'ADMIN')
    );
    
    -- Insert into public.users (this will be handled by the trigger, but we ensure it)
    INSERT INTO public.users (
        id,
        email,
        role,
        subscription_tier,
        verification_status,
        email_verified_at,
        is_active
    ) VALUES (
        new_user_id,
        admin_email,
        'ADMIN',
        'PRO',
        'ID_VERIFIED',
        NOW(),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'ADMIN',
        subscription_tier = 'PRO',
        verification_status = 'ID_VERIFIED',
        email_verified_at = NOW(),
        is_active = true;
    
    -- Create profile
    INSERT INTO public.profiles (
        user_id,
        handle,
        display_name,
        bio,
        city,
        style_tags
    ) VALUES (
        new_user_id,
        admin_handle,
        admin_display_name,
        'System Administrator',
        'Dublin',
        ARRAY['admin', 'system']::TEXT[]
    )
    ON CONFLICT (user_id) DO UPDATE SET
        handle = admin_handle,
        display_name = admin_display_name,
        bio = 'System Administrator',
        updated_at = NOW();
    
    RETURN new_user_id;
END;
$$;

-- Function to reset admin password
CREATE OR REPLACE FUNCTION reset_admin_password(
    admin_email TEXT,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
    hashed_password TEXT;
BEGIN
    -- Find admin user
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found: %', admin_email;
    END IF;
    
    -- Hash new password
    SELECT crypt(new_password, gen_salt('bf', 10)) INTO hashed_password;
    
    -- Update password
    UPDATE auth.users
    SET 
        encrypted_password = hashed_password,
        updated_at = NOW()
    WHERE id = admin_user_id;
    
    RETURN TRUE;
END;
$$;

-- Function to ensure admin user has all required permissions
CREATE OR REPLACE FUNCTION ensure_admin_permissions(admin_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find admin user
    SELECT au.id INTO admin_user_id
    FROM auth.users au
    WHERE au.email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found: %', admin_email;
    END IF;
    
    -- Ensure user has ADMIN role
    UPDATE public.users
    SET 
        role = 'ADMIN',
        subscription_tier = 'PRO',
        verification_status = 'ID_VERIFIED',
        is_active = true,
        updated_at = NOW()
    WHERE id = admin_user_id;
    
    -- Ensure email is confirmed
    UPDATE auth.users
    SET 
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = admin_user_id;
    
    RETURN TRUE;
END;
$$;

-- Function to check admin user status
CREATE OR REPLACE FUNCTION check_admin_status(admin_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    email_confirmed BOOLEAN,
    role user_role,
    subscription_tier subscription_tier,
    verification_status verification_status,
    is_active BOOLEAN,
    has_profile BOOLEAN,
    profile_handle TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.email_confirmed_at IS NOT NULL,
        u.role,
        u.subscription_tier,
        u.verification_status,
        u.is_active,
        p.id IS NOT NULL,
        p.handle
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE au.email = admin_email;
END;
$$;

-- Grant execute permissions to service_role
GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION reset_admin_password(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION ensure_admin_permissions(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION check_admin_status(TEXT) TO service_role;