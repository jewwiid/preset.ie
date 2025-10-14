# WaveSpeed Model Expansion Plan

**Date:** October 14, 2025
**Status:** READY TO IMPLEMENT
**Priority:** HIGH - Platform Differentiation

---

## Overview

Expand Preset's AI capabilities by integrating all profitable WaveSpeed models for image and video generation. This will position Preset as a comprehensive creative platform with tier-based access to premium models.

---

## Current State ✅

**Integrated Models:**
- ✅ **Seedream V4** (Image) - 2 credits ($0.027 API cost, 48% margin)
- ✅ **NanoBanana** (Image) - 2 credits ($0.038 API cost, 5% margin)
- ✅ **Seedance Pro 720p** (Video) - 12 credits ($0.15 API cost, 60% margin)
- ✅ **WAN 2.5** (Video) - 20 credits ($0.40 API cost, 60% margin)

**Credit System:**
- ✅ Profitable pricing on all models
- ✅ Rollover system working
- ✅ Smart consumption tracking

---

## Models to Add (Priority Order)

### Phase 1: High-Value Video Models (Week 1-2)

#### 1. **Kling Standard Models** - Good Value Tier
| Model | Type | API Cost | Credits | Revenue | Margin | Tier Access |
|-------|------|----------|---------|---------|--------|-------------|
| kling-v2.1-i2v-standard | Image-to-Video | $0.25 | 20 | $0.40 | 60% | PLUS+ |
| kling-effects | Effects | $0.25 | 20 | $0.40 | 60% | PLUS+ |

**Rationale:**
- Same cost as WAN 2.5 (already integrated)
- Provides model variety for PLUS tier
- Good margins, low risk

#### 2. **Kling Pro Models** - Premium Quality
| Model | Type | API Cost | Credits | Revenue | Margin | Tier Access |
|-------|------|----------|---------|---------|--------|-------------|
| kling-v2.1-i2v-pro | Image-to-Video | $0.45 | 30 | $0.60 | 33% | PRO+ |

**Rationale:**
- Higher quality than standard tier
- Differentiation for PRO tier
- Still profitable

#### 3. **Seedance Ultra Models** - Resolution Options
| Model | Type | API Cost | Credits | Revenue | Margin | Tier Access |
|-------|------|----------|---------|---------|--------|-------------|
| seedance-v1-pro-i2v-1080p | Image-to-Video 1080p | $0.60 | 40 | $0.80 | 33% | PRO+ |
| seedance-v1-lite-i2v-1080p | Image-to-Video 1080p | $0.15 | 12 | $0.24 | 60% | PLUS+ |

**Rationale:**
- Resolution upgrade path
- Lite version provides affordable 1080p
- Pro version for premium users

---

### Phase 2: Budget & Specialized Models (Week 3-4)

#### 4. **Budget Video Models** - FREE Tier Expansion
| Model | Type | API Cost | Credits | Revenue | Margin | Tier Access |
|-------|------|----------|---------|---------|--------|-------------|
| seedance-v-x1 | Video | $0.027 | 2 | $0.04 | 48% | FREE+ |
| seedance-v1-i2v-dc-480p | Image-to-Video | $0.03 | 2 | $0.04 | 33% | FREE+ |
| seedance-v1-lite-reference | Reference | $0.027 | 2 | $0.04 | 48% | FREE+ |

**Rationale:**
- Expand FREE tier capabilities
- High margins even at low prices
- Reduces barrier to entry

#### 5. **WAN 2.2 Models** - Additional Options
| Model | Type | API Cost | Credits | Revenue | Margin | Tier Access |
|-------|------|----------|---------|---------|--------|-------------|
| wan-2.2/i2v-480p | Image-to-Video | $0.15 | 12 | $0.24 | 60% | PLUS+ |
| wan-2.2/animate | Animation | $0.20 | 16 | $0.32 | 60% | PLUS+ |
| wan-2.2/video-edit | Video Edit | $0.20 | 16 | $0.32 | 60% | PLUS+ |

