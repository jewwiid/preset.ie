-- Add missing aspect ratios that are used in AspectRatioSelector but not in database
-- This migration adds 3:4 and 16:10 aspect ratios

INSERT INTO public.aspect_ratios (value, label, description) VALUES
('3:4', '3:4 Portrait', 'Portrait orientation'),
('16:10', '16:10 Widescreen', 'Computer screen widescreen')
ON CONFLICT (value) DO NOTHING;
