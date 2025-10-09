-- Add comprehensive video generation presets
-- These presets include video-specific settings in cinematic_settings.video

-- =============================================================================
-- ANIME & ANIMATION PRESETS
-- =============================================================================

INSERT INTO presets (
  name,
  display_name,
  description,
  category,
  prompt_template,
  prompt_template_video,
  generation_mode,
  is_public,
  is_featured,
  is_active,
  sort_order,
  technical_settings,
  cinematic_settings
) VALUES
(
  'anime_action_scene',
  'Anime Action Scene',
  'Dynamic anime-style action with dramatic camera movements and vibrant colors. Perfect for battle scenes and high-energy sequences.',
  'cinematic',
  'Epic anime battle scene with dynamic action',
  'Epic anime battle scene with dynamic action and dramatic camera work',
  'both',
  true,
  true,
  true,
  1,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Hayao Miyazaki",
      "cameraAngle": "dynamic",
      "lightingStyle": "dramatic",
      "sceneMood": "epic",
      "shotSize": "wide"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "tracking-forward",
      "videoStyle": "Anime Style",
      "duration": 5,
      "provider": "seedream",
      "resolution": "720p"
    }
  }'
),
(
  'anime_slice_of_life',
  'Anime Slice of Life',
  'Gentle, contemplative anime style with soft movements and warm colors. Ideal for peaceful, everyday scenes.',
  'cinematic',
  'Peaceful anime scene with soft lighting',
  'Peaceful anime scene with soft lighting and gentle movement',
  'both',
  true,
  false,
  true,
  2,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Makoto Shinkai",
      "lightingStyle": "soft natural",
      "sceneMood": "peaceful",
      "shotSize": "medium"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "smooth",
      "videoStyle": "Anime Style",
      "duration": 5,
      "provider": "seedream",
      "resolution": "720p"
    }
  }'
),

-- =============================================================================
-- CINEMATIC & FILM PRESETS
-- =============================================================================

(
  'cinematic_slowmo',
  'Cinematic Slow Motion',
  'Epic slow-motion cinematography with dramatic lighting and smooth camera movements. Perfect for impactful moments.',
  'cinematic',
  'Cinematic scene with dramatic lighting',
  'Cinematic scene with dramatic lighting and slow-motion effect',
  'both',
  true,
  true,
  true,
  3,
  '{"aspect_ratio": "21:9", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Christopher Nolan",
      "cameraAngle": "low angle",
      "lightingStyle": "dramatic cinematic",
      "sceneMood": "epic",
      "shotSize": "medium close-up",
      "depthOfField": "shallow"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "floating",
      "videoStyle": "Cinematic",
      "duration": 10,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
),
(
  'action_blockbuster',
  'Action Blockbuster',
  'High-octane action with dynamic camera work, intense movements, and bold colors. For explosive, adrenaline-pumping sequences.',
  'cinematic',
  'Intense action scene with dynamic composition',
  'Intense action scene with explosive movement and dynamic camera work',
  'both',
  true,
  true,
  true,
  4,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "2048"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Michael Bay",
      "cameraAngle": "dutch angle",
      "lightingStyle": "high contrast",
      "sceneMood": "intense",
      "shotSize": "wide",
      "depthOfField": "deep"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "tracking-forward",
      "videoStyle": "Cinematic",
      "duration": 5,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
),
(
  'noir_mystery',
  'Film Noir Mystery',
  'Moody black and white aesthetic with dramatic shadows and mysterious atmosphere. Perfect for suspenseful, noir-style scenes.',
  'cinematic',
  'Film noir scene with dramatic shadows',
  'Film noir scene with dramatic shadows and mysterious atmosphere',
  'both',
  true,
  false,
  true,
  5,
  '{"aspect_ratio": "4:3", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Alfred Hitchcock",
      "cameraAngle": "low angle",
      "lightingStyle": "chiaroscuro",
      "sceneMood": "mysterious",
      "shotSize": "medium",
      "depthOfField": "shallow"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "smooth",
      "videoStyle": "Film Noir",
      "duration": 5,
      "provider": "seedream",
      "resolution": "720p"
    }
  }'
),

-- =============================================================================
-- DOCUMENTARY & REALISTIC PRESETS
-- =============================================================================

