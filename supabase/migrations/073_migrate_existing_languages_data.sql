-- Migration: Migrate existing languages data to new languages system
-- This migration handles the transition from the simple TEXT[] languages column to the new structured system

-- Step 1: Create a function to migrate existing languages data
CREATE OR REPLACE FUNCTION migrate_existing_languages_data()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    language_name TEXT;
    language_id UUID;
    custom_language_name VARCHAR(100);
BEGIN
    -- Loop through all profiles that have languages data
    FOR profile_record IN 
        SELECT id, languages 
        FROM users_profile 
        WHERE languages IS NOT NULL 
        AND array_length(languages, 1) > 0
    LOOP
        -- Loop through each language in the array
        FOREACH language_name IN ARRAY profile_record.languages
        LOOP
            -- Skip empty strings
            IF language_name IS NOT NULL AND TRIM(language_name) != '' THEN
                -- Try to find the language in the master list
                SELECT id INTO language_id
                FROM languages_master
                WHERE LOWER(name) = LOWER(TRIM(language_name))
                OR LOWER(native_name) = LOWER(TRIM(language_name))
                OR LOWER(iso_code) = LOWER(TRIM(language_name));
                
                -- If found in master list, use it
                IF language_id IS NOT NULL THEN
                    INSERT INTO user_languages (
                        profile_id,
                        language_id,
                        proficiency_level,
                        is_primary
                    ) VALUES (
                        profile_record.id,
                        language_id,
                        'intermediate', -- Default proficiency
                        FALSE -- Will be set to TRUE for first language below
                    ) ON CONFLICT DO NOTHING;
                ELSE
                    -- If not found, add as custom language
                    INSERT INTO user_languages (
                        profile_id,
                        custom_language_name,
                        proficiency_level,
                        is_primary
                    ) VALUES (
                        profile_record.id,
                        TRIM(language_name),
                        'intermediate', -- Default proficiency
                        FALSE -- Will be set to TRUE for first language below
                    ) ON CONFLICT DO NOTHING;
                END IF;
            END IF;
        END LOOP;
        
        -- Set the first language as primary (if any languages were added)
        UPDATE user_languages 
        SET is_primary = TRUE 
        WHERE profile_id = profile_record.id 
        AND id = (
            SELECT id FROM user_languages 
            WHERE profile_id = profile_record.id 
            ORDER BY created_at ASC 
            LIMIT 1
        );
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Step 2: Run the migration
SELECT migrate_existing_languages_data();

-- Step 3: Create a function to sync languages back to the old column (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_languages_to_profile_column()
RETURNS TRIGGER AS $$
DECLARE
    language_names TEXT[];
BEGIN
    -- Get all language names for this profile
    SELECT ARRAY_AGG(
        COALESCE(lm.name, ul.custom_language_name)
        ORDER BY ul.is_primary DESC, ul.created_at ASC
    ) INTO language_names
    FROM user_languages ul
    LEFT JOIN languages_master lm ON ul.language_id = lm.id
    WHERE ul.profile_id = NEW.profile_id;
    
    -- Update the languages column in users_profile
    UPDATE users_profile 
    SET languages = language_names
    WHERE id = NEW.profile_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create triggers to keep the old column in sync
CREATE TRIGGER sync_languages_on_insert
    AFTER INSERT ON user_languages
    FOR EACH ROW
    EXECUTE FUNCTION sync_languages_to_profile_column();

CREATE TRIGGER sync_languages_on_update
    AFTER UPDATE ON user_languages
    FOR EACH ROW
    EXECUTE FUNCTION sync_languages_to_profile_column();

CREATE TRIGGER sync_languages_on_delete
    AFTER DELETE ON user_languages
    FOR EACH ROW
    EXECUTE FUNCTION sync_languages_to_profile_column();

-- Step 5: Create a function to get popular languages for UI dropdowns
CREATE OR REPLACE FUNCTION get_popular_languages(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    native_name VARCHAR(100),
    iso_code VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lm.id,
        lm.name,
        lm.native_name,
        lm.iso_code
    FROM languages_master lm
    WHERE lm.is_active = TRUE
    AND lm.is_popular = TRUE
    ORDER BY lm.sort_order ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create a function to get all languages for UI dropdowns
CREATE OR REPLACE FUNCTION get_all_languages(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    native_name VARCHAR(100),
    iso_code VARCHAR(10),
    region VARCHAR(50),
    is_popular BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lm.id,
        lm.name,
        lm.native_name,
        lm.iso_code,
        lm.region,
        lm.is_popular
    FROM languages_master lm
    WHERE lm.is_active = TRUE
    ORDER BY lm.is_popular DESC, lm.sort_order ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Grant permissions for new functions
GRANT EXECUTE ON FUNCTION get_popular_languages TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_languages TO authenticated;

-- Step 8: Add helpful comments
COMMENT ON FUNCTION migrate_existing_languages_data IS 'Migrates existing languages data from users_profile.languages to the new user_languages table';
COMMENT ON FUNCTION sync_languages_to_profile_column IS 'Keeps the old languages column in sync with the new user_languages table for backward compatibility';
COMMENT ON FUNCTION get_popular_languages IS 'Returns popular languages for UI dropdowns';
COMMENT ON FUNCTION get_all_languages IS 'Returns all active languages for UI dropdowns';

-- Step 9: Success message
DO $$
BEGIN
    RAISE NOTICE 'Languages data migration completed successfully!';
    RAISE NOTICE 'Migrated existing languages data to new structured system';
    RAISE NOTICE 'Created backward compatibility triggers';
    RAISE NOTICE 'Added helper functions for UI integration';
END $$;
