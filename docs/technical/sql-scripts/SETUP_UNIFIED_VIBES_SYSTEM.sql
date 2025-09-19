-- UNIFIED VIBES SYSTEM SETUP
-- This creates a single source of truth for all vibes across moodboards, gigs, and notifications
-- Copy and paste this ENTIRE content into Supabase Dashboard > SQL Editor

-- Step 1: Create the comprehensive vibes system
-- Create vibes master table with predefined options
CREATE TABLE IF NOT EXISTS public.vibes_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL, -- 'mood', 'style', 'aesthetic', 'genre'
  color_hex VARCHAR(7), -- Associated color for UI display
  emoji VARCHAR(10), -- Associated emoji
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Insert comprehensive vibe options organized by category
INSERT INTO public.vibes_master (name, display_name, description, category, color_hex, emoji) VALUES
-- Mood vibes
('ethereal', 'Ethereal', 'Otherworldly, dreamy, and mystical atmosphere', 'mood', '#E8E3FF', '✨'),
('moody', 'Moody', 'Dark, dramatic, and emotionally intense', 'mood', '#2D1B3D', '🌙'),
('bright', 'Bright', 'Vibrant, energetic, and uplifting', 'mood', '#FFD700', '☀️'),
('serene', 'Serene', 'Calm, peaceful, and tranquil', 'mood', '#B8E6B8', '🕊️'),
('bold', 'Bold', 'Strong, confident, and striking', 'mood', '#FF6B35', '🔥'),
('romantic', 'Romantic', 'Soft, loving, and intimate', 'mood', '#FFB6C1', '💕'),
('edgy', 'Edgy', 'Sharp, rebellious, and unconventional', 'mood', '#333333', '⚡'),
('playful', 'Playful', 'Fun, whimsical, and lighthearted', 'mood', '#FF69B4', '🎈'),
('cinematic', 'Cinematic', 'Movie-like, dramatic storytelling', 'mood', '#800080', '🎬'),
('dynamic', 'Dynamic', 'Energetic, moving, full of action', 'mood', '#FF4500', '💫'),

-- Style vibes  
('minimalist', 'Minimalist', 'Clean, simple, and uncluttered', 'style', '#F5F5F5', '⚪'),
('vintage', 'Vintage', 'Classic, nostalgic, and timeless', 'style', '#D2691E', '📻'),
('modern', 'Modern', 'Contemporary, sleek, and current', 'style', '#4A90E2', '🔷'),
('boho', 'Boho', 'Bohemian, free-spirited, and eclectic', 'style', '#8B4513', '🌿'),
('industrial', 'Industrial', 'Raw, urban, and mechanical', 'style', '#696969', '🏭'),

-- Aesthetic vibes
('dark_academia', 'Dark Academia', 'Scholarly, gothic, and intellectual', 'aesthetic', '#654321', '📚'),
('cottagecore', 'Cottagecore', 'Rural, cozy, and nature-focused', 'aesthetic', '#90EE90', '🏡'),

-- Genre vibes (same as style tags)
('fashion', 'Fashion', 'Style-focused and trendy', 'genre', '#FF1493', '👗'),
('portrait', 'Portrait', 'People-centered and expressive', 'genre', '#DEB887', '📷'),
('editorial', 'Editorial', 'Magazine-style and narrative', 'genre', '#4682B4', '📄'),
('lifestyle', 'Lifestyle', 'Natural, candid, everyday moments', 'genre', '#32CD32', '🌱'),
('commercial', 'Commercial', 'Product and brand focused', 'genre', '#FF4500', '🛍️'),
('street', 'Street', 'Urban and candid', 'genre', '#778899', '🚶'),
('documentary', 'Documentary', 'Real-life storytelling', 'genre', '#2F4F4F', '📹'),
('conceptual', 'Conceptual', 'Artistic and idea-driven', 'genre', '#9370DB', '💭'),
('wedding', 'Wedding', 'Celebration and ceremony focused', 'genre', '#FFC0CB', '💒'),
('event', 'Event', 'Special occasions and gatherings', 'genre', '#FFD700', '🎉'),
('product', 'Product', 'Item and merchandise focused', 'genre', '#FF6347', '📦'),
('brand', 'Brand', 'Company and identity focused', 'genre', '#4169E1', '🏢'),
('artistic', 'Artistic', 'Creative and expressive', 'genre', '#DDA0DD', '🎨'),
('creative', 'Creative', 'Innovative and imaginative', 'genre', '#FF69B4', '💡'),
('natural', 'Natural', 'Organic and unprocessed', 'genre', '#228B22', '🌿'),
('candid', 'Candid', 'Spontaneous and unposed', 'genre', '#CD853F', '📸'),
('timeless', 'Timeless', 'Classic and enduring', 'genre', '#BC8F8F', '⏳'),
('professional', 'Professional', 'Business and corporate', 'genre', '#2F4F4F', '💼'),
('clean', 'Clean', 'Pure and uncluttered', 'genre', '#F0F8FF', '✨'),
('warm', 'Warm', 'Cozy and inviting', 'genre', '#FFA500', '🔥'),
('urban', 'Urban', 'City and metropolitan', 'genre', '#708090', '🏙️'),
('gritty', 'Gritty', 'Raw and realistic', 'genre', '#A0522D', '🧱'),
('authentic', 'Authentic', 'Genuine and real', 'genre', '#8B4513', '✓'),
('unique', 'Unique', 'One-of-a-kind and distinctive', 'genre', '#9932CC', '🦄'),
('stylish', 'Stylish', 'Fashionable and trendy', 'genre', '#DC143C', '💅')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Enable RLS and create policies
ALTER TABLE public.vibes_master ENABLE ROW LEVEL SECURITY;

-- Everyone can read vibes_master
CREATE POLICY "Vibes master is publicly readable" ON public.vibes_master
  FOR SELECT USING (true);

-- Step 4: Update existing gigs to use proper vibe IDs instead of strings
-- First, update the sample data we added earlier to match the vibes_master names
UPDATE gigs 
SET 
    vibe_tags = ARRAY(
        SELECT vm.name 
        FROM public.vibes_master vm 
        WHERE vm.name = ANY(vibe_tags)
    ),
    style_tags = ARRAY(
        SELECT vm.name 
        FROM public.vibes_master vm 
        WHERE vm.name = ANY(style_tags)
    )
WHERE (vibe_tags IS NOT NULL AND vibe_tags != '{}') 
   OR (style_tags IS NOT NULL AND style_tags != '{}');

-- Step 5: Verify the setup
SELECT 'Vibes Master Setup' as status, COUNT(*) as vibe_count FROM public.vibes_master
UNION ALL
SELECT 'Gigs with Vibes', COUNT(*) FROM gigs WHERE vibe_tags IS NOT NULL AND vibe_tags != '{}'
UNION ALL  
SELECT 'Gigs with Styles', COUNT(*) FROM gigs WHERE style_tags IS NOT NULL AND style_tags != '{}';