(
  'documentary_style',
  'Documentary Style',
  'Natural, observational camera work with realistic movements and authentic lighting. Ideal for documentary-style content.',
  'cinematic',
  'Documentary-style scene with natural lighting',
  'Documentary-style scene with natural lighting and observational camera work',
  'both',
  true,
  false,
  true,
  6,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "cameraAngle": "eye level",
      "lightingStyle": "natural",
      "sceneMood": "authentic",
      "shotSize": "medium"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "floating",
      "videoStyle": "Photorealistic",
      "duration": 10,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
),
(
  'nature_wildlife',
  'Nature & Wildlife',
  'Smooth, patient camera movements capturing natural beauty. Perfect for nature documentaries and wildlife content.',
  'cinematic',
  'Nature scene with wildlife',
  'Nature scene with wildlife and smooth, observational camera work',
  'both',
  true,
  false,
  true,
  7,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "2048"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "cameraAngle": "eye level",
      "lightingStyle": "golden hour",
      "sceneMood": "serene",
      "shotSize": "wide"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "smooth",
      "videoStyle": "Photorealistic",
      "duration": 10,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
),

-- =============================================================================
-- CREATIVE & ARTISTIC PRESETS
-- =============================================================================

(
  'dreamy_surreal',
  'Dreamy Surreal',
  'Ethereal, dreamlike visuals with floating camera movements and soft, otherworldly aesthetics. Perfect for fantasy and surreal content.',
  'artistic',
  'Surreal dreamscape with ethereal lighting',
  'Surreal dreamscape with ethereal lighting and floating camera movements',
  'both',
  true,
  true,
  true,
  8,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Wes Anderson",
      "lightingStyle": "ethereal",
      "sceneMood": "dreamlike",
      "shotSize": "medium",
      "depthOfField": "shallow"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "floating",
      "videoStyle": "Dreamlike",
      "duration": 5,
      "provider": "seedream",
      "resolution": "720p"
    }
  }'
),
(
  'abstract_motion',
  'Abstract Motion Graphics',
  'Dynamic abstract visuals with bold movements and geometric patterns. Ideal for motion graphics and experimental content.',
  'artistic',
  'Abstract composition with bold colors',
  'Abstract composition with bold colors and dynamic geometric movements',
  'both',
  true,
  false,
  true,
  9,
  '{"aspect_ratio": "1:1", "generation_mode": "text-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "lightingStyle": "vibrant",
      "sceneMood": "energetic",
      "shotSize": "close-up"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "tracking-forward",
      "videoStyle": "Abstract",
      "duration": 5,
      "provider": "wan",
      "resolution": "720p"
    }
  }'
),
(
  'watercolor_painting',
  'Watercolor Animation',
  'Soft, flowing watercolor aesthetic with gentle movements. Perfect for artistic, painterly animations.',
  'artistic',
  'Watercolor painting style scene',
  'Watercolor painting style scene with gentle flowing movements',
  'both',
  true,
  false,
  true,
  10,
  '{"aspect_ratio": "4:3", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "lightingStyle": "soft natural",
      "sceneMood": "peaceful",
      "shotSize": "medium"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "smooth",
      "videoStyle": "Watercolor",
      "duration": 5,
      "provider": "seedream",
      "resolution": "720p"
    }
  }'
),

-- =============================================================================
-- SCI-FI & FUTURISTIC PRESETS
-- =============================================================================

(
  'cyberpunk_neon',
  'Cyberpunk Neon',
  'Futuristic cyberpunk aesthetic with neon lights, rain effects, and dynamic camera movements. Perfect for sci-fi and cyberpunk content.',
  'cinematic',
  'Cyberpunk scene with neon lights',
  'Cyberpunk scene with neon lights, rain effects, and dynamic camera work',
  'both',
  true,
  true,
  true,
  11,
  '{"aspect_ratio": "21:9", "generation_mode": "image-to-video", "resolution": "2048"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Ridley Scott",
      "cameraAngle": "dutch angle",
      "lightingStyle": "neon",
      "sceneMood": "futuristic",
      "shotSize": "wide",
      "depthOfField": "shallow"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "tracking-forward",
      "videoStyle": "Cyberpunk",
      "duration": 5,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
),
(
  'space_exploration',
  'Space Exploration',
  'Epic space scenes with slow, majestic camera movements. Perfect for cosmic and space-themed content.',
  'cinematic',
  'Space scene with cosmic elements',
  'Space scene with cosmic elements and majestic camera movements',
  'both',
  true,
  true,
  true,
  12,
  '{"aspect_ratio": "16:9", "generation_mode": "text-to-video", "resolution": "2048"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Denis Villeneuve",
      "lightingStyle": "dramatic cinematic",
      "sceneMood": "awe-inspiring",
      "shotSize": "extreme wide",
      "depthOfField": "deep"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "floating",
      "videoStyle": "Sci-Fi",
      "duration": 10,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
),

-- =============================================================================
-- SOCIAL MEDIA & COMMERCIAL PRESETS
-- =============================================================================

