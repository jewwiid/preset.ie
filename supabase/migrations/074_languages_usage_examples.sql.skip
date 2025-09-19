-- Languages System Usage Examples
-- This file demonstrates how to use the new languages system

-- Example 1: Get popular languages for a dropdown
-- SELECT * FROM get_popular_languages(10);

-- Example 2: Search for languages
-- SELECT * FROM search_languages('spanish');

-- Example 3: Get all languages
-- SELECT * FROM get_all_languages(50);

-- Example 4: Add a predefined language to a user
-- SELECT add_user_language(
--     'user-profile-uuid-here'::UUID,
--     'language-uuid-from-master'::UUID,
--     NULL, -- custom_language_name
--     'advanced', -- proficiency_level
--     TRUE -- is_primary
-- );

-- Example 5: Add a custom language to a user
-- SELECT add_user_language(
--     'user-profile-uuid-here'::UUID,
--     NULL, -- language_id
--     'Klingon', -- custom_language_name
--     'beginner', -- proficiency_level
--     FALSE -- is_primary
-- );

-- Example 6: Get user's languages
-- SELECT * FROM get_user_languages('user-profile-uuid-here'::UUID);

-- Example 7: Remove a language from user
-- SELECT remove_user_language('user-language-uuid-here'::UUID);

-- Example 8: Update user's primary language
-- First, unset current primary
-- UPDATE user_languages SET is_primary = FALSE WHERE profile_id = 'user-profile-uuid' AND is_primary = TRUE;
-- Then set new primary
-- UPDATE user_languages SET is_primary = TRUE WHERE id = 'new-primary-language-uuid';

-- Example 9: Find users who speak a specific language
-- SELECT DISTINCT up.id, up.display_name, up.handle
-- FROM users_profile up
-- JOIN user_languages ul ON up.id = ul.profile_id
-- JOIN languages_master lm ON ul.language_id = lm.id
-- WHERE lm.name = 'Spanish' OR ul.custom_language_name = 'Spanish';

-- Example 10: Get language statistics
-- SELECT 
--     lm.name,
--     COUNT(ul.id) as user_count,
--     COUNT(ul.id) FILTER (WHERE ul.is_primary = TRUE) as primary_count
-- FROM languages_master lm
-- LEFT JOIN user_languages ul ON lm.id = ul.language_id
-- WHERE lm.is_active = TRUE
-- GROUP BY lm.id, lm.name, lm.sort_order
-- ORDER BY user_count DESC, lm.sort_order ASC;

-- Example 11: Find users with multiple languages
-- SELECT 
--     up.display_name,
--     up.handle,
--     COUNT(ul.id) as language_count,
--     ARRAY_AGG(
--         COALESCE(lm.name, ul.custom_language_name) 
--         ORDER BY ul.is_primary DESC, ul.created_at ASC
--     ) as languages
-- FROM users_profile up
-- JOIN user_languages ul ON up.id = ul.profile_id
-- LEFT JOIN languages_master lm ON ul.language_id = lm.id
-- GROUP BY up.id, up.display_name, up.handle
-- HAVING COUNT(ul.id) > 1
-- ORDER BY language_count DESC;

-- Example 12: Find users who speak both English and Spanish
-- SELECT DISTINCT up.id, up.display_name, up.handle
-- FROM users_profile up
-- WHERE up.id IN (
--     SELECT ul1.profile_id
--     FROM user_languages ul1
--     JOIN languages_master lm1 ON ul1.language_id = lm1.id
--     WHERE lm1.name = 'English'
--     INTERSECT
--     SELECT ul2.profile_id
--     FROM user_languages ul2
--     JOIN languages_master lm2 ON ul2.language_id = lm2.id
--     WHERE lm2.name = 'Spanish'
-- );

