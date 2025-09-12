-- Comprehensive Vibe and Style System for Moodboards and User Profiles
-- This migration creates a robust system for vibe/style management, tracking, and matching

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

-- Insert comprehensive vibe options organized by category
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

-- Style vibes  
('minimalist', 'Minimalist', 'Clean, simple, and uncluttered', 'style', '#F5F5F5', '⚪'),
('maximalist', 'Maximalist', 'Rich, layered, and abundantly detailed', 'style', '#8B4513', '🎭'),
('vintage', 'Vintage', 'Classic, nostalgic, and timeless', 'style', '#D2691E', '📻'),
('modern', 'Modern', 'Contemporary, sleek, and current', 'style', '#4A90E2', '🔷'),
('boho', 'Boho', 'Bohemian, free-spirited, and eclectic', 'style', '#8B4513', '🌿'),
('industrial', 'Industrial', 'Raw, urban, and mechanical', 'style', '#696969', '🏭'),
('scandinavian', 'Scandinavian', 'Nordic, cozy, and functional', 'style', '#E8F4FD', '❄️'),
('tropical', 'Tropical', 'Lush, warm, and paradise-inspired', 'style', '#00CED1', '🌺'),

-- Aesthetic vibes
('dark_academia', 'Dark Academia', 'Scholarly, gothic, and intellectual', 'aesthetic', '#654321', '📚'),
('cottagecore', 'Cottagecore', 'Rural, cozy, and nature-focused', 'aesthetic', '#90EE90', '🏡'),
('cyberpunk', 'Cyberpunk', 'Futuristic, neon, and tech-noir', 'aesthetic', '#00FFFF', '🤖'),
('art_deco', 'Art Deco', 'Geometric, luxurious, and glamorous', 'aesthetic', '#FFD700', '💎'),
('grunge', 'Grunge', 'Distressed, alternative, and raw', 'aesthetic', '#708090', '🎸'),
('pastel_goth', 'Pastel Goth', 'Dark themes with soft colors', 'aesthetic', '#DDA0DD', '🦇'),
('vaporwave', 'Vaporwave', 'Retro-futuristic and nostalgic digital', 'aesthetic', '#FF00FF', '🌊'),
('normcore', 'Normcore', 'Deliberately ordinary and unpretentious', 'aesthetic', '#DCDCDC', '👔'),

-- Genre vibes
('fashion', 'Fashion', 'Style-focused and trendy', 'genre', '#FF1493', '👗'),
('portrait', 'Portrait', 'People-centered and expressive', 'genre', '#DEB887', '📷'),
('landscape', 'Landscape', 'Nature and environment focused', 'genre', '#32CD32', '🏔️'),
('street', 'Street', 'Urban and candid', 'genre', '#778899', '🚶'),
('architectural', 'Architectural', 'Building and structure focused', 'genre', '#A9A9A9', '🏢'),
('editorial', 'Editorial', 'Magazine-style and narrative', 'genre', '#4682B4', '📄'),
('commercial', 'Commercial', 'Product and brand focused', 'genre', '#FF4500', '🛍️'),
('conceptual', 'Conceptual', 'Artistic and idea-driven', 'genre', '#9370DB', '💭')
ON CONFLICT (name) DO NOTHING;

-- Add vibe_ids column to moodboards to reference selected vibes
ALTER TABLE public.moodboards 
ADD COLUMN IF NOT EXISTS vibe_ids UUID[] DEFAULT '{}';

-- Create index for vibe queries
CREATE INDEX IF NOT EXISTS idx_moodboards_vibe_ids ON public.moodboards USING GIN(vibe_ids);

-- Add constraint to limit vibes per moodboard
ALTER TABLE public.moodboards 
ADD CONSTRAINT IF NOT EXISTS check_moodboard_vibe_limit 
CHECK (array_length(vibe_ids, 1) IS NULL OR array_length(vibe_ids, 1) <= 5);

-- Create user_vibe_analytics table to track user's vibe patterns
CREATE TABLE IF NOT EXISTS public.user_vibe_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vibe_id UUID REFERENCES public.vibes_master(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0 based on frequency
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vibe_id)
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_user_vibe_analytics_user ON public.user_vibe_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vibe_analytics_confidence ON public.user_vibe_analytics(user_id, confidence_score DESC);

-- Function to update user vibe analytics when moodboard is created/updated
CREATE OR REPLACE FUNCTION update_user_vibe_analytics()
RETURNS TRIGGER AS $$
DECLARE
  vibe_id UUID;
  total_usage INTEGER;
BEGIN
  -- Only process if vibe_ids changed or new moodboard
  IF (TG_OP = 'INSERT' OR NEW.vibe_ids IS DISTINCT FROM OLD.vibe_ids) THEN
    -- Update analytics for each vibe in the moodboard
    FOREACH vibe_id IN ARRAY NEW.vibe_ids
    LOOP
      -- Insert or update vibe usage
      INSERT INTO public.user_vibe_analytics (user_id, vibe_id, usage_count, last_used_at)
      VALUES (NEW.owner_user_id, vibe_id, 1, NOW())
      ON CONFLICT (user_id, vibe_id) 
      DO UPDATE SET 
        usage_count = user_vibe_analytics.usage_count + 1,
        last_used_at = NOW();
        
      -- Update global usage count in vibes_master
      UPDATE public.vibes_master 
      SET usage_count = usage_count + 1 
      WHERE id = vibe_id;
    END LOOP;
    
    -- Calculate confidence scores for this user
    SELECT COUNT(*) INTO total_usage 
    FROM public.user_vibe_analytics 
    WHERE user_id = NEW.owner_user_id;
    
    -- Update confidence scores (relative frequency)
    UPDATE public.user_vibe_analytics 
    SET confidence_score = LEAST(1.0, usage_count::DECIMAL / GREATEST(1, total_usage::DECIMAL))
    WHERE user_id = NEW.owner_user_id;
    
    -- Update user's primary vibe_tags based on top confidence scores
    UPDATE public.users_profile 
    SET vibe_tags = (
      SELECT ARRAY_AGG(vm.name ORDER BY uva.confidence_score DESC)
      FROM public.user_vibe_analytics uva
      JOIN public.vibes_master vm ON vm.id = uva.vibe_id
      WHERE uva.user_id = NEW.owner_user_id
      AND uva.confidence_score > 0.1 -- Only include meaningful vibes
      LIMIT 5
    )
    WHERE user_id = NEW.owner_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic vibe analytics updates
