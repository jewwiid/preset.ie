-- Test the user_equipment_view to ensure it works correctly
-- This migration tests the equipment view and provides debugging information

-- Step 1: Test if the view exists and has the correct structure
DO $$
DECLARE
    view_exists BOOLEAN;
    column_count INTEGER;
    rec RECORD;
BEGIN
    -- Check if the view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'user_equipment_view' 
        AND table_schema = 'public'
    ) INTO view_exists;
    
    IF view_exists THEN
        RAISE NOTICE 'user_equipment_view exists';
        
        -- Check column count
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns
        WHERE table_name = 'user_equipment_view'
        AND table_schema = 'public';
        
        RAISE NOTICE 'user_equipment_view has % columns', column_count;
        
        -- List all columns
        RAISE NOTICE 'Columns in user_equipment_view:';
        FOR rec IN 
            SELECT column_name, data_type 
            FROM information_schema.columns
            WHERE table_name = 'user_equipment_view'
            AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '- % (%)', rec.column_name, rec.data_type;
        END LOOP;
    ELSE
        RAISE NOTICE 'user_equipment_view does not exist';
    END IF;
END $$;

-- Step 2: Test if the underlying tables exist and have data
DO $$
DECLARE
    equipment_types_count INTEGER;
    equipment_models_count INTEGER;
    user_equipment_count INTEGER;
BEGIN
    -- Check equipment_types
    SELECT COUNT(*) INTO equipment_types_count FROM equipment_types;
    RAISE NOTICE 'equipment_types table has % rows', equipment_types_count;
    
    -- Check equipment_models
    SELECT COUNT(*) INTO equipment_models_count FROM equipment_models;
    RAISE NOTICE 'equipment_models table has % rows', equipment_models_count;
    
    -- Check user_equipment
    SELECT COUNT(*) INTO user_equipment_count FROM user_equipment;
    RAISE NOTICE 'user_equipment table has % rows', user_equipment_count;
END $$;

-- Step 3: Test the view with a simple query
DO $$
DECLARE
    view_test_count INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO view_test_count FROM user_equipment_view;
        RAISE NOTICE 'user_equipment_view query successful, returned % rows', view_test_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error querying user_equipment_view: %', SQLERRM;
    END;
END $$;

-- Step 4: Create a simple test function to verify the view works
CREATE OR REPLACE FUNCTION test_equipment_view()
RETURNS TABLE (
    test_result TEXT,
    row_count INTEGER
) AS $$
DECLARE
    test_count INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO test_count FROM user_equipment_view;
        RETURN QUERY SELECT 'SUCCESS'::TEXT, test_count;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT SQLERRM::TEXT, 0;
    END;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION test_equipment_view TO authenticated;

-- Step 6: Create a function to get equipment data for a specific user
CREATE OR REPLACE FUNCTION get_user_equipment_simple(p_profile_id UUID)
RETURNS TABLE (
    id UUID,
    brand VARCHAR(100),
    model VARCHAR(200),
    equipment_type_name VARCHAR(100),
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.id,
        em.brand,
        em.model,
        et.name as equipment_type_name,
        ue.is_primary
    FROM user_equipment ue
    JOIN equipment_models em ON ue.equipment_model_id = em.id
    JOIN equipment_types et ON em.equipment_type_id = et.id
    WHERE ue.profile_id = p_profile_id
    ORDER BY ue.is_primary DESC, ue.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_equipment_simple TO authenticated;

-- Step 8: Success message
DO $$
BEGIN
    RAISE NOTICE 'Equipment view test completed!';
    RAISE NOTICE 'Created test functions for debugging';
    RAISE NOTICE 'Use test_equipment_view() to test the view';
    RAISE NOTICE 'Use get_user_equipment_simple(profile_id) to get user equipment';
END $$;
