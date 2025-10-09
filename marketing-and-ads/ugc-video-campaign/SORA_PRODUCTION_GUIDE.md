# Sora AI Video Production Guide - Preset UGC Campaign

> **Complete guide for generating UGC videos using Sora (OpenAI) or similar text-to-video AI tools**

---

## Table of Contents
1. [Quick Start Guide](#quick-start-guide)
2. [Sora-Specific Optimization](#sora-specific-optimization)
3. [Prompt Engineering Tips](#prompt-engineering-tips)
4. [Post-Production Workflow](#post-production-workflow)
5. [Quality Control Checklist](#quality-control-checklist)
6. [Alternative AI Video Tools](#alternative-ai-video-tools)

---

## Quick Start Guide

### Step 1: Choose Your Video Concept
Select from the 12 pre-written scenarios based on your campaign goals:

**For Awareness (Top of Funnel):**
- Video 1: AI Playground
- Video 2: Gig Discovery
- Video 9: Video Generation

**For Consideration (Middle of Funnel):**
- Video 3: Creating a Gig
- Video 5: Smart Moodboards
- Video 7: Professional Network
- Video 8: Profile Showcase

**For Conversion (Bottom of Funnel):**
- Video 6: Gig Invitations
- Video 12: Success Story

**For Feature Education:**
- Video 4: Collaboration Projects
- Video 10: Treatment Generator
- Video 11: Equipment Sharing

### Step 2: Prepare Your Sora Prompt

**Basic Sora Prompt Structure:**
```
[Shot type] of [character description], [age], [actions/emotions], [setting details], [lighting], [camera style]

Duration: [15-45 seconds]
Aspect Ratio: 9:16 (vertical)
Style: Authentic UGC, iPhone footage, natural lighting
```

**Example for Video 1:**
```
Medium shot of an enthusiastic female content creator, 25 years old, East Asian descent, wearing oversized vintage band tee, sitting cross-legged on bed with MacBook showing AI-generated images. Bedroom has fairy lights, camera equipment, plants. She's gesturing excitedly, looking between screen and camera. Natural afternoon golden hour window light. Camera: iPhone 14 Pro vertical video, slight handheld movement, warm natural color grade, authentic creator aesthetic.

Duration: 30 seconds
Aspect Ratio: 9:16
Style: UGC, natural lighting, film grain
```

### Step 3: Generate in Sora

1. **Access Sora:** (OpenAI ChatGPT Plus/Pro with Sora access)
2. **Paste your optimized prompt**
3. **Specify parameters:**
   - Duration: 20-45 seconds (Sora's current limit)
   - Resolution: 1080p minimum
   - Aspect Ratio: 9:16 (portrait/vertical)
4. **Generate multiple variations** (3-5 per prompt for options)
5. **Review and select best output**

---

## Sora-Specific Optimization

### Understanding Sora's Strengths
✅ **Excels at:**
- Natural human expressions and gestures
- Realistic lighting and environments
- Camera movements (handheld, subtle shake)
- Authentic product/screen interactions
- Realistic material textures (fabric, wood, metal)

⚠️ **Current Limitations:**
- Text on screens may not be perfectly readable (add in post)
- Complex hand movements can be inconsistent
- Very specific brand logos (add in post)
- Audio is generated separately (add voiceover in post)

### Prompt Optimization for Sora

**DO's:**
```
✅ "iPhone 14 Pro vertical video, slight handheld movement"
✅ "Natural afternoon golden hour window light streaming in"
✅ "She glances at her laptop screen then looks to camera with excited smile"
✅ "Bedroom with fairy lights, plants, camera gear on shelves"
✅ "Authentic UGC aesthetic with film grain and natural color grade"
```

**DON'Ts:**
```
❌ "Preset logo clearly visible on screen" (add in post)
❌ "She says 'I love Preset!'" (add audio in post)
❌ "Perfect studio lighting setup" (too artificial for UGC)
❌ "4K professional cinema camera" (not UGC aesthetic)
```

### Advanced Sora Parameters

**For Maximum UGC Authenticity:**
```
Additional Sora Settings:
- Motion: 3-5/10 (subtle, not hyperactive)
- Camera Movement: "Slight handheld shake, as if friend filming"
- Color Grade: "Natural, warm, iPhone footage aesthetic"
- Grain: "Subtle film grain for authentic feel"
- Focus: "Shallow depth of field on subject"
```

**Lighting Keywords for Natural Look:**
```
- "Natural window light with soft shadows"
- "Golden hour afternoon sunlight streaming through"
- "Warm desk lamp key light mixing with screen glow"
- "LED strip lights providing ambient colored accent"
- "Coffee shop ambient lighting with window fill"
```

---

## Prompt Engineering Tips

### Anatomy of a Perfect UGC Prompt for Sora

**1. Shot Specification (Required):**
```
Medium shot / Close-up / Waist-up shot
```

**2. Character Description (Detailed):**
```
[Age], [ethnicity if specific], [gender/presentation], [distinct features], [clothing style]

Example: "24 years old, East Asian descent, female, messy bun hairstyle, wearing oversized vintage Nirvana t-shirt and mom jeans"
```

**3. Action & Emotion (Dynamic):**
```
[Primary action] + [emotional state] + [eye line/interaction]

Example: "holding worn MacBook Pro with stickers, excitedly showing screen to camera with genuine enthusiasm, occasionally glancing at screen then back to camera"
```

**4. Environment (Layered Details):**
```
[Primary setting] + [background elements] + [props/details]

Example: "small rented bedroom with IKEA desk, fairy lights on walls, her photography prints taped up, Sony camera on shelf, potted plants on windowsill"
```

**5. Lighting (Specific):**
```
[Light source] + [quality] + [direction] + [color temperature]

Example: "Natural afternoon golden hour sunlight streaming through sheer white curtains on right, creating soft warm glow and natural shadows"
```

**6. Camera Style (Technical):**
```
[Device] + [movement] + [aesthetic] + [grade]

Example: "iPhone 14 Pro vertical video, slight handheld shake as if friend filming, natural warm color grading, authentic UGC creator aesthetic with subtle film grain"
```

### Pro Tips for Authenticity

**Make it Feel Real:**
1. **Add Imperfections:** "Slight handheld shake", "natural camera wobble"
2. **Include Life Details:** "Half-drunk iced coffee on desk", "cat walks through frame"
3. **Use Specific Props:** "Worn MacBook with camera brand stickers", "Spotify playing in background"
4. **Authentic Reactions:** "Jaw drops in amazement", "covers mouth in disbelief", "eyes widen with excitement"

**Avoid These Common Mistakes:**
```
❌ "Professional cinematography" → Too polished
❌ "Perfect lighting setup" → Not believable for bedroom
❌ "Flawless makeup and styling" → Not authentic UGC
❌ "Green screen background" → Immediately fake-looking
❌ "Scripted corporate delivery" → Not creator voice
```

---

## Post-Production Workflow

### Phase 1: Screen Content Compositing

**Tools Needed:**
- After Effects or DaVinci Resolve (screen replacement)
- Figma/Photoshop (creating screen content)

**Steps:**
1. **Track the Screen:**
   - Use mocha AE or After Effects tracker
   - Track laptop/phone screen throughout video

2. **Create Screen Content:**
   - Screenshot actual Preset platform interface
   - Design layouts in Figma matching Preset's UI
   - Export as PNG sequence or video

3. **Composite Screen:**
   - Corner-pin tracking to screen
   - Add screen glare/reflection for realism
   - Color-match to scene lighting

**Screen Content Specs:**
- **Laptop screens:** 1920x1200px (16:10 typical laptop ratio)
- **Phone screens:** 1170x2532px (iPhone aspect ratio)
- **Update rate:** 30fps minimum for smooth scroll

### Phase 2: Voiceover & Audio

**Recording the Voiceover:**
1. **Hire UGC-style voice actors** (Fiverr, Voices.com)
2. **Direction:** Natural, conversational, NOT announcer voice
3. **Filler words:** Keep "like", "literally", "actually" for authenticity
4. **Pacing:** Quick, energetic, Gen-Z/Millennial speed

**Audio Mixing:**
```
Voice Layer:
- EQ: Boost 2-5kHz for clarity, cut below 80Hz
- Compression: 3:1 ratio, -10dB threshold
- De-esser: -4dB around 6-8kHz
- Normalize to -3dB peak

Ambience Layer:
- Room tone: -35dB to -40dB
- Environmental (coffee shop, street): -30dB to -35dB
- Subtle music bed (optional): -25dB to -30dB
```

**Suggested Background Ambience by Scene:**
- Bedroom: Soft room tone, distant traffic, bird chirps
- Coffee shop: Chatter murmur, espresso machine, dishes
- Home office: Keyboard typing, mouse clicks, subtle hum
- Night scene: Quiet room tone, distant city sounds

### Phase 3: Graphics & Branding

**Essential Graphics:**

1. **Preset Logo Watermark:**
   - Position: Bottom right corner
   - Size: 80x80px at 1080p
   - Opacity: 60-70%
   - Animation: Subtle fade in at 2 seconds

2. **Captions/Subtitles:**
   - Font: Montserrat Bold or similar sans-serif
   - Size: 60-80pt at 1080p
   - Position: Lower third
   - Style: White text, black stroke (8px), subtle drop shadow
   - Animation: Word-by-word or phrase pop-in

3. **Call-to-Action (CTA):**
   - Appears: Last 5 seconds of video
   - Text: "Join Preset Today ✨" or "Start Creating on Preset"
   - Button: "Sign Up Free" → preset.ie
   - Animation: Slide up from bottom

**Preset Brand Colors:**
```css
Primary: #your-primary-color
Secondary: #your-secondary-color
Text: #000000 or #FFFFFF (depending on background)
```

### Phase 4: Final Color Grade

**UGC Color Grade Recipe:**
```
1. Slight contrast lift: +10-15%
2. Warm color temperature: +5 towards orange
3. Subtle saturation boost: +5-10% (not Instagram filters!)
4. Film grain overlay: 2-5% opacity
5. Slight vignette: 10-15% opacity for focus
```

**Platform-Specific Exports:**

**Instagram/Facebook Reels:**
- Resolution: 1080x1920 (9:16)
- Codec: H.264, High Profile
- Bitrate: 8-10 Mbps
- Frame Rate: 30fps
- Audio: AAC, 192kbps, Stereo

**TikTok:**
- Resolution: 1080x1920 (9:16)
- Codec: H.264
- Bitrate: 10-12 Mbps (TikTok compresses heavily)
- Frame Rate: 30fps
- Audio: AAC, 192kbps

**YouTube Shorts:**
- Resolution: 1080x1920 (9:16)
- Codec: H.264, High Profile
- Bitrate: 12-15 Mbps (YouTube allows higher quality)
- Frame Rate: 30fps or 60fps
- Audio: AAC, 256kbps

---

## Quality Control Checklist

### Before Publishing - Final Review:

**Visual Quality:**
- [ ] Video is 1080x1920 (9:16 aspect ratio)
- [ ] Subject is in focus and well-lit
- [ ] Screen content is clearly visible and tracked smoothly
- [ ] No AI artifacts (weird hands, morphing objects)
- [ ] Preset logo watermark is visible but subtle
- [ ] Color grade looks natural and warm (not oversaturated)
- [ ] Slight film grain adds authentic texture

**Audio Quality:**
- [ ] Voiceover is clear and natural-sounding
- [ ] Background ambience is present but subtle
- [ ] No audio clipping or distortion
- [ ] Volume is normalized (-3dB peak, -16 LUFS average)
- [ ] Captions match voiceover exactly

**Branding & Messaging:**
- [ ] Preset platform is mentioned/shown clearly
- [ ] Feature being demonstrated is accurate to platform
- [ ] CTA appears in last 5 seconds
- [ ] Link/handle in caption matches landing page
- [ ] Hashtags are included and relevant

**Authenticity Check:**
- [ ] Feels like real UGC, not an ad
- [ ] Creator personality comes through
- [ ] Setting looks realistic and relatable
- [ ] Speech patterns feel natural (filler words, enthusiasm)
- [ ] Emotions/reactions feel genuine, not acted

**Platform Compliance:**
- [ ] Duration is under platform limits (Instagram: 90s, TikTok: 60s, YouTube Shorts: 60s)
- [ ] No copyright music (use licensed or royalty-free)
- [ ] Follows platform community guidelines
- [ ] Accessible (captions for hearing impaired)

---

## Alternative AI Video Tools

If Sora is unavailable or you want to test alternatives:

### 1. **Runway Gen-3 Alpha** (runwayml.com)
**Best for:** Quick iterations, realistic human motion
- Prompt structure: Similar to Sora
- Max duration: 10 seconds (extend by chaining clips)
- Pros: Fast generation, good with people
- Cons: Shorter clips, requires stitching

**Optimization tips:**
```
- Use "first-person POV" for authentic feel
- Specify "handheld iPhone footage" explicitly
- Generate 5-second chunks, stitch in post
```

### 2. **Pika Labs** (pika.art)
**Best for:** Camera movements, environmental shots
- Prompt structure: Simplified, focus on scene
- Max duration: 3 seconds (extend available)
- Pros: Beautiful lighting, good environments
- Cons: Very short clips, less human realism

**Optimization tips:**
```
- Great for B-roll: desk setups, workspace pans
- Use motion parameters: "camera zoom in slowly"
- Layer multiple 3-second clips for variety
```

### 3. **Leonardo Motion** (leonardo.ai)
**Best for:** Still image animation
- Input: Upload still image, define motion
- Max duration: 4 seconds
- Pros: Controlled, consistent character
- Cons: Limited motion, short duration

**Workflow:**
```
1. Generate character still with Midjourney/DALL-E
2. Import to Leonardo Motion
3. Animate: "Subtle head turn, excited expression"
4. Extend with multiple passes
```

### 4. **HeyGen** (heygen.com)
**Best for:** Talking head videos (avatar-based)
- Input: Script + avatar selection
- Duration: Unlimited (script-based)
- Pros: Perfect lip-sync, multiple avatars
- Cons: Less natural than Sora, more "virtual"

**Use case for Preset:**
```
- Educational videos about features
- Founder message videos
- Platform update announcements
```

### 5. **Synthesia** (synthesia.io)
**Best for:** Professional explainer videos
- Similar to HeyGen but more corporate
- Good for LinkedIn content
- Less suitable for UGC aesthetic

---

## Hybrid Approach: AI + Real Footage

### When to Mix AI and Real Filming:

**AI-Generated (Sora):**
- Wide shots of environments
- B-roll of workspaces/setups
- Reaction shots (if perfect take)
- Establishing scenes

**Real Filming:**
- Close-ups of hands using platform
- Screen interactions (always easier to film real)
- Audio/voiceover (always record real)
- Specific product shots

**Benefits of Hybrid:**
1. **Cost-effective:** AI for expensive scenes (multiple locations)
2. **Time-saving:** Generate variations quickly
3. **Authenticity:** Real voice + AI visual = best of both
4. **Flexibility:** Iterate visuals without reshoots

### Hybrid Workflow:
```
1. Film voiceover with real creator (iPhone selfie-style)
2. Generate AI environment/setting variations with Sora
3. Composite real creator face onto AI body (if needed)
4. Add real screen recordings over AI screens
5. Final mix with real audio
```

---

## Budget Planning

### Cost Breakdown (per video):

**Full AI Generation (Sora):**
- Sora credits: $0.20-0.60 per generation (3-5 takes)
- Post-production: 2-4 hours @ $50/hr = $100-200
- Voice actor: $50-150 per video
- **Total: $150-350 per video**

**Hybrid Approach:**
- Sora credits: $0.20-0.40 (fewer takes needed)
- Real filming: 1-2 hours @ $100/hr = $100-200
- Post-production: 3-5 hours @ $50/hr = $150-250
- Voice actor: $50-150
- **Total: $300-600 per video**

**Full Real Production:**
- Creator fee: $200-500
- Filming: 3-4 hours @ $150/hr = $450-600
- Post-production: 4-6 hours @ $50/hr = $200-300
- **Total: $850-1,400 per video**

**Campaign Cost (12 videos):**
- Full AI: $1,800 - $4,200
- Hybrid: $3,600 - $7,200
- Full Real: $10,200 - $16,800

**Recommended:** Start with 3-4 AI videos, test performance, then decide on scaling with real production for best performers.

---

## Success Metrics & Testing

### A/B Testing Framework:

**Test Variables:**
1. **Persona Type:** Young creator vs. Established professional
2. **Feature Focus:** AI tools vs. Networking vs. Gig discovery
3. **Visual Style:** Bright/energetic vs. Moody/cinematic
4. **Duration:** 15s vs. 30s vs. 45s
5. **CTA Placement:** End-screen vs. Mid-roll vs. Persistent

**Metrics to Track:**
```
Awareness Metrics:
- Views
- Watch time / retention rate
- Shares & saves
- Reach & impressions

Engagement Metrics:
- Likes & comments
- Profile visits from video
- Click-through rate (CTR) on CTA
- Caption link clicks

Conversion Metrics:
- Sign-ups attributed to video
- Landing page visits
- Account activations
- First gig posted/applied (within 7 days)
```

### Performance Targets:

**Instagram Reels:**
- Views: 10K+ in first 48 hours
- Retention: >40% to end
- CTR: 2-5% to profile/link
- Conversion: 1-3% sign-up rate

**TikTok:**
- Views: 50K+ in first 72 hours (FYP boost)
- Retention: >50% to end
- CTR: 3-7% to bio link
- Conversion: 2-4% sign-up rate

**YouTube Shorts:**
- Views: 20K+ in first week
- Retention: >45% average
- CTR: 5-10% to channel/link
- Conversion: 3-6% sign-up rate (higher intent)

---

## Troubleshooting Common Issues

### Sora Generation Problems:

**Issue: "AI-generated faces look uncanny"**
- ✅ Add: "Natural imperfections, authentic human features"
- ✅ Avoid: Too many detailed facial specifications
- ✅ Try: Reference "iPhone selfie footage" for realistic face rendering

**Issue: "Hands are deformed/weird"**
- ✅ Keep hands doing simple actions: "holding phone", "gesturing naturally"
- ✅ Avoid: Complex hand movements, typing, detailed finger work
- ✅ Solution: Film real hands in post, composite over AI

**Issue: "Lighting looks artificial"**
- ✅ Always specify light source: "window light", "desk lamp", "ring light"
- ✅ Add time of day: "afternoon golden hour", "evening desk lamp"
- ✅ Include shadows: "soft shadows from window light"

**Issue: "Movement is too smooth/unnatural"**
- ✅ Add: "Slight handheld shake", "natural camera wobble"
- ✅ Specify: "As if friend filming on iPhone"
- ✅ Motion level: Keep at 3-5/10 in Sora settings

**Issue: "Environment looks fake/CGI"**
- ✅ Use specific real details: "IKEA desk", "exposed brick wall"
- ✅ Add lived-in elements: "messy desk", "clothes on chair"
- ✅ Reference real spaces: "Small Brooklyn apartment bedroom"

### Post-Production Issues:

**Issue: "Screen tracking keeps sliding off"**
- ✅ Use mocha AE for planar tracking (better than AE tracker)
- ✅ Add motion blur to screen content matching camera
- ✅ Track matte: Add slight feather for natural edge blend

**Issue: "Voiceover doesn't match video emotion"**
- ✅ Record voice while watching video for natural sync
- ✅ Add subtle EQ changes during emotion shifts
- ✅ Overlay breath sounds for realism

**Issue: "Video looks too polished/not UGC"**
- ✅ Add film grain overlay (2-5%)
- ✅ Slight color shift (warm +5)
- ✅ Subtle vignette (10-15% opacity)
- ✅ Allow small focus breathing, slight motion blur

---

## Final Pro Tips

### Maximize AI Video Quality:

1. **Generate in Higher Resolution:**
   - Request 4K, downscale to 1080p for cleaner result

2. **Use Reference Images:**
   - Upload example UGC videos to guide Sora's style

3. **Iterate Prompts:**
   - Start simple, add details gradually
   - Test 3-5 variations of each prompt

4. **Leverage Sora's Memory:**
   - Reference previous successful generations
   - Build character consistency across videos

5. **Embrace Imperfections:**
   - Don't over-polish in post
   - Some AI quirks add to UGC authenticity
   - Real creators have imperfect setups too

### Time-Saving Hacks:

- **Batch generate:** Create all 12 videos in one Sora session
- **Template audio:** Create 3 voiceover styles, reuse across videos
- **Preset AE projects:** Build screen compositing template once
- **Color LUTs:** Save successful grade as LUT for one-click application
- **Caption templates:** Create auto-caption style in Premiere/Resolve

---

## Support & Resources

### Useful Communities:
- r/AiVideoGeneration (Reddit)
- Sora Discord (OpenAI community)
- RunwayML Community Forum
- AI Film School (YouTube channel)

### Learning Resources:
- "Sora Prompt Engineering" (OpenAI docs)
- "UGC Video Best Practices" (Meta Blueprint)
- "TikTok Creator Guide" (TikTok for Business)

### Tools & Plugins:
- **Caption AI:** Auto-caption generation (Rev.com)
- **Motion Array:** Royalty-free music/SFX
- **Artgrid:** Stock UGC-style footage for reference
- **Frame.io:** Video review and collaboration

---

**Remember:** The goal is authentic, relatable UGC content that doesn't feel like traditional advertising. Sora and AI tools are means to create this content at scale - but authenticity must always be the priority!

Good luck with your Preset UGC video campaign! 🎬✨