**Rationale:**
- Specialized capabilities (animation, editing)
- Same margin profile as existing WAN
- Differentiation features

---

### Phase 3: Premium & Image Expansion (Week 5-6)

#### 6. **Premium Image Models**
| Model | Type | API Cost | Credits | Revenue | Margin | Tier Access |
|-------|------|----------|---------|---------|--------|-------------|
| imagen3-fast | Image Gen | $0.018 | 1 | $0.02 | 11% | FREE+ |
| imagen3-text | Image Gen | $0.038 | 2 | $0.04 | 5% | PLUS+ |
| imagen4-ultra | Image Gen | $0.058 | 3 | $0.06 | 3% | PRO+ |

**Rationale:**
- Google quality/brand recognition
- Competitive with existing models
- Marginal but acceptable profits

#### 7. **Dreamina Models** - ByteDance Ecosystem
| Model | Type | API Cost | Credits | Revenue | Margin | Tier Access |
|-------|------|----------|---------|---------|--------|-------------|
| dreamina-v3.0/text-to-image | Text-to-Image | $0.027 | 2 | $0.04 | 48% | FREE+ |
| dreamina-v3.0/edit | Edit | $0.027 | 2 | $0.04 | 48% | FREE+ |
| dreamina-v3.0/image-to-video-720p | Image-to-Video | $0.30 | 24 | $0.48 | 60% | PRO+ |

**Rationale:**
- Expands ByteDance integration
- Good margins
- Edit capabilities add value

---

### Phase 4: Ultra-Premium (CREATOR Tier Only) (Week 7-8)

#### 8. **Sora 2 Models** - OpenAI Premium
| Model | Type | API Cost | Credits | Revenue | Margin | Tier Access |
|-------|------|----------|---------|---------|--------|-------------|
| sora-2/image-to-video | Image-to-Video | $0.40 | 30 | $0.60 | 50% | CREATOR |
| sora-2/text-to-video | Text-to-Video | $0.40 | 30 | $0.60 | 50% | CREATOR |

**Rationale:**
- Brand recognition (OpenAI)
- Justifies CREATOR tier pricing
- 50% margin acceptable for premium

**⚠️ SKIP FOR NOW:**
| Model | API Cost | Why Skip |
|-------|----------|----------|
| sora-2-pro | $1.20 | Too expensive, 90 credits required |
| kling-v2.1-i2v-master | $1.30 | Too expensive, 90 credits required |
| veo-fast | $2.20 | Extremely expensive, poor margins |
| veo2 | $1.20 | Too expensive for current tiers |

---

## Implementation Phases

### Phase 1: Backend Infrastructure (Week 1)

**1.1 Database Schema**
```sql
-- Add model_provider and model_id to track which model was used
ALTER TABLE playground_projects
ADD COLUMN model_provider TEXT,
ADD COLUMN model_id TEXT;

ALTER TABLE playground_video_generations
ADD COLUMN model_provider TEXT,
ADD COLUMN model_id TEXT;

-- Create model pricing table
CREATE TABLE ai_model_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL, -- 'kling', 'seedance', 'wan', etc.
  model_id TEXT NOT NULL, -- 'kling-v2.1-i2v-standard', etc.
  model_type TEXT NOT NULL, -- 'image', 'video', 'edit', etc.
  api_cost_usd DECIMAL(10,4) NOT NULL,
  credits_required INTEGER NOT NULL,
  revenue_usd DECIMAL(10,4) NOT NULL,
  margin_percent DECIMAL(5,2) NOT NULL,
  min_tier TEXT NOT NULL, -- 'FREE', 'PLUS', 'PRO', 'CREATOR'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, model_id)
);

-- Create index for tier filtering
CREATE INDEX idx_ai_model_pricing_tier ON ai_model_pricing(min_tier, is_active);
```

