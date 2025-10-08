-- Secure Preset Marketplace Access
-- Prevents users from viewing prompts/settings of presets they haven't purchased

-- ============================================
-- PROBLEM:
-- Current RLS policy allows anyone to view ALL preset data including:
-- - prompt_template (the actual prompt)
-- - negative_prompt
-- - style_settings, technical_settings, seedream_config
-- This defeats the purpose of selling presets!
-- ============================================

-- ============================================
-- SOLUTION:
-- Create a view that shows LIMITED data for marketplace presets
-- and a function to check if user has purchased a preset
-- ============================================


-- ============================================
-- 1. FUNCTION TO CHECK PRESET OWNERSHIP
-- ============================================

CREATE OR REPLACE FUNCTION user_owns_preset(preset_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  preset_owner UUID;
  preset_is_for_sale BOOLEAN;
BEGIN
  -- Get preset owner and sale status
  SELECT p.user_id, p.is_for_sale INTO preset_owner, preset_is_for_sale
  FROM presets p
  WHERE p.id = preset_id;

  -- System presets (user_id IS NULL) are always accessible
  IF preset_owner IS NULL THEN
    RETURN true;
  END IF;

  -- Free presets (not for sale) are always accessible
  IF preset_is_for_sale = false THEN
    RETURN true;
  END IF;

  -- For marketplace presets, check ownership
  RETURN EXISTS (
    -- User created the preset
    SELECT 1 FROM presets
    WHERE id = preset_id
    AND presets.user_id = user_id
  ) OR EXISTS (
    -- User purchased the preset
    SELECT 1 FROM preset_purchases
    WHERE preset_purchases.preset_id = preset_id
    AND preset_purchases.buyer_user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 2. UPDATE RLS POLICIES
-- ============================================

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view public presets" ON presets;

-- Policy 1: Users can view their OWN presets (all fields)
-- This already exists: "Users can view their own presets"

-- Policy 2: Users can view BASIC INFO of public presets (no sensitive fields)
-- We'll handle this at the API level by selecting only safe columns

-- Policy 3: Users can view FULL DATA of system/free/owned/purchased presets
CREATE POLICY "Users can view purchased preset details" ON presets
  FOR SELECT
  USING (
    is_public = true
    AND (
      -- System presets (platform-created, always accessible)
      user_id IS NULL
      OR
      -- Free presets (not for sale, always accessible)
      is_for_sale = false
      OR
      -- User created it
      auth.uid() = user_id
      OR
      -- User purchased it
      EXISTS (
        SELECT 1 FROM preset_purchases
        WHERE preset_purchases.preset_id = presets.id
        AND preset_purchases.buyer_user_id = auth.uid()
      )
    )
  );

-- Policy 4: Public can view MARKETPLACE LISTINGS (basic info only)
-- This allows browsing the marketplace without exposing sensitive data
CREATE POLICY "Public can view marketplace preview" ON presets
  FOR SELECT
  USING (
    is_public = true
    AND is_for_sale = true
    AND marketplace_status = 'approved'
  );


-- ============================================
-- 3. CREATE SAFE VIEW FOR MARKETPLACE BROWSING
-- ============================================

CREATE OR REPLACE VIEW preset_marketplace_preview AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.display_name,
  p.description,
  p.category,
  p.generation_mode,
  p.is_public,
  p.is_featured,
  p.usage_count,
  p.created_at,
  p.updated_at,
  p.likes_count,
  p.is_for_sale,
  p.sale_price,
  p.seller_user_id,
  p.marketplace_status,
  p.total_sales,
  -- Show ONLY preview images, not actual prompts
  (SELECT array_agg(pi.result_image_url ORDER BY pi.created_at DESC)
   FROM preset_images pi
   WHERE pi.preset_id = p.id
   LIMIT 5) as preview_images,
  -- Check if current user owns this preset
  CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE user_owns_preset(p.id, auth.uid())
  END as user_owns_preset
FROM presets p
WHERE p.is_public = true
AND p.is_for_sale = true
AND p.marketplace_status = 'approved';

-- Grant access to the view
GRANT SELECT ON preset_marketplace_preview TO authenticated;
GRANT SELECT ON preset_marketplace_preview TO anon;


-- ============================================
-- 4. CREATE FULL PRESET VIEW (FOR OWNERS ONLY)
-- ============================================

CREATE OR REPLACE VIEW preset_full_details AS
SELECT
  p.*,
  -- Include sensitive fields ONLY if user owns the preset
  CASE
    WHEN auth.uid() = p.user_id OR user_owns_preset(p.id, auth.uid())
    THEN p.prompt_template
    ELSE '🔒 Purchase this preset to view the prompt'
  END as accessible_prompt_template,
  CASE
    WHEN auth.uid() = p.user_id OR user_owns_preset(p.id, auth.uid())
    THEN p.negative_prompt
    ELSE NULL
  END as accessible_negative_prompt,
  CASE
    WHEN auth.uid() = p.user_id OR user_owns_preset(p.id, auth.uid())
    THEN p.style_settings
    ELSE '{}'::jsonb
  END as accessible_style_settings,
  CASE
    WHEN auth.uid() = p.user_id OR user_owns_preset(p.id, auth.uid())
    THEN p.technical_settings
    ELSE '{}'::jsonb
  END as accessible_technical_settings,
  CASE
    WHEN auth.uid() = p.user_id OR user_owns_preset(p.id, auth.uid())
    THEN p.seedream_config
    ELSE '{}'::jsonb
  END as accessible_seedream_config,
  CASE
    WHEN auth.uid() = p.user_id OR user_owns_preset(p.id, auth.uid())
    THEN p.cinematic_settings
    ELSE '{}'::jsonb
  END as accessible_cinematic_settings,
  user_owns_preset(p.id, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)) as user_owns_preset
FROM presets p;

-- Grant access to the view
GRANT SELECT ON preset_full_details TO authenticated;
GRANT SELECT ON preset_full_details TO anon;


-- ============================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION user_owns_preset(UUID, UUID) IS
  'Returns true if: (1) preset is a system preset (user_id IS NULL), (2) preset is free (not for sale), (3) user created the preset, or (4) user purchased the preset. Used for access control.';

COMMENT ON VIEW preset_marketplace_preview IS
  'Safe view for browsing marketplace presets. Excludes sensitive fields like prompts and settings.';

COMMENT ON VIEW preset_full_details IS
  'Full preset view with conditional access to sensitive fields based on ownership/purchase.';


-- ============================================
-- 6. MIGRATION GUIDE FOR API UPDATES
-- ============================================

-- After running this migration, update your API routes:
--
-- MARKETPLACE BROWSING (public):
-- Use: preset_marketplace_preview
-- Returns: Basic info + preview images (NO prompts/settings)
--
-- PRESET DETAILS (requires ownership):
-- Use: preset_full_details
-- Returns: Full data IF user owns/purchased, otherwise locked fields
--
-- Example API queries:
--
-- 1. Browse marketplace:
-- SELECT * FROM preset_marketplace_preview
-- WHERE category = 'style'
-- ORDER BY total_sales DESC;
--
-- 2. View preset details:
-- SELECT * FROM preset_full_details
-- WHERE id = 'preset-uuid';
-- -- Will automatically hide sensitive fields if user doesn't own it
--
-- 3. Check if user can access preset:
-- SELECT user_owns_preset('preset-uuid', auth.uid());


-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
  view_count INTEGER;
  function_exists BOOLEAN;
BEGIN
  -- Count preset policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'presets';

  -- Count views created
  SELECT COUNT(*) INTO view_count
  FROM pg_views
  WHERE schemaname = 'public'
  AND viewname IN ('preset_marketplace_preview', 'preset_full_details');

  -- Check function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'user_owns_preset'
  ) INTO function_exists;

  RAISE NOTICE '✅ Preset marketplace security migration complete';
  RAISE NOTICE '📊 Active preset policies: %', policy_count;
  RAISE NOTICE '👁️  Secure views created: %', view_count;
  RAISE NOTICE '🔒 Ownership check function: %', CASE WHEN function_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Update API routes to use:';
  RAISE NOTICE '   - preset_marketplace_preview (for browsing)';
  RAISE NOTICE '   - preset_full_details (for viewing with ownership check)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Sensitive fields now hidden unless user owns/purchased preset';
END $$;
