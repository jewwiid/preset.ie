# Seedream V4 Integration Analysis & Implementation Plan

## Current NanoBanana API Flow Analysis

### 1. **Current Architecture**
```
User → EnhancementModal → /api/enhance-image → NanoBanana API → Callback → Database Update
```

### 2. **Database Schema (Current)**
- **`enhancement_tasks`**: Stores task metadata, status, costs
- **`user_credits`**: Tracks user credit balance
- **`credit_transactions`**: Logs all credit usage
- **`credit_pools`**: Platform credit management per provider

### 3. **Current API Flow**
1. User clicks "Enhance" in `MoodboardBuilder`
2. `EnhancementModal` opens with enhancement options
3. User selects type (lighting, style, background, mood) and enters prompt
4. POST to `/api/enhance-image` with image URL, type, prompt
5. API validates user credits (1 credit per enhancement)
6. Creates task in `enhancement_tasks` table
7. Calls NanoBanana API with callback URL
8. NanoBanana processes and calls back to `/api/nanobanana/callback`
9. Callback updates task status and stores result URL
10. Frontend polls for completion

## Seedream V4 Integration Plan

### 1. **Updated Architecture**
```
User → EnhancedEnhancementModal → /api/enhance-image-v2 → Provider Factory → Seedream/NanoBanana → Callback → Database Update
```

### 2. **Database Updates Required**

#### New Migration: `034_multi_provider_support.sql`
- ✅ **Enhanced `enhancement_tasks` table**:
  - `provider` VARCHAR(50) - 'nanobanana' or 'seedream'
  - `provider_task_id` VARCHAR(100) - External provider task ID
  - `provider_metadata` JSONB - Provider-specific data
  - `cost_credits` INTEGER - Credits charged to user
  - `provider_cost` DECIMAL(8,4) - Actual provider cost
  - `quality_score` DECIMAL(3,2) - Quality rating 0-1
  - `processing_time_ms` INTEGER - Processing time

- ✅ **New `user_provider_preferences` table**:
  - User's preferred provider
  - Auto-fallback settings
  - Quality vs speed priority

- ✅ **New `provider_performance` table**:
  - Daily performance metrics per provider
  - Success rates, processing times, costs

- ✅ **Updated `credit_pools` table**:
  - Added 'seedream' provider entry
  - Different cost per credit ratios

### 3. **API Differences Analysis**

| Aspect | NanoBanana | Seedream V4 (WaveSpeed) |
|--------|------------|-------------------------|
| **Endpoint** | `https://api.nanobanana.ai/enhance` | `https://api.wavespeed.ai/api/v3/bytedance/seedream-v4-edit` |
| **Auth** | `Authorization: Bearer {key}` | `Authorization: Bearer {key}` |
| **Request Body** | `{ image_url, prompt, strength }` | `{ prompt, image_urls[], size, enable_sync_mode }` |
| **Response** | `{ id, enhanced_url, cost }` | `{ data: { id, status, outputs[] } }` |
| **Callback** | Custom webhook format | WaveSpeed webhook format with signature verification |
| **Processing Time** | 30-60 seconds | 2-5 seconds |
| **Cost** | 1 credit (0.025 USD) | 2 credits (0.05 USD) |
| **Quality** | Good | State-of-the-art |
| **Resolution** | 1024x1024 | Up to 4096x4096 |

### 4. **Implementation Components**

#### ✅ **Provider Factory Pattern**
```typescript
// packages/adapters/src/imagegen/ImageGenProviderFactory.ts
export class ImageGenProviderFactory {
  static createProvider(config: ProviderConfig): ImageGenService {
    switch (config.provider) {
      case 'nanobanana': return new NanoBananaAdapter(config.nanobanana);
      case 'seedream': return new SeedreamWaveSpeedAdapter(config.seedream);
    }
  }
}
```

#### ✅ **Unified Interface**
```typescript
interface ImageGenService {
  createTask(input: CreateImageTask): Promise<{ taskId: string }>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  verifyAndParseWebhook(headers: Record<string, string>, body: unknown): Promise<WebhookResult>;
}
```

#### ✅ **Enhanced UI Components**
- **`EnhancedEnhancementModal`**: Provider selection, cost display, quality indicators
- **`ImageProviderSelector`**: Side-by-side provider comparison
- **Provider-specific prompts**: Auto-suggest best provider for enhancement type

### 5. **Credit System Updates**

#### Current Credit Flow
- User pays 1 credit per enhancement
- Platform pays 4 NanoBanana credits (0.025 USD each)
- Ratio: 1 user credit = 4 provider credits