**1.2 Seed Model Data**
```sql
-- Insert all model pricing
INSERT INTO ai_model_pricing (provider, model_id, model_type, api_cost_usd, credits_required, revenue_usd, margin_percent, min_tier) VALUES
-- Existing models
('seedream', 'seedream-v4', 'image', 0.027, 2, 0.04, 48.15, 'FREE'),
('nanobanana', 'nano-banana', 'image', 0.038, 2, 0.04, 5.26, 'FREE'),
('seedance', 'seedance-v1-pro-i2v-720p', 'video', 0.15, 12, 0.24, 60.00, 'PLUS'),
('wan', 'wan-2.5/image-to-video', 'video', 0.25, 20, 0.40, 60.00, 'PLUS'),

-- Phase 1: Kling models
('kling', 'kling-v2.1-i2v-standard', 'video', 0.25, 20, 0.40, 60.00, 'PLUS'),
('kling', 'kling-effects', 'video_effects', 0.25, 20, 0.40, 60.00, 'PLUS'),
('kling', 'kling-v2.1-i2v-pro', 'video', 0.45, 30, 0.60, 33.33, 'PRO'),

-- Phase 1: Seedance ultra
('seedance', 'seedance-v1-pro-i2v-1080p', 'video', 0.60, 40, 0.80, 33.33, 'PRO'),
('seedance', 'seedance-v1-lite-i2v-1080p', 'video', 0.15, 12, 0.24, 60.00, 'PLUS');

-- Continue for all models...
```

**1.3 API Endpoint Updates**
```typescript
// apps/web/app/api/playground/generate/route.ts
// Add model selection parameter
const { selectedModel, selectedProvider } = requestBody;

// Fetch model pricing from database
const { data: modelPricing } = await supabase
  .from('ai_model_pricing')
  .select('*')
  .eq('provider', selectedProvider)
  .eq('model_id', selectedModel)
  .single();

// Check tier access
if (!hasAccessToModel(userTier, modelPricing.min_tier)) {
  return NextResponse.json({
    error: `This model requires ${modelPricing.min_tier} tier or higher`,
    upgrade_required: true
  }, { status: 403 });
}

// Use model pricing
const creditsRequired = modelPricing.credits_required;
```

---

### Phase 2: Frontend UI (Week 2)

**2.1 Model Selector Component**
```tsx
// components/ModelSelector.tsx
interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  creditsRequired: number;
  minTier: string;
  quality: 'budget' | 'standard' | 'premium' | 'ultra';
  resolutions?: string[];
}

export function ModelSelector({
  userTier,
  modelType, // 'image' | 'video'
  onSelect
}: ModelSelectorProps) {
  // Group models by tier/quality
  // Show locked models with "Upgrade" badge
  // Highlight recommended model
}
```

**2.2 Tier Gating UI**
```tsx
// Show locked models with upgrade prompts
{!hasAccess && (
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
    <div className="text-center space-y-2">
      <Lock className="w-8 h-8 mx-auto" />
      <p className="font-medium">Requires {model.minTier} Tier</p>
      <Button onClick={() => router.push('/subscription')}>
        Upgrade Now
      </Button>
    </div>
  </div>
)}
```

**2.3 Model Cards**
```tsx
<ModelCard
  name="Kling Pro v2.1"
  provider="Kling"
  quality="Premium"
  credits={30}
  features={[
    "1080p resolution",
    "Advanced motion",
    "10s duration"
  ]}
  badge={userTier === 'PRO' ? 'Available' : 'Upgrade to PRO'}
  locked={userTier !== 'PRO'}
/>
```

---

### Phase 3: Model Integration (Weeks 3-6)

**3.1 WaveSpeed API Integration**

For each model group:

1. **Create Model Config**
```typescript
// lib/models/kling.ts
export const KLING_MODELS = {
  'kling-v2.1-i2v-standard': {
    endpoint: 'https://api.wavespeed.ai/api/v3/kuaishou/kling-v2.1/image-to-video',
    params: {
      image: 'string',
      prompt: 'string',
      duration: 'number',
      resolution: 'string'
    }
  },
  // ... other models
};
```

