-- Fix column ambiguity in user settings functions

-- Fix get_user_settings function
CREATE OR REPLACE FUNCTION get_user_settings(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    profile_id UUID,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    marketing_emails BOOLEAN,
    profile_visibility VARCHAR,
    show_contact_info BOOLEAN,
    two_factor_enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.profile_id,
        us.email_notifications,
        us.push_notifications,
        us.marketing_emails,
        us.profile_visibility,
        us.show_contact_info,
        us.two_factor_enabled,
        us.created_at,
        us.updated_at
    FROM user_settings us
    WHERE us.user_id = user_uuid
       OR us.profile_id IN (
           SELECT up.id FROM users_profile up WHERE up.user_id = user_uuid
       )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix upsert_user_settings function
CREATE OR REPLACE FUNCTION upsert_user_settings(
    user_uuid UUID,
    settings_data JSONB
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    profile_id UUID,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    marketing_emails BOOLEAN,
    profile_visibility VARCHAR,
    show_contact_info BOOLEAN,
    two_factor_enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    profile_uuid UUID;
    existing_settings RECORD;
BEGIN
    -- Get profile_id for the user
    SELECT up.id INTO profile_uuid FROM users_profile up WHERE up.user_id = user_uuid LIMIT 1;
    
    -- Check if settings already exist
    SELECT * INTO existing_settings FROM user_settings 
    WHERE user_id = user_uuid OR profile_id = profile_uuid
    LIMIT 1;
    
    IF existing_settings IS NOT NULL THEN
        -- Update existing settings
        UPDATE user_settings SET
            email_notifications = COALESCE((settings_data->>'email_notifications')::BOOLEAN, existing_settings.email_notifications),
            push_notifications = COALESCE((settings_data->>'push_notifications')::BOOLEAN, existing_settings.push_notifications),
            marketing_emails = COALESCE((settings_data->>'marketing_emails')::BOOLEAN, existing_settings.marketing_emails),
            profile_visibility = COALESCE(settings_data->>'profile_visibility', existing_settings.profile_visibility),
            show_contact_info = COALESCE((settings_data->>'show_contact_info')::BOOLEAN, existing_settings.show_contact_info),
            two_factor_enabled = COALESCE((settings_data->>'two_factor_enabled')::BOOLEAN, existing_settings.two_factor_enabled),
            updated_at = NOW()
        WHERE user_settings.id = existing_settings.id;
        
        RETURN QUERY SELECT * FROM user_settings WHERE user_settings.id = existing_settings.id;
    ELSE
        -- Insert new settings
        RETURN QUERY INSERT INTO user_settings (
            user_id,
            profile_id,
            email_notifications,
            push_notifications,
            marketing_emails,
            profile_visibility,
            show_contact_info,
            two_factor_enabled,
            updated_at
        )
        VALUES (
            user_uuid,
            profile_uuid,
            COALESCE((settings_data->>'email_notifications')::BOOLEAN, true),
            COALESCE((settings_data->>'push_notifications')::BOOLEAN, true),
            COALESCE((settings_data->>'marketing_emails')::BOOLEAN, false),
            COALESCE(settings_data->>'profile_visibility', 'public'),
            COALESCE((settings_data->>'show_contact_info')::BOOLEAN, true),
            COALESCE((settings_data->>'two_factor_enabled')::BOOLEAN, false),
            NOW()
        )
        RETURNING *;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_settings(UUID, JSONB) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed column ambiguity in user settings functions';
END $$;
