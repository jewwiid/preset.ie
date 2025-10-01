-- Fix preset usage tracking to ensure accurate counts
-- This migration:
-- 1. Syncs usage_count with actual preset_usage records
-- 2. Creates a trigger to auto-update usage_count when preset_usage records are inserted
-- 3. Ensures the increment_preset_usage function is used properly

-- Step 1: Sync existing usage_count with actual preset_usage records
UPDATE presets p
SET usage_count = (
    SELECT COUNT(*)
    FROM preset_usage pu
    WHERE pu.preset_id = p.id
)
WHERE EXISTS (
    SELECT 1
    FROM preset_usage pu
    WHERE pu.preset_id = p.id
);

-- Step 2: Create a trigger function to auto-increment usage_count
CREATE OR REPLACE FUNCTION auto_increment_preset_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment the usage_count and update last_used_at
    UPDATE presets
    SET usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.preset_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_increment_preset_usage_count ON preset_usage;

-- Step 4: Create trigger that fires after preset_usage insert
CREATE TRIGGER trigger_auto_increment_preset_usage_count
    AFTER INSERT ON preset_usage
    FOR EACH ROW
    EXECUTE FUNCTION auto_increment_preset_usage_count();

-- Step 5: Update the track_preset_usage function to work better
CREATE OR REPLACE FUNCTION track_preset_usage(
    preset_uuid UUID,
    usage_type_param TEXT,
    usage_data_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_usage_id UUID;
    preset_creator_id UUID;
    usage_count INTEGER;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Get preset creator
    SELECT user_id INTO preset_creator_id FROM presets WHERE id = preset_uuid;

    -- Insert usage record (the trigger will auto-increment usage_count)
    -- Remove the unique constraint to allow multiple uses per day
    INSERT INTO preset_usage (preset_id, user_id, usage_type, usage_data)
    VALUES (preset_uuid, auth.uid(), usage_type_param, usage_data_param)
    RETURNING id INTO new_usage_id;

    -- Only create notification if preset has a creator (not system presets)
    IF preset_creator_id IS NOT NULL AND preset_creator_id != auth.uid() THEN
        -- Count total usage for this preset in last 24h
        SELECT COUNT(*) INTO usage_count
        FROM preset_usage
        WHERE preset_id = preset_uuid
        AND created_at >= NOW() - INTERVAL '24 hours';

        -- Create notification based on usage type
        CASE usage_type_param
            WHEN 'playground_generation' THEN
                notification_title := 'Your preset was used in playground';
                notification_message := 'Someone used your preset to generate an image. Click to view and verify if needed.';
            WHEN 'showcase_creation' THEN
                notification_title := 'Your preset was featured in a showcase';
                notification_message := 'Your preset was used to create a showcase. Check it out!';
            WHEN 'sample_verification' THEN
                notification_title := 'New sample created for your preset';
                notification_message := 'A new sample was created for your preset. Review and verify if needed.';
            ELSE
                notification_title := 'Your preset was used';
                notification_message := 'Someone used your preset. Check it out!';
        END CASE;

        -- Insert notification
        INSERT INTO preset_notifications (
            preset_id,
            creator_id,
            notification_type,
            title,
            message,
            data
        ) VALUES (
            preset_uuid,
            preset_creator_id,
            usage_type_param,
            notification_title,
            notification_message,
            jsonb_build_object(
                'usage_count_24h', usage_count,
                'usage_data', usage_data_param
            )
        );
    END IF;

    RETURN COALESCE(new_usage_id, gen_random_uuid());
END;
$$;

-- Step 6: Drop the daily unique constraint that prevents multiple uses per day
DROP INDEX IF EXISTS idx_preset_usage_daily_unique;

-- Step 7: Add comment explaining the new system
COMMENT ON TRIGGER trigger_auto_increment_preset_usage_count ON preset_usage IS
'Automatically increments the usage_count on presets table when a new usage record is inserted';

COMMENT ON FUNCTION auto_increment_preset_usage_count() IS
'Trigger function that auto-increments preset usage_count when preset_usage records are inserted';

-- Step 8: Verify the sync worked
DO $$
DECLARE
    sync_report TEXT;
BEGIN
    SELECT INTO sync_report
        'Usage tracking fixed: ' ||
        COUNT(*) || ' presets synced, ' ||
        COALESCE(SUM(usage_count), 0) || ' total uses recorded'
    FROM presets;

    RAISE NOTICE '%', sync_report;
END $$;