2. **Add API Route Handler**
```typescript
// app/api/playground/video/kling/route.ts
export async function POST(request: NextRequest) {
  const { model, image, prompt, duration } = await request.json();

  const modelConfig = KLING_MODELS[model];
  const response = await fetch(modelConfig.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image,
      prompt,
      duration,
      ...modelConfig.defaultParams
    })
  });

  // Handle response...
}
```

3. **Test & Validate**
- Test with real API
- Verify pricing accuracy
- Check error handling
- Validate tier gating

---

### Phase 4: Documentation & Testing (Week 7-8)

**4.1 User Documentation**
- Model comparison guide
- "Which model should I use?" flowchart
- Pricing transparency page
- Tier benefits breakdown

**4.2 Testing Checklist**
- [ ] All models callable via API
- [ ] Tier gating works correctly
- [ ] Credits deducted accurately
- [ ] Model selection persists
- [ ] Error handling graceful
- [ ] Mobile UI responsive
- [ ] Loading states smooth

---

## Tier Access Matrix

| Tier | Image Models | Video Models | Max Credits/Month |
|------|--------------|--------------|-------------------|
| **FREE** | Seedream V4, Dreamina (basic), Imagen3-fast | Seedance (budget variants) | 15 |
| **PLUS** | + NanoBanana, Imagen3-text | + WAN 2.5, Kling Standard, Seedance Lite 1080p | 150 |
| **PRO** | + Imagen4-ultra | + Kling Pro, Seedance Pro 1080p, Dreamina 720p | 500 |
| **CREATOR** | All models | + Sora 2 Standard | 1500 |

---

## Revenue Impact Analysis

### Current State (4 Models)
- Average credits per user: ~30/month
- Revenue per active user: $0.60/month
- Margin: 55% average

### After Full Integration (25+ Models)
- Projected credits per user: ~60/month (2x usage)
- Revenue per active user: $1.20/month
- Margin: 50% average (maintained)
- **Revenue increase: +100%**

### Premium Tier Adoption
- PRO tier conversion: +15% (access to premium models)
- CREATOR tier conversion: +5% (Sora 2 access)
- Average tier revenue: +$5/user/month

---

## Risk Mitigation

**1. API Cost Overruns**
- Monitor usage per model daily
- Set hard caps on expensive models
- Alert system for unusual usage patterns

**2. Model Availability**
- Fallback models for each tier
- Graceful degradation if model unavailable
- User notifications for outages

**3. Margin Compression**
- Review pricing monthly
- Adjust credits if API costs change
- Maintain 30% minimum margin

---

## Success Metrics

**Phase 1 (Weeks 1-2):**
- [ ] 3 new models integrated
- [ ] Tier gating tested
- [ ] No margin below 30%

**Phase 2 (Weeks 3-4):**
- [ ] 8 total models available
- [ ] User testing positive
- [ ] PRO tier conversions +10%

**Phase 3 (Weeks 5-6):**
- [ ] 15+ models integrated
- [ ] Feature parity with competitors
- [ ] Revenue +50%

**Phase 4 (Weeks 7-8):**
- [ ] All profitable models live
- [ ] Documentation complete
- [ ] Support queries <5/week

---

## Next Steps

1. **Week 1:** Create `ai_model_pricing` table and seed initial data
2. **Week 1:** Build `ModelSelector` component with tier gating
3. **Week 2:** Integrate Kling Standard models (first expansion)
4. **Week 2:** Test tier access and pricing accuracy
5. **Week 3:** Begin Phase 2 budget model integration

---

## Appendix: Complete Model List

See [WAVESPEED_MODEL_PRICING.md](./WAVESPEED_MODEL_PRICING.md) for complete pricing reference.

**Total Models Planned:** 25+
**Total Investment:** ~40 hours development
**Expected ROI:** 2x revenue increase, 3x platform value