(
  'instagram_reel',
  'Instagram Reel',
  'Vertical format with dynamic movements and trendy aesthetics. Optimized for Instagram Reels and TikTok.',
  'cinematic',
  'Trendy scene with vibrant colors',
  'Trendy scene with vibrant colors and dynamic movements for social media',
  'both',
  true,
  true,
  true,
  13,
  '{"aspect_ratio": "9:16", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": false,
    "includeTechnicalDetails": false,
    "includeStyleReferences": false,
    "video": {
      "cameraMovement": "tracking-forward",
      "videoStyle": "Vibrant",
      "duration": 5,
      "provider": "seedream",
      "resolution": "720p"
    }
  }'
),
(
  'product_showcase',
  'Product Showcase',
  'Smooth, professional camera movements showcasing products. Perfect for e-commerce and product demonstrations.',
  'product_photography',
  'Product on display with professional lighting',
  'Product on display with professional lighting and smooth camera movements',
  'both',
  true,
  true,
  true,
  14,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "2048"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "cameraAngle": "eye level",
      "lightingStyle": "studio",
      "sceneMood": "professional",
      "shotSize": "close-up",
      "depthOfField": "shallow"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "floating",
      "videoStyle": "Commercial",
      "duration": 5,
      "provider": "seedream",
      "resolution": "1080p"
    }
  }'
),
(
  'lifestyle_vlog',
  'Lifestyle Vlog',
  'Casual, authentic camera work with natural movements. Perfect for lifestyle vlogs and personal content.',
  'fashion_lifestyle',
  'Lifestyle scene with natural lighting',
  'Lifestyle scene with natural lighting and casual camera movements',
  'both',
  true,
  false,
  true,
  15,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": false,
    "includeTechnicalDetails": false,
    "includeStyleReferences": false,
    "video": {
      "cameraMovement": "floating",
      "videoStyle": "Photorealistic",
      "duration": 10,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
),

-- =============================================================================
-- HORROR & THRILLER PRESETS
-- =============================================================================

(
  'horror_suspense',
  'Horror Suspense',
  'Tense, unsettling camera work with dark shadows and eerie atmosphere. Perfect for horror and thriller content.',
  'cinematic',
  'Dark, ominous scene with shadows',
  'Dark, ominous scene with shadows and tense camera movements',
  'both',
  true,
  false,
  true,
  16,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "1024"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "directorStyle": "Jordan Peele",
      "cameraAngle": "low angle",
      "lightingStyle": "dark shadows",
      "sceneMood": "ominous",
      "shotSize": "medium close-up",
      "depthOfField": "shallow"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "smooth",
      "videoStyle": "Dark",
      "duration": 5,
      "provider": "seedream",
      "resolution": "720p"
    }
  }'
),

-- =============================================================================
-- TIME-LAPSE & HYPERLAPSE PRESETS
-- =============================================================================

(
  'urban_timelapse',
  'Urban Timelapse',
  'Fast-paced urban scenes with dynamic time-lapse effects. Perfect for city life and urban landscapes.',
  'cinematic',
  'City scene with urban landscape',
  'City scene with urban landscape and time-lapse effect',
  'both',
  true,
  false,
  true,
  17,
  '{"aspect_ratio": "21:9", "generation_mode": "image-to-video", "resolution": "2048"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "cameraAngle": "high angle",
      "lightingStyle": "golden hour",
      "sceneMood": "energetic",
      "shotSize": "extreme wide"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "tracking-forward",
      "videoStyle": "Photorealistic",
      "duration": 5,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
),
(
  'sunset_timelapse',
  'Sunset Timelapse',
  'Beautiful sunset transitions with smooth time-lapse effects. Perfect for nature and landscape content.',
  'cinematic',
  'Sunset landscape scene',
  'Sunset landscape scene with smooth time-lapse transition',
  'both',
  true,
  false,
  true,
  18,
  '{"aspect_ratio": "16:9", "generation_mode": "image-to-video", "resolution": "2048"}',
  '{
    "enableCinematicMode": true,
    "cinematicParameters": {
      "lightingStyle": "golden hour",
      "sceneMood": "peaceful",
      "shotSize": "wide"
    },
    "includeTechnicalDetails": true,
    "includeStyleReferences": true,
    "video": {
      "cameraMovement": "floating",
      "videoStyle": "Photorealistic",
      "duration": 10,
      "provider": "wan",
      "resolution": "1080p"
    }
  }'
);

-- Add comment to track video preset additions
COMMENT ON TABLE presets IS 'Includes 18 video-specific presets with cinematic_settings.video configuration (added 2025-10-09)';