#### New Credit Flow
- **NanoBanana**: 1 user credit = 4 provider credits (0.025 USD each)
- **Seedream**: 2 user credits = 2 provider credits (0.05 USD each)
- **Ratio**: Seedream costs 2x but provides higher quality

### 6. **Webhook Handling**

#### Current NanoBanana Callback
```typescript
// /api/nanobanana/callback
const { taskId, status, resultUrl } = await parseNanoBananaWebhook(body);
```

#### New Unified Callback
```typescript
// /api/imagegen/callback
const provider = detectProvider(headers, body);
const imageGenService = ImageGenProviderFactory.createProvider({ provider });
const result = await imageGenService.verifyAndParseWebhook(headers, body);
```

### 7. **Environment Configuration**

#### Updated `.env.example`
```env
# Image Generation Provider Configuration
IMAGE_PROVIDER=nanobanana  # Options: nanobanana, seedream

# NanoBanana API Configuration
NANOBANANA_API_KEY=your_nanobanana_api_key
NANOBANANA_BASE_URL=https://api.nanobanana.ai
NANOBANANA_CALLBACK_URL=https://your-domain.com/api/imagegen/callback

# WaveSpeed API Configuration (for Seedream V4)
WAVESPEED_API_KEY=your_wavespeed_api_key
WAVESPEED_BASE_URL=https://api.wavespeed.ai
WAVESPEED_WEBHOOK_SECRET=your_webhook_secret
```

### 8. **Migration Strategy**

#### Phase 1: Parallel Implementation ✅
- [x] Add Seedream adapter alongside NanoBanana
- [x] Create provider factory for easy switching
- [x] Update credit scaling service
- [x] Add provider selection UI
- [x] Database migration for multi-provider support

#### Phase 2: A/B Testing 🔄
- [ ] Deploy both providers with feature flag
- [ ] Route 10% of traffic to Seedream V4
- [ ] Monitor performance and user feedback
- [ ] Compare quality metrics

#### Phase 3: Gradual Migration 🔄
- [ ] Increase Seedream V4 traffic to 50%
- [ ] Monitor cost and quality improvements
- [ ] Full migration to Seedream V4
- [ ] Keep NanoBanana as fallback

### 9. **Cost-Benefit Analysis**

#### Current (NanoBanana Only)
- **Cost per image**: 1 credit (0.025 USD)
- **Processing time**: 30-60 seconds
- **Quality**: Good
- **Resolution**: 1024x1024

#### With Seedream V4
- **Cost per image**: 2 credits (0.05 USD) - 2x cost
- **Processing time**: 2-5 seconds - 10x faster
- **Quality**: State-of-the-art - Significantly better
- **Resolution**: Up to 4096x4096 - 4x higher resolution

#### ROI Calculation
- **50% cost increase** for **10x speed improvement** + **significantly better quality**
- **User satisfaction** likely to increase due to speed and quality
- **Premium positioning** - users pay more for better results

### 10. **Risk Mitigation**

#### Technical Risks
- **API Changes**: WaveSpeed has better documentation and versioning
- **Rate Limits**: Both providers have similar limits
- **Downtime**: Provider factory allows instant fallback

#### Business Risks
- **Cost Fluctuation**: Credit scaling service handles pricing changes
- **Quality Issues**: A/B testing before full migration
- **User Experience**: Provider selection UI gives users choice

### 11. **Next Steps**

#### Immediate Actions
1. **Apply database migration**: `supabase/migrations/034_multi_provider_support.sql`
2. **Update environment variables** with WaveSpeed API keys
3. **Deploy enhanced API route**: `/api/enhance-image-v2`
4. **Update frontend** to use `EnhancedEnhancementModal`
5. **Test both providers** in development

#### Testing Checklist
- [ ] Test NanoBanana flow (existing)
- [ ] Test Seedream V4 flow (new)
- [ ] Test provider switching
- [ ] Test webhook callbacks for both providers
- [ ] Test credit deduction and refunds
- [ ] Test error handling and fallbacks
- [ ] Test UI provider selection

#### Monitoring Setup
- [ ] Add provider performance tracking
- [ ] Set up alerts for provider failures
- [ ] Monitor cost per enhancement by provider
- [ ] Track user satisfaction metrics

## Conclusion

The Seedream V4 integration is **straightforward** thanks to the existing Hexagonal Architecture. The provider factory pattern allows instant switching between providers, and the unified interface keeps all business logic unchanged.

**Key Benefits**:
- **10x faster processing** (2-5s vs 30-60s)
- **Significantly higher quality** (state-of-the-art model)
- **Higher resolution** (up to 4K vs 1K)
- **Better user experience** with provider choice
- **Future-proof architecture** for additional providers

**Recommendation**: Proceed with Phase 1 implementation and begin A/B testing to validate the benefits before full migration.