DROP TRIGGER IF EXISTS trigger_update_user_vibe_analytics ON public.moodboards;
CREATE TRIGGER trigger_update_user_vibe_analytics
  AFTER INSERT OR UPDATE OF vibe_ids ON public.moodboards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_vibe_analytics();

-- Function to find similar users based on vibe preferences
CREATE OR REPLACE FUNCTION find_users_by_vibe_similarity(target_user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  handle TEXT,
  similarity_score DECIMAL,
  shared_vibes TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.handle,
    -- Calculate cosine similarity based on vibe confidence scores
    COALESCE(
      (SELECT 
        SUM(uva1.confidence_score * uva2.confidence_score) / 
        (SQRT(SUM(uva1.confidence_score * uva1.confidence_score)) * 
         SQRT(SUM(uva2.confidence_score * uva2.confidence_score)))
       FROM public.user_vibe_analytics uva1
       JOIN public.user_vibe_analytics uva2 ON uva1.vibe_id = uva2.vibe_id
       WHERE uva1.user_id = target_user_id AND uva2.user_id = p.user_id
      ), 0.0
    )::DECIMAL as similarity_score,
    -- Get shared vibe names
    ARRAY(
      SELECT vm.name
      FROM public.user_vibe_analytics uva1
      JOIN public.user_vibe_analytics uva2 ON uva1.vibe_id = uva2.vibe_id
      JOIN public.vibes_master vm ON vm.id = uva1.vibe_id
      WHERE uva1.user_id = target_user_id AND uva2.user_id = p.user_id
      ORDER BY (uva1.confidence_score + uva2.confidence_score) DESC
      LIMIT 3
    ) as shared_vibes
  FROM public.users_profile p
  WHERE p.user_id != target_user_id
  AND EXISTS (
    SELECT 1 FROM public.user_vibe_analytics uva 
    WHERE uva.user_id = p.user_id
  )
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to recommend vibes for a user based on their history
CREATE OR REPLACE FUNCTION recommend_vibes_for_user(target_user_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  vibe_id UUID,
  name VARCHAR,
  display_name VARCHAR,
  category VARCHAR,
  recommendation_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vm.id,
    vm.name,
    vm.display_name,
    vm.category,
    -- Score based on: global popularity + category preference + novelty
    (
      (vm.usage_count::DECIMAL / (SELECT MAX(usage_count) FROM public.vibes_master)) * 0.3 +
      COALESCE(cat_pref.category_score, 0) * 0.5 +
      (CASE WHEN user_usage.vibe_id IS NULL THEN 0.2 ELSE 0 END)
    ) as recommendation_score
  FROM public.vibes_master vm
  LEFT JOIN public.user_vibe_analytics user_usage ON user_usage.vibe_id = vm.id AND user_usage.user_id = target_user_id
  LEFT JOIN (
    -- Calculate user's preference for each category
    SELECT 
      vm_inner.category,
      AVG(uva_inner.confidence_score) as category_score
    FROM public.user_vibe_analytics uva_inner
    JOIN public.vibes_master vm_inner ON vm_inner.id = uva_inner.vibe_id
    WHERE uva_inner.user_id = target_user_id
    GROUP BY vm_inner.category
  ) cat_pref ON cat_pref.category = vm.category
  WHERE vm.is_active = true
  AND (user_usage.vibe_id IS NULL OR user_usage.confidence_score < 0.3) -- Exclude heavily used vibes
  ORDER BY recommendation_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.vibes_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vibe_analytics ENABLE ROW LEVEL SECURITY;

-- Everyone can read vibes_master
CREATE POLICY "Vibes master is publicly readable" ON public.vibes_master
  FOR SELECT USING (true);

-- Users can only see their own analytics
CREATE POLICY "Users can view their own vibe analytics" ON public.user_vibe_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update analytics (functions run with SECURITY DEFINER)
CREATE POLICY "System can manage vibe analytics" ON public.user_vibe_analytics
  FOR ALL USING (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_vibe_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION find_users_by_vibe_similarity(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION recommend_vibes_for_user(UUID, INTEGER) TO authenticated;

-- Add comments
COMMENT ON TABLE public.vibes_master IS 'Master list of available vibes/styles for moodboards and user profiles';
COMMENT ON TABLE public.user_vibe_analytics IS 'Tracks user vibe usage patterns for personalization and matching';
COMMENT ON FUNCTION update_user_vibe_analytics() IS 'Automatically updates user vibe analytics when moodboard vibes change';
COMMENT ON FUNCTION find_users_by_vibe_similarity(UUID, INTEGER) IS 'Finds users with similar vibe preferences using cosine similarity';
COMMENT ON FUNCTION recommend_vibes_for_user(UUID, INTEGER) IS 'Recommends new vibes for a user based on their patterns and global trends';