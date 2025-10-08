-- Add latest_promoted_image_url column to presets tables
-- This will store the most recently promoted gallery image for each preset

ALTER TABLE public.presets
ADD COLUMN IF NOT EXISTS latest_promoted_image_url TEXT;

ALTER TABLE public.cinematic_presets
ADD COLUMN IF NOT EXISTS latest_promoted_image_url TEXT;

-- Add comment to document the columns
COMMENT ON COLUMN public.presets.latest_promoted_image_url IS 'URL of the most recently promoted gallery image for this preset (auto-updated)';
COMMENT ON COLUMN public.cinematic_presets.latest_promoted_image_url IS 'URL of the most recently promoted gallery image for this preset (auto-updated)';

-- Create function to update latest promoted image when a gallery image is promoted
CREATE OR REPLACE FUNCTION update_preset_latest_promoted_image()
RETURNS TRIGGER AS $$
DECLARE
    preset_name_from_metadata TEXT;
    preset_record RECORD;
BEGIN
    -- Only proceed if is_verified was set to true
    IF NEW.is_verified = TRUE AND (OLD.is_verified IS NULL OR OLD.is_verified = FALSE) THEN

        -- Get the preset name from the gallery image's exif_json metadata
        preset_name_from_metadata := NEW.exif_json->'generation_metadata'->>'style';

        IF preset_name_from_metadata IS NOT NULL THEN
            -- Try to find matching preset in regular presets table (case-insensitive)
            SELECT id, name INTO preset_record
            FROM presets
            WHERE LOWER(name) = LOWER(preset_name_from_metadata)
            LIMIT 1;

            IF FOUND THEN
                -- Update the regular preset's latest promoted image
                UPDATE presets
                SET latest_promoted_image_url = NEW.image_url
                WHERE id = preset_record.id;

                RAISE NOTICE 'Updated latest_promoted_image_url for preset: % (ID: %)', preset_record.name, preset_record.id;
            ELSE
                -- Try cinematic_presets table
                SELECT id, name INTO preset_record
                FROM cinematic_presets
                WHERE LOWER(name) = LOWER(preset_name_from_metadata)
                LIMIT 1;

                IF FOUND THEN
                    -- Update the cinematic preset's latest promoted image
                    UPDATE cinematic_presets
                    SET latest_promoted_image_url = NEW.image_url
                    WHERE id = preset_record.id;

                    RAISE NOTICE 'Updated latest_promoted_image_url for cinematic preset: % (ID: %)', preset_record.name, preset_record.id;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on playground_gallery table
DROP TRIGGER IF EXISTS trigger_update_preset_latest_promoted_image ON playground_gallery;

CREATE TRIGGER trigger_update_preset_latest_promoted_image
AFTER UPDATE OF is_verified ON playground_gallery
FOR EACH ROW
EXECUTE FUNCTION update_preset_latest_promoted_image();

-- Backfill: Update all presets with their latest promoted image
-- This gets the most recently promoted image for each preset based on verification_timestamp

-- Update regular presets
WITH latest_promoted AS (
    SELECT DISTINCT ON (LOWER(pg.exif_json->'generation_metadata'->>'style'))
        LOWER(pg.exif_json->'generation_metadata'->>'style') as preset_name_lower,
        pg.image_url,
        pg.verification_timestamp
    FROM playground_gallery pg
    WHERE pg.is_verified = TRUE
        AND pg.exif_json->'generation_metadata'->>'style' IS NOT NULL
        AND pg.exif_json->>'promoted_from_playground' = 'true'
    ORDER BY LOWER(pg.exif_json->'generation_metadata'->>'style'),
             pg.verification_timestamp DESC NULLS LAST,
             pg.created_at DESC
)
UPDATE presets p
SET latest_promoted_image_url = lp.image_url
FROM latest_promoted lp
WHERE LOWER(p.name) = lp.preset_name_lower;

-- Update cinematic presets
WITH latest_promoted AS (
    SELECT DISTINCT ON (LOWER(pg.exif_json->'generation_metadata'->>'style'))
        LOWER(pg.exif_json->'generation_metadata'->>'style') as preset_name_lower,
        pg.image_url,
        pg.verification_timestamp
    FROM playground_gallery pg
    WHERE pg.is_verified = TRUE
        AND pg.exif_json->'generation_metadata'->>'style' IS NOT NULL
        AND pg.exif_json->>'promoted_from_playground' = 'true'
    ORDER BY LOWER(pg.exif_json->'generation_metadata'->>'style'),
             pg.verification_timestamp DESC NULLS LAST,
             pg.created_at DESC
)
UPDATE cinematic_presets cp
SET latest_promoted_image_url = lp.image_url
FROM latest_promoted lp
WHERE LOWER(cp.name) = lp.preset_name_lower;

-- Show results
SELECT
    'regular_presets' as table_name,
    COUNT(*) as total_presets,
    COUNT(latest_promoted_image_url) as presets_with_promoted_image
FROM presets

UNION ALL

SELECT
    'cinematic_presets' as table_name,
    COUNT(*) as total_presets,
    COUNT(latest_promoted_image_url) as presets_with_promoted_image
FROM cinematic_presets;