-- Example 13: Get proficiency level distribution
-- SELECT 
--     proficiency_level,
--     COUNT(*) as user_count,
--     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
-- FROM user_languages
-- GROUP BY proficiency_level
-- ORDER BY 
--     CASE proficiency_level
--         WHEN 'native' THEN 1
--         WHEN 'advanced' THEN 2
--         WHEN 'intermediate' THEN 3
--         WHEN 'beginner' THEN 4
--     END;

-- Example 14: Find most popular custom languages
-- SELECT 
--     custom_language_name,
--     COUNT(*) as user_count
-- FROM user_languages
-- WHERE custom_language_name IS NOT NULL
-- GROUP BY custom_language_name
-- ORDER BY user_count DESC
-- LIMIT 10;

-- Example 15: Language matching for gigs (if gigs have language requirements)
-- This would be useful if you add language requirements to gigs
-- SELECT g.id, g.title, g.description
-- FROM gigs g
-- JOIN user_languages ul ON ul.profile_id = g.owner_user_id
-- JOIN languages_master lm ON ul.language_id = lm.id
-- WHERE lm.name = 'Spanish' AND ul.proficiency_level IN ('advanced', 'native');

-- Example 16: Create a view for easy language lookups in applications
CREATE OR REPLACE VIEW user_language_summary AS
SELECT 
    up.id as profile_id,
    up.display_name,
    up.handle,
    COUNT(ul.id) as total_languages,
    COUNT(ul.id) FILTER (WHERE ul.is_primary = TRUE) as primary_language_count,
    ARRAY_AGG(
        CASE 
            WHEN ul.is_primary THEN COALESCE(lm.name, ul.custom_language_name) || ' (Primary)'
            ELSE COALESCE(lm.name, ul.custom_language_name)
        END
        ORDER BY ul.is_primary DESC, ul.created_at ASC
    ) as languages_list,
    ARRAY_AGG(
        ul.proficiency_level
        ORDER BY ul.is_primary DESC, ul.created_at ASC
    ) as proficiency_levels
FROM users_profile up
LEFT JOIN user_languages ul ON up.id = ul.profile_id
LEFT JOIN languages_master lm ON ul.language_id = lm.id
GROUP BY up.id, up.display_name, up.handle;

-- Grant access to the view
GRANT SELECT ON user_language_summary TO authenticated;

-- Example 17: Create a function to validate language proficiency
CREATE OR REPLACE FUNCTION validate_language_proficiency(
    p_proficiency_level VARCHAR(20)
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_proficiency_level IN ('beginner', 'intermediate', 'advanced', 'native');
END;
$$ LANGUAGE plpgsql;

-- Example 18: Create a function to get language suggestions based on user's existing languages
CREATE OR REPLACE FUNCTION get_language_suggestions(p_profile_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    native_name VARCHAR(100),
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lm.id,
        lm.name,
        lm.native_name,
        'Popular language'::TEXT as reason
    FROM languages_master lm
    WHERE lm.is_active = TRUE
    AND lm.is_popular = TRUE
    AND lm.id NOT IN (
        SELECT ul.language_id 
        FROM user_languages ul 
        WHERE ul.profile_id = p_profile_id 
        AND ul.language_id IS NOT NULL
    )
    ORDER BY lm.sort_order ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_language_proficiency TO authenticated;
GRANT EXECUTE ON FUNCTION get_language_suggestions TO authenticated;

-- Add comments
COMMENT ON VIEW user_language_summary IS 'Summary view of user languages with counts and lists';
COMMENT ON FUNCTION validate_language_proficiency IS 'Validates if a proficiency level is valid';
COMMENT ON FUNCTION get_language_suggestions IS 'Suggests languages for a user based on popular languages they dont have';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Languages usage examples and helper functions created successfully!';
    RAISE NOTICE 'Created user_language_summary view for easy lookups';
    RAISE NOTICE 'Added validation and suggestion functions';
    RAISE NOTICE 'Provided comprehensive usage examples';
END $$;
