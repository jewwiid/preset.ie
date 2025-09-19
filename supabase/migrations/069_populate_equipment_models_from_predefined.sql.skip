-- Populate equipment_models table from equipment_predefined_models
-- This migration copies predefined models to the equipment_models table
-- so that users can add them to their equipment

DO $$
DECLARE
    row_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting equipment_models population from predefined models...';

    -- Copy all predefined models to equipment_models table
    INSERT INTO equipment_models (equipment_type_id, brand, model, description, condition)
    SELECT 
        epm.equipment_type_id,
        epm.brand,
        epm.model,
        epm.description,
        'excellent' -- Default condition for predefined models
    FROM equipment_predefined_models epm
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Get the count of inserted models
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE 'Inserted % models into equipment_models table', row_count;

    -- Update the user_equipment_view to handle the new data
    -- The view should now work properly with the populated equipment_models table

    RAISE NOTICE 'Equipment models population completed successfully!';
    RAISE NOTICE 'Users can now add equipment from the predefined models list';
    RAISE NOTICE 'The user_equipment_view should now work properly';

END $$;
