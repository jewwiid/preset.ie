# Video Styles to Add to Supabase

Add these styles to the `style_prompts` table in Supabase to enable video generation styles.

## Table: `style_prompts`

### Required Columns
- `style_name` (text, unique)
- `display_name` (text)
- `text_to_image_prompt` (text)
- `image_to_image_prompt` (text)
- `description` (text)
- `category` (text)
- `is_active` (boolean)
- `sort_order` (integer)

### Video Styles to Add

#### 1. Smooth Motion
```sql
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'smooth',
  'Smooth Motion',
  'Create smooth, fluid motion with gentle camera movements and natural transitions',
  'Apply smooth, fluid motion with gentle camera movements and natural transitions to',
  'Smooth, flowing motion with gentle transitions',
  'motion',
  true,
  100
);
```

#### 2. Fast-Paced
```sql
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'fast-paced',
  'Fast-Paced',
  'Create fast-paced, energetic motion with quick cuts and dynamic camera work',
  'Apply fast-paced, energetic motion with quick cuts and dynamic camera work to',
  'High-energy, fast motion with dynamic movement',
  'motion',
  true,
  101
);
```

#### 3. Slow Motion
```sql
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'slow-motion',
  'Slow Motion',
  'Create dramatic slow-motion effect with smooth, deliberate movements and enhanced details',
  'Apply dramatic slow-motion effect with smooth, deliberate movements and enhanced details to',
  'Dramatic slow-motion video effect',
  'motion',
  true,
  102
);
```

#### 4. Time-Lapse
```sql
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'time-lapse',
  'Time-Lapse',
  'Create time-lapse effect showing accelerated passage of time with smooth transitions',
  'Apply time-lapse effect showing accelerated passage of time with smooth transitions to',
  'Accelerated time-lapse video',
  'motion',
  true,
  103
);
```

#### 5. Glitch Effect
```sql
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'glitch',
  'Glitch Effect',
  'Create digital glitch aesthetic with distorted visuals, chromatic aberration, and digital artifacts',
  'Apply digital glitch aesthetic with distorted visuals, chromatic aberration, and digital artifacts to',
  'Digital glitch and distortion effects',
  'artistic',
  true,
  104
);
```

## Instructions

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste each INSERT statement above
3. Run them one by one
4. Verify styles appear in the `style_prompts` table

## Note

The styles `cinematic`, `dreamy`, `dramatic`, `anime`, and `vintage` should already exist in the database if they're used for image generation. Only add the video-specific motion styles listed above.
