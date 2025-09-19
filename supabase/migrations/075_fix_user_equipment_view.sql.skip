-- Fix user_equipment_view to ensure it works correctly
-- This migration fixes any issues with the user_equipment_view

-- Step 1: Drop and recreate the user_equipment_view to ensure it's correct
DROP VIEW IF EXISTS user_equipment_view;

-- Step 2: Recreate the view with proper column references
CREATE OR REPLACE VIEW user_equipment_view AS
SELECT 
    ue.id,
    ue.profile_id,
    ue.is_primary,
    ue.display_order,
    ue.created_at,
    em.brand,
    em.model,
    em.description,
    em.condition,
    et.name as equipment_type_name,
    et.display_name as equipment_type_display_name,
    et.icon as equipment_type_icon,
    et.category as equipment_type_category
FROM user_equipment ue
JOIN equipment_models em ON ue.equipment_model_id = em.id
JOIN equipment_types et ON em.equipment_type_id = et.id
ORDER BY ue.display_order ASC, et.sort_order ASC, em.brand ASC, em.model ASC;

-- Step 3: Grant permissions on the view
GRANT SELECT ON user_equipment_view TO authenticated;

-- Step 4: Add comment
COMMENT ON VIEW user_equipment_view IS 'View combining user equipment with model and type details - fixed version';

-- Step 5: Create a function to get user equipment data safely
CREATE OR REPLACE FUNCTION get_user_equipment_data(p_profile_id UUID)
RETURNS TABLE (
    id UUID,
    profile_id UUID,
    is_primary BOOLEAN,
    display_order INTEGER,
    brand VARCHAR(100),
    model VARCHAR(200),
    description TEXT,
    condition VARCHAR(20),
    equipment_type_name VARCHAR(100),
    equipment_type_display_name VARCHAR(100),
    equipment_type_icon VARCHAR(10),
    equipment_type_category VARCHAR(50),
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.id,
        ue.profile_id,
        ue.is_primary,
        ue.display_order,
        em.brand,
        em.model,
        em.description,
        em.condition,
        et.name as equipment_type_name,
        et.display_name as equipment_type_display_name,
        et.icon as equipment_type_icon,
        et.category as equipment_type_category,
        ue.created_at
    FROM user_equipment ue
    JOIN equipment_models em ON ue.equipment_model_id = em.id
    JOIN equipment_types et ON em.equipment_type_id = et.id
    WHERE ue.profile_id = p_profile_id
    ORDER BY ue.display_order ASC, et.sort_order ASC, em.brand ASC, em.model ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Grant permissions on the function
GRANT EXECUTE ON FUNCTION get_user_equipment_data TO authenticated;

-- Step 7: Create a function to add equipment to user
CREATE OR REPLACE FUNCTION add_user_equipment(
    p_profile_id UUID,
    p_equipment_model_id UUID,
    p_is_primary BOOLEAN DEFAULT FALSE,
    p_display_order INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    v_equipment_id UUID;
BEGIN
    -- If setting as primary, unset other primary equipment
    IF p_is_primary THEN
        UPDATE user_equipment 
        SET is_primary = FALSE 
        WHERE profile_id = p_profile_id;
    END IF;
    
    -- Insert new equipment
    INSERT INTO user_equipment (
        profile_id,
        equipment_model_id,
        is_primary,
        display_order
    ) VALUES (
        p_profile_id,
        p_equipment_model_id,
        p_is_primary,
        p_display_order
    ) RETURNING id INTO v_equipment_id;
    
    RETURN v_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Grant permissions on the function
GRANT EXECUTE ON FUNCTION add_user_equipment TO authenticated;

-- Step 9: Create a function to remove equipment from user
CREATE OR REPLACE FUNCTION remove_user_equipment(p_equipment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile_id UUID;
    v_was_primary BOOLEAN;
BEGIN
    -- Get profile_id and primary status before deletion
    SELECT profile_id, is_primary INTO v_profile_id, v_was_primary
    FROM user_equipment
    WHERE id = p_equipment_id;
    
    IF v_profile_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Delete the equipment
    DELETE FROM user_equipment WHERE id = p_equipment_id;
    
    -- If it was primary, set another equipment as primary (if any exist)
    IF v_was_primary THEN
        UPDATE user_equipment 
        SET is_primary = TRUE 
        WHERE id = (
            SELECT id FROM user_equipment 
            WHERE profile_id = v_profile_id 
            AND id != p_equipment_id
            ORDER BY created_at ASC
            LIMIT 1
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Grant permissions on the function
GRANT EXECUTE ON FUNCTION remove_user_equipment TO authenticated;

-- Step 11: Create a function to get equipment types
CREATE OR REPLACE FUNCTION get_equipment_types()
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    display_name VARCHAR(100),
    icon VARCHAR(10),
    category VARCHAR(50),
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.id,
        et.name,
        et.display_name,
        et.icon,
        et.category,
        et.sort_order
    FROM equipment_types et
    WHERE et.is_active = TRUE
    ORDER BY et.sort_order ASC, et.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Grant permissions on the function
GRANT EXECUTE ON FUNCTION get_equipment_types TO authenticated;

-- Step 13: Create a function to get equipment brands for a type
CREATE OR REPLACE FUNCTION get_equipment_brands(p_equipment_type_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    display_name VARCHAR(100),
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eb.id,
        eb.name,
        eb.display_name,
        eb.sort_order
    FROM equipment_brands eb
    WHERE eb.equipment_type_id = p_equipment_type_id
    AND eb.is_active = TRUE
    ORDER BY eb.sort_order ASC, eb.display_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Grant permissions on the function
GRANT EXECUTE ON FUNCTION get_equipment_brands TO authenticated;

-- Step 15: Create a function to get predefined models for a type
CREATE OR REPLACE FUNCTION get_predefined_models(p_equipment_type_id UUID)
RETURNS TABLE (
    id UUID,
    brand VARCHAR(100),
    model VARCHAR(200),
    description TEXT,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        epm.id,
        epm.brand,
        epm.model,
        epm.description,
        epm.sort_order
    FROM equipment_predefined_models epm
    WHERE epm.equipment_type_id = p_equipment_type_id
    AND epm.is_active = TRUE
    ORDER BY epm.sort_order ASC, epm.brand ASC, epm.model ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 16: Grant permissions on the function
GRANT EXECUTE ON FUNCTION get_predefined_models TO authenticated;

-- Step 17: Add helpful comments
COMMENT ON FUNCTION get_user_equipment_data IS 'Safely get user equipment data with all related information';
COMMENT ON FUNCTION add_user_equipment IS 'Add equipment to user profile';
COMMENT ON FUNCTION remove_user_equipment IS 'Remove equipment from user profile';
COMMENT ON FUNCTION get_equipment_types IS 'Get all active equipment types';
COMMENT ON FUNCTION get_equipment_brands IS 'Get brands for a specific equipment type';
COMMENT ON FUNCTION get_predefined_models IS 'Get predefined models for a specific equipment type';

-- Step 18: Success message
DO $$
BEGIN
    RAISE NOTICE 'User equipment view fixed successfully!';
    RAISE NOTICE 'Recreated user_equipment_view with proper column references';
    RAISE NOTICE 'Added helper functions for equipment management';
    RAISE NOTICE 'Granted proper permissions to authenticated users';
END $$;
