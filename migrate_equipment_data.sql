-- Migration script to convert existing equipment_list to new equipment system
-- This preserves existing equipment data while moving to the structured system

-- Step 1: Create the new equipment system tables (if not already created)
-- Run create_equipment_system.sql first

-- Check if equipment system tables exist, if not, create them
DO $$
BEGIN
    -- Check if equipment_types table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_types') THEN
        RAISE EXCEPTION 'Equipment system tables not found. Please run create_equipment_system.sql first.';
    END IF;
    
    -- Check if equipment_models table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_models') THEN
        RAISE EXCEPTION 'Equipment system tables not found. Please run create_equipment_system.sql first.';
    END IF;
    
    -- Check if user_equipment table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_equipment') THEN
        RAISE EXCEPTION 'Equipment system tables not found. Please run create_equipment_system.sql first.';
    END IF;
    
    RAISE NOTICE 'Equipment system tables found. Proceeding with migration.';
END $$;

-- Step 2: Migrate existing equipment_list data
-- This will create "Other" equipment entries for existing text-based equipment

-- First, check if equipment_list column exists and add it if missing
DO $$
BEGIN
    -- Check if equipment_list column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' AND column_name = 'equipment_list'
    ) THEN
        -- Add the equipment_list column
        ALTER TABLE users_profile 
        ADD COLUMN equipment_list TEXT[] DEFAULT '{}';
        
        -- Add comment
        COMMENT ON COLUMN users_profile.equipment_list IS 'Array of equipment owned';
        
        RAISE NOTICE 'Added missing equipment_list column to users_profile table';
    ELSE
        RAISE NOTICE 'equipment_list column already exists in users_profile table';
    END IF;
END $$;

DO $$
DECLARE
    user_record RECORD;
    equipment_item TEXT;
    equipment_model_id UUID;
BEGIN
    -- Loop through all users with equipment_list data
    FOR user_record IN 
        SELECT id, user_id, equipment_list 
        FROM users_profile 
        WHERE equipment_list IS NOT NULL AND array_length(equipment_list, 1) > 0
    LOOP
        -- Loop through each equipment item in the user's list
        FOREACH equipment_item IN ARRAY user_record.equipment_list
        LOOP
            -- Skip empty items
            IF equipment_item IS NOT NULL AND trim(equipment_item) != '' THEN
                -- Ensure "other" equipment type exists
                INSERT INTO equipment_types (name, display_name, category, sort_order, icon)
                SELECT 'other', 'Other', 'other', 999, '📦'
                WHERE NOT EXISTS (SELECT 1 FROM equipment_types WHERE name = 'other');
                
                -- Create equipment model entry under "Other" category
                INSERT INTO equipment_models (
                    user_id,
                    equipment_type_id,
                    model,
                    description,
                    condition,
                    created_at,
                    updated_at
                ) VALUES (
                    user_record.user_id,
                    (SELECT id FROM equipment_types WHERE name = 'other'),
                    trim(equipment_item),
                    'Migrated from legacy equipment_list',
                    'good',
                    NOW(),
                    NOW()
                ) RETURNING id INTO equipment_model_id;
                
                -- Link to user_equipment table
                INSERT INTO user_equipment (
                    user_id,
                    equipment_model_id,
                    is_primary,
                    display_order,
                    created_at
                ) VALUES (
                    user_record.user_id,
                    equipment_model_id,
                    FALSE,
                    0,
                    NOW()
                );
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Processed % users with equipment data.', 
        (SELECT COUNT(*) FROM users_profile WHERE equipment_list IS NOT NULL AND array_length(equipment_list, 1) > 0);
END $$;

-- Step 3: Add new equipment fields to users_profile for backward compatibility
-- Keep equipment_list for now, but mark it as deprecated
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS equipment_system_version INTEGER DEFAULT 1;

COMMENT ON COLUMN users_profile.equipment_system_version IS 'Equipment system version: 1=legacy text array, 2=new structured system';
COMMENT ON COLUMN users_profile.equipment_list IS 'DEPRECATED: Use new equipment system tables instead';

-- Step 4: Create view for easy access to user equipment
CREATE OR REPLACE VIEW user_equipment_view AS
SELECT 
    ue.id,
    ue.user_id,
    ue.is_primary,
    ue.display_order,
    et.name as equipment_type,
    et.display_name as equipment_type_display,
    et.icon as equipment_type_icon,
    et.category as equipment_category,
    em.brand,
    em.model,
    em.description,
    em.condition,
    em.is_available_for_rent,
    em.rental_price_per_day,
    em.created_at,
    em.updated_at
FROM user_equipment ue
JOIN equipment_models em ON ue.equipment_model_id = em.id
JOIN equipment_types et ON em.equipment_type_id = et.id
ORDER BY ue.display_order ASC, et.sort_order ASC, em.brand ASC, em.model ASC;

-- Add comment for the view
COMMENT ON VIEW user_equipment_view IS 'Convenient view of user equipment with all related details';

-- Step 5: Create function to get equipment summary for a user
CREATE OR REPLACE FUNCTION get_user_equipment_summary(user_uuid UUID)
RETURNS TABLE (
    category VARCHAR(50),
    equipment_count BIGINT,
    primary_equipment TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.category,
        COUNT(*) as equipment_count,
        ARRAY_AGG(
            CASE 
                WHEN em.brand IS NOT NULL AND em.brand != '' 
                THEN em.brand || ' ' || em.model
                ELSE em.model
            END
            ORDER BY ue.is_primary DESC, em.brand ASC, em.model ASC
        ) as primary_equipment
    FROM user_equipment ue
    JOIN equipment_models em ON ue.equipment_model_id = em.id
    JOIN equipment_types et ON em.equipment_type_id = et.id
    WHERE ue.user_id = user_uuid
    GROUP BY et.category, et.sort_order
    ORDER BY et.sort_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update equipment_system_version to 2 for migrated users
UPDATE users_profile 
SET equipment_system_version = 2
WHERE equipment_list IS NOT NULL AND array_length(equipment_list, 1) > 0;

-- Step 7: Final success message
DO $$
BEGIN
    RAISE NOTICE 'Equipment migration completed successfully!';
    RAISE NOTICE 'New equipment system is now active.';
    RAISE NOTICE 'Legacy equipment_list data has been preserved and migrated.';
END $$;
