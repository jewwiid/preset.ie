-- Activate all style prompts that might have been created with is_active = false
-- This ensures all 49+ styles appear in the dropdowns

UPDATE public.style_prompts
SET is_active = true
WHERE is_active = false OR is_active IS NULL;

-- Verify the update
SELECT
  COUNT(*) as total_styles,
  COUNT(*) FILTER (WHERE is_active = true) as active_styles,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_styles
FROM public.style_prompts;
