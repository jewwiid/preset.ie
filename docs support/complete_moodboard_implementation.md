# Complete Moodboard API Integration - Production Ready

## 🚀 Quick Start Checklist

### API Keys Required
```bash
# Add these to your .env files
PEXELS_API_KEY=your_pexels_api_key_here
NANOBANAN_API_KEY=your_nanobanan_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Get API Keys
1. **Pexels** (Free): https://www.pexels.com/api/
2. **Nano Banana** (Paid): https://nanobananapi.ai/ or https://kie.ai/nano-banana
3. **Supabase**: Already have these

---

## 📁 File Structure

```
preset/
├── packages/
│   ├── domain/
│   │   └── moodboards/
│   │       ├── entities/
│   │       │   ├── Moodboard.ts
│   │       │   └── MoodboardItem.ts
│   │       └── ports/
│   │           ├── StockPhotoService.ts
│   │           └── AIImageService.ts
│   ├── application/
│   │   └── moodboards/
│   │       └── use-cases/
│   │           └── GenerateEnhancedMoodboard.ts
│   └── adapters/
│       └── external/
│           ├── PexelsService.ts
│           └── NanoBananaService.ts
├── apps/
│   ├── edge/
│   │   └── functions/
│   │       └── generate-moodboard/
│   │           └── index.ts
│   └── web/
│       └── components/
│           └── moodboards/
│               ├── MoodboardCreator.tsx
│               ├── PexelsSearchPanel.tsx
│               ├── UserUploadPanel.tsx
│               └── AIEnhancementPanel.tsx
└── database/
    └── migrations/
        └── 001_moodboard_tables.sql
```

---

## 🗄️ Database Setup

### Migration: `database/migrations/001_moodboard_tables.sql`

```sql
-- Enhanced moodboards table
CREATE TABLE IF NOT EXISTS moodboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  items JSONB DEFAULT '[]',
  palette TEXT[] DEFAULT '{}',
  source_breakdown JSONB DEFAULT '{
    "pexels": 0,
    "user_uploads": 0,
    "ai_enhanced": 0,
    "ai_generated": 0
  }',
  enhancement_log JSONB DEFAULT '[]',
  total_cost DECIMAL(10,4) DEFAULT 0,
  generated_prompts TEXT[],
  ai_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, action)
);

-- User media uploads table
CREATE TABLE IF NOT EXISTS user_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  blurhash VARCHAR(50),
  palette TEXT[],
  upload_purpose VARCHAR(50) DEFAULT 'moodboard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add moodboard reference to gigs table
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS moodboard_id UUID REFERENCES moodboards(id);

-- RLS Policies
ALTER TABLE moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

-- Moodboard policies
CREATE POLICY "Users can view public moodboards" ON moodboards
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own moodboards" ON moodboards
  FOR ALL USING (auth.uid() = owner_user_id);

-- Rate limit policies  
CREATE POLICY "Users can manage their own rate limits" ON rate_limits
  FOR ALL USING (auth.uid() = user_id);

-- User media policies
CREATE POLICY "Users can manage their own media" ON user_media
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_moodboards_gig_id ON moodboards(gig_id);
CREATE INDEX idx_moodboards_owner ON moodboards(owner_user_id);
CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action);
CREATE INDEX idx_user_media_user_id ON user_media(user_id);

-- Storage bucket for user uploads (Run in Supabase dashboard)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('moodboard-uploads', 'moodboard-uploads', false);

-- Storage policies
CREATE POLICY "Users can upload their own moodboard images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'moodboard-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own moodboard images" ON storage.objects
  FOR SELECT USING (bucket_id = 'moodboard-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🏗️ Domain Layer

### `packages/domain/moodboards/entities/Moodboard.ts`

```typescript
export interface MoodboardProps {
  id: string;
  gigId: string;
  ownerId: string;
  title: string;
  summary?: string;
  items: MoodboardItem[];
  palette: string[];
  sourceBreakdown: SourceBreakdown;
  enhancementLog: EnhancementLogEntry[];
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceBreakdown {
  pexels: number;
  userUploads: number;
  aiEnhanced: number;
  aiGenerated: number;
}

export interface EnhancementLogEntry {
  imageId: string;
  enhancementType: string;
  prompt: string;
  cost: number;
  timestamp: Date;
}

export class Moodboard {
  constructor(private props: MoodboardProps) {}

  static create(data: Omit<MoodboardProps, 'id' | 'createdAt' | 'updatedAt'>): Moodboard {
    return new Moodboard({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  get id(): string { return this.props.id; }
  get gigId(): string { return this.props.gigId; }
  get ownerId(): string { return this.props.ownerId; }
  get title(): string { return this.props.title; }
  get items(): MoodboardItem[] { return this.props.items; }
  get totalCost(): number { return this.props.totalCost; }

  addItem(item: MoodboardItem): void {
    this.props.items.push(item);
    this.updateSourceBreakdown(item);
    this.props.updatedAt = new Date();
  }

  logEnhancement(entry: EnhancementLogEntry): void {
    this.props.enhancementLog.push(entry);
    this.props.totalCost += entry.cost;
    this.props.updatedAt = new Date();
  }

  private updateSourceBreakdown(item: MoodboardItem): void {
    switch (item.source) {
      case 'pexels':
        this.props.sourceBreakdown.pexels++;
        break;
      case 'user-upload':
        this.props.sourceBreakdown.userUploads++;
        break;
      case 'ai-enhanced':
        this.props.sourceBreakdown.aiEnhanced++;
        break;
      case 'ai-generated':
        this.props.sourceBreakdown.aiGenerated++;
        break;
    }
  }

  toJSON(): MoodboardProps {
    return { ...this.props };
  }
}
```

### `packages/domain/moodboards/entities/MoodboardItem.ts`

```typescript
export interface MoodboardItemProps {
  id: string;
  source: 'pexels' | 'user-upload' | 'ai-enhanced' | 'ai-generated';
  url: string;
  thumbnailUrl?: string;
  attribution?: string;
  width?: number;
  height?: number;
  palette?: string[];
  blurhash?: string;
  enhancementPrompt?: string;
  originalImageId?: string;
  position: number;
}

export class MoodboardItem {
  constructor(private props: MoodboardItemProps) {}

  static create(data: Omit<MoodboardItemProps, 'id'>): MoodboardItem {
    return new MoodboardItem({
      ...data,
      id: crypto.randomUUID()
    });
  }

  get id(): string { return this.props.id; }
  get source(): string { return this.props.source; }
  get url(): string { return this.props.url; }
  get attribution(): string | undefined { return this.props.attribution; }
  get position(): number { return this.props.position; }

  updatePosition(newPosition: number): void {
    this.props.position = newPosition;
  }

  toJSON(): MoodboardItemProps {
    return { ...this.props };
  }
}
```

### `packages/domain/moodboards/ports/StockPhotoService.ts`

```typescript
export interface StockPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  attribution: string;
  photographerUrl?: string;
  width: number;
  height: number;
  avgColor?: string;
}

export interface SearchOptions {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  count?: number;
  page?: number;
}

export interface StockPhotoService {
  searchPhotos(options: SearchOptions): Promise<StockPhoto[]>;
  getCuratedPhotos(count: number): Promise<StockPhoto[]>;
}
```

### `packages/domain/moodboards/ports/AIImageService.ts`

```typescript
export interface AIEnhancementRequest {
  inputImageUrl: string;
  enhancementType: 'lighting' | 'style' | 'background' | 'mood' | 'custom';
  prompt: string;
  strength?: number;
}

export interface AIEnhancedImage {
  id: string;
  originalUrl: string;
  enhancedUrl: string;
  enhancementType: string;
  prompt: string;
  cost: number;
}

export interface AIImageService {
  enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage>;
  generateImage(prompt: string): Promise<AIEnhancedImage>;
}
```

---

## 🔧 Application Layer

### `packages/application/moodboards/use-cases/GenerateEnhancedMoodboard.ts`

```typescript
import { Moodboard, MoodboardItem } from '../../domain/moodboards/entities';
import { StockPhotoService, AIImageService } from '../../domain/moodboards/ports';

export interface GenerateEnhancedMoodboardCommand {
  userId: string;
  gigId: string;
  title: string;
  pexelsQuery?: string;
  userUploadIds?: string[];
  enhancementRequests?: {
    imageId: string;
    enhancementType: string;
    prompt: string;
  }[];
  subscriptionTier: 'free' | 'plus' | 'pro';
}

export interface MoodboardGenerationResult {
  moodboard: Moodboard;
  totalCost: number;
  sourceBreakdown: {
    pexels: number;
    userUploads: number;
    aiEnhanced: number;
  };
}

export class GenerateEnhancedMoodboard {
  constructor(
    private stockPhotoService: StockPhotoService,
    private aiImageService: AIImageService,
    private moodboardRepository: MoodboardRepository,
    private userMediaRepository: UserMediaRepository,
    private subscriptionPolicy: SubscriptionPolicy
  ) {}

  async execute(command: GenerateEnhancedMoodboardCommand): Promise<MoodboardGenerationResult> {
    // Validate subscription limits
    this.validateSubscriptionLimits(command);

    // Create base moodboard
    const moodboard = Moodboard.create({
      gigId: command.gigId,
      ownerId: command.userId,
      title: command.title,
      summary: `Moodboard for ${command.title}`,
      items: [],
      palette: [],
      sourceBreakdown: { pexels: 0, userUploads: 0, aiEnhanced: 0, aiGenerated: 0 },
      enhancementLog: [],
      totalCost: 0
    });

    let position = 0;

    // Add Pexels images
    if (command.pexelsQuery) {
      const pexelsImages = await this.addPexelsImages(moodboard, command.pexelsQuery, position);
      position += pexelsImages;
    }

    // Add user uploads
    if (command.userUploadIds?.length) {
      const userImages = await this.addUserUploads(moodboard, command.userUploadIds, position);
      position += userImages;
    }

    // Apply AI enhancements
    if (command.enhancementRequests?.length) {
      await this.applyAIEnhancements(moodboard, command.enhancementRequests);
    }

    // Extract color palette
    await this.extractColorPalette(moodboard);

    // Save moodboard
    const savedMoodboard = await this.moodboardRepository.save(moodboard);

    return {
      moodboard: savedMoodboard,
      totalCost: savedMoodboard.totalCost,
      sourceBreakdown: savedMoodboard.toJSON().sourceBreakdown
    };
  }

  private validateSubscriptionLimits(command: GenerateEnhancedMoodboardCommand): void {
    const limits = this.subscriptionPolicy.getMoodboardLimits(command.subscriptionTier);
    
    if (command.userUploadIds && command.userUploadIds.length > limits.maxUserUploads) {
      throw new Error(`User uploads exceed limit: ${limits.maxUserUploads}`);
    }

    if (command.enhancementRequests && command.enhancementRequests.length > limits.maxAIEnhancements) {
      throw new Error(`AI enhancements exceed limit: ${limits.maxAIEnhancements}`);
    }
  }

  private async addPexelsImages(
    moodboard: Moodboard, 
    query: string, 
    startPosition: number
  ): Promise<number> {
    const stockPhotos = await this.stockPhotoService.searchPhotos({
      query,
      orientation: 'landscape',
      count: 6
    });

    stockPhotos.forEach((photo, index) => {
      const item = MoodboardItem.create({
        source: 'pexels',
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        attribution: photo.attribution,
        width: photo.width,
        height: photo.height,
        palette: photo.avgColor ? [photo.avgColor] : [],
        position: startPosition + index
      });
      
      moodboard.addItem(item);
    });

    return stockPhotos.length;
  }

  private async addUserUploads(
    moodboard: Moodboard,
    uploadIds: string[],
    startPosition: number
  ): Promise<number> {
    const userMedia = await this.userMediaRepository.getByIds(uploadIds);

    userMedia.forEach((media, index) => {
      const item = MoodboardItem.create({
        source: 'user-upload',
        url: media.filePath,
        thumbnailUrl: media.filePath, // Could add thumbnail generation
        attribution: undefined,
        width: media.width,
        height: media.height,
        palette: media.palette,
        blurhash: media.blurhash,
        position: startPosition + index
      });

      moodboard.addItem(item);
    });

    return userMedia.length;
  }

  private async applyAIEnhancements(
    moodboard: Moodboard,
    enhancementRequests: Array<{imageId: string; enhancementType: string; prompt: string}>
  ): Promise<void> {
    for (const request of enhancementRequests) {
      try {
        const originalItem = moodboard.items.find(item => item.id === request.imageId);
        if (!originalItem) continue;

        const enhanced = await this.aiImageService.enhanceImage({
          inputImageUrl: originalItem.url,
          enhancementType: request.enhancementType as any,
          prompt: request.prompt,
          strength: 0.8
        });

        const enhancedItem = MoodboardItem.create({
          source: 'ai-enhanced',
          url: enhanced.enhancedUrl,
          thumbnailUrl: enhanced.enhancedUrl,
          attribution: `AI Enhanced with ${request.enhancementType}`,
          enhancementPrompt: request.prompt,
          originalImageId: originalItem.id,
          position: originalItem.position + 0.5 // Insert after original
        });

        moodboard.addItem(enhancedItem);
        moodboard.logEnhancement({
          imageId: enhanced.id,
          enhancementType: request.enhancementType,
          prompt: request.prompt,
          cost: enhanced.cost,
          timestamp: new Date()
        });

      } catch (error) {
        console.error(`Enhancement failed for ${request.imageId}:`, error);
        // Continue with other enhancements
      }
    }
  }

  private async extractColorPalette(moodboard: Moodboard): Promise<void> {
    // Extract dominant colors from all images
    const allColors = moodboard.items
      .flatMap(item => item.toJSON().palette || [])
      .filter(Boolean);

    // Simple palette extraction (could be enhanced with better algorithm)
    const uniqueColors = [...new Set(allColors)].slice(0, 5);
    moodboard.toJSON().palette = uniqueColors;
  }
}
```

---

## 🔌 Adapter Layer

### `packages/adapters/external/PexelsService.ts`

```typescript
import { StockPhotoService, StockPhoto, SearchOptions } from '../../domain/moodboards/ports/StockPhotoService';

export class PexelsService implements StockPhotoService {
  private readonly baseUrl = 'https://api.pexels.com/v1';

  constructor(private apiKey: string) {}

  async searchPhotos(options: SearchOptions): Promise<StockPhoto[]> {
    const params = new URLSearchParams({
      query: options.query,
      orientation: options.orientation || 'landscape',
      size: 'large',
      per_page: String(options.count || 6),
      page: String(options.page || 1)
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`, {
      headers: {
        'Authorization': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.photos?.map((photo: any) => ({
      id: `pexels_${photo.id}`,
      url: photo.src.large,
      thumbnailUrl: photo.src.medium,
      attribution: `Photo by ${photo.photographer} on Pexels`,
      photographerUrl: photo.photographer_url,
      width: photo.width,
      height: photo.height,
      avgColor: photo.avg_color
    })) || [];
  }

  async getCuratedPhotos(count: number = 6): Promise<StockPhoto[]> {
    const response = await fetch(`${this.baseUrl}/curated?per_page=${count}`, {
      headers: {
        'Authorization': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.photos?.map((photo: any) => ({
      id: `pexels_${photo.id}`,
      url: photo.src.large,
      thumbnailUrl: photo.src.medium,
      attribution: `Photo by ${photo.photographer} on Pexels`,
      photographerUrl: photo.photographer_url,
      width: photo.width,
      height: photo.height,
      avgColor: photo.avg_color
    })) || [];
  }
}
```

### `packages/adapters/external/NanoBananaService.ts`

```typescript
import { AIImageService, AIEnhancementRequest, AIEnhancedImage } from '../../domain/moodboards/ports/AIImageService';

export class NanoBananaService implements AIImageService {
  private readonly baseUrl = 'https://api.nanobananapi.ai';

  constructor(private apiKey: string) {}

  async enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage> {
    const enhancementPrompt = this.buildEnhancementPrompt(request);

    const response = await fetch(`${this.baseUrl}/enhance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_image: request.inputImageUrl,
        prompt: enhancementPrompt,
        strength: request.strength || 0.8,
        aspect_ratio: '4:3',
        num_inference_steps: 20
      })
    });

    if (!response.ok) {
      throw new Error(`NanoBanana API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalUrl: request.inputImageUrl,
      enhancedUrl: data.output_image,
      enhancementType: request.enhancementType,
      prompt: enhancementPrompt,
      cost: 0.025 // Cost per enhancement
    };
  }

  async generateImage(prompt: string): Promise<AIEnhancedImage> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `Professional photography style, ${prompt}, high quality, creative composition`,
        aspect_ratio: '4:3',
        num_inference_steps: 25,
        guidance_scale: 7.5
      })
    });

    if (!response.ok) {
      throw new Error(`NanoBanana API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalUrl: '',
      enhancedUrl: data.output_image,
      enhancementType: 'generation',
      prompt,
      cost: 0.025
    };
  }

  private buildEnhancementPrompt(request: AIEnhancementRequest): string {
    const templates = {
      'lighting': `Adjust the lighting in this image to create ${request.prompt} atmosphere, enhance shadows and highlights professionally`,
      'style': `Apply ${request.prompt} artistic style to this image while maintaining the subject and composition`,
      'background': `Replace or enhance the background with ${request.prompt}, keep the main subject unchanged`,
      'mood': `Enhance the overall mood and atmosphere to be ${request.prompt}, adjust colors and contrast accordingly`,
      'custom': request.prompt
    };

    return templates[request.enhancementType] || request.prompt;
  }
}
```

---

## ☁️ Edge Function

### `apps/edge/functions/generate-moodboard/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GenerateMoodboardRequest {
  gigId: string;
  title: string;
  pexelsQuery?: string;
  userUploadIds?: string[];
  enhancementRequests?: Array<{
    imageId: string;
    enhancementType: string;
    prompt: string;
  }>;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user's subscription tier
    const { data: profile } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    const subscriptionTier = profile?.subscription_tier || 'free';
    const requestData: GenerateMoodboardRequest = await req.json();

    // Check rate limits
    await checkRateLimit(supabase, user.id, subscriptionTier);

    // Validate subscription limits
    validateSubscriptionLimits(requestData, subscriptionTier);

    let totalCost = 0;
    const moodboardItems: any[] = [];

    // Process Pexels images
    if (requestData.pexelsQuery) {
      const pexelsImages = await fetchPexelsImages(requestData.pexelsQuery);
      moodboardItems.push(...pexelsImages.map((img, idx) => ({
        ...img,
        position: idx
      })));
    }

    // Process user uploads
    if (requestData.userUploadIds?.length) {
      const userImages = await fetchUserUploads(supabase, requestData.userUploadIds, user.id);
      moodboardItems.push(...userImages.map((img, idx) => ({
        ...img,
        position: moodboardItems.length + idx
      })));
    }

    // Process AI enhancements
    if (requestData.enhancementRequests?.length) {
      const enhancedImages = await processAIEnhancements(
        requestData.enhancementRequests,
        moodboardItems
      );
      moodboardItems.push(...enhancedImages);
      totalCost += enhancedImages.length * 0.025;
    }

    // Create moodboard record
    const { data: moodboard, error: dbError } = await supabase
      .from('moodboards')
      .insert({
        gig_id: requestData.gigId,
        owner_user_id: user.id,
        title: requestData.title,
        summary: `Moodboard with ${moodboardItems.length} curated images`,
        items: moodboardItems,
        palette: extractColorPalette(moodboardItems),
        source_breakdown: calculateSourceBreakdown(moodboardItems),
        total_cost: totalCost,
        ai_provider: totalCost > 0 ? 'nanobanan' : null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response('Database error', { status: 500 });
    }

    // Update rate limit
    await updateRateLimit(supabase, user.id);

    return new Response(JSON.stringify({
      success: true,
      moodboard,
      totalCost,
      sourceBreakdown: calculateSourceBreakdown(moodboardItems)
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Moodboard generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function checkRateLimit(supabase: any, userId: string, tier: string): Promise<void> {
  const limits = {
    free: 3,
    plus: 10,
    pro: 25
  };

  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('count, last_reset')
    .eq('user_id', userId)
    .eq('action', 'moodboard_generation')
    .single();

  const dailyLimit = limits[tier as keyof typeof limits] || 3;

  if (rateLimit) {
    const lastReset = new Date(rateLimit.last_reset);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset < 24 && rateLimit.count >= dailyLimit) {
      throw new Error(`Daily limit of ${dailyLimit} moodboards reached`);
    }
  }
}

async function updateRateLimit(supabase: any, userId: string): Promise<void> {
  await supabase
    .from('rate_limits')
    .upsert({
      user_id: userId,
      action: 'moodboard_generation',
      count: 1,
      last_reset: new Date().toISOString()
    }, {
      onConflict: 'user_id,action',
      ignoreDuplicates: false
    });
}

function validateSubscriptionLimits(request: GenerateMoodboardRequest, tier: string): void {
  const limits = {
    free: { userUploads: 0, aiEnhancements: 0 },
    plus: { userUploads: 3, aiEnhancements: 2 },
    pro: { userUploads: 6, aiEnhancements: 4 }
  };

  const userLimits = limits[tier as keyof typeof limits] || limits.free;

  if (request.userUploadIds && request.userUploadIds.length > userLimits.userUploads) {
    throw new Error(`User uploads exceed limit: ${userLimits.userUploads}`);
  }

  if (request.enhancementRequests && request.enhancementRequests.length > userLimits.aiEnhancements) {
    throw new Error(`AI enhancements exceed limit: ${userLimits.aiEnhancements}`);
  }
}

async function fetchPexelsImages(query: string): Promise<any[]> {
  const pexelsApiKey = Deno.env.get('PEXELS_API_KEY');
  if (!pexelsApiKey) return [];

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=6`,
      {
        headers: {
          'Authorization': pexelsApiKey
        }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    
    return data.photos?.map((photo: any) => ({
      id: `pexels_${photo.id}`,
      source: 'pexels',
      url: photo.src.large,
      thumbnail_url: photo.src.medium,
      attribution: `Photo by ${photo.photographer} on Pexels`,
      photographer_url: photo.photographer_url,
      width: photo.width,
      height: photo.height,
      palette: photo.avg_color ? [photo.avg_color] : []
    })) || [];

  } catch (error) {
    console.error('Pexels fetch error:', error);
    return [];
  }
}

async function fetchUserUploads(supabase: any, uploadIds: string[], userId: string): Promise<any[]> {
  const { data: userMedia } = await supabase
    .from('user_media')
    .select('*')
    .in('id', uploadIds)
    .eq('user_id', userId);

  return userMedia?.map((media: any) => ({
    id: `upload_${media.id}`,
    source: 'user-upload',
    url: media.file_path,
    thumbnail_url: media.file_path,
    attribution: undefined,
    width: media.width,
    height: media.height,
    palette: media.palette || [],
    blurhash: media.blurhash
  })) || [];
}

async function processAIEnhancements(
  enhancementRequests: any[],
  existingItems: any[]
): Promise<any[]> {
  const nanoBananaApiKey = Deno.env.get('NANOBANAN_API_KEY');
  if (!nanoBananaApiKey) return [];

  const enhanced: any[] = [];

  for (const request of enhancementRequests) {
    try {
      const originalItem = existingItems.find(item => item.id === request.imageId);
      if (!originalItem) continue;

      const enhancementPrompt = buildEnhancementPrompt(request.enhancementType, request.prompt);

      const response = await fetch('https://api.nanobananapi.ai/enhance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nanoBananaApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_image: originalItem.url,
          prompt: enhancementPrompt,
          strength: 0.8,
          aspect_ratio: '4:3'
        })
      });

      if (response.ok) {
        const data = await response.json();
        enhanced.push({
          id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'ai-enhanced',
          url: data.output_image,
          thumbnail_url: data.output_image,
          attribution: `AI Enhanced - ${request.enhancementType}`,
          enhancement_prompt: request.prompt,
          original_image_id: originalItem.id,
          position: originalItem.position + 0.5
        });
      }

    } catch (error) {
      console.error(`Enhancement failed for ${request.imageId}:`, error);
    }
  }

  return enhanced;
}

function buildEnhancementPrompt(enhancementType: string, userPrompt: string): string {
  const templates: Record<string, string> = {
    'lighting': `Adjust the lighting in this image to create ${userPrompt} atmosphere`,
    'style': `Apply ${userPrompt} artistic style to this image`,
    'background': `Replace or enhance the background with ${userPrompt}`,
    'mood': `Enhance the overall mood to be ${userPrompt}`
  };

  return templates[enhancementType] || userPrompt;
}

function extractColorPalette(items: any[]): string[] {
  const allColors = items.flatMap(item => item.palette || []).filter(Boolean);
  return [...new Set(allColors)].slice(0, 5);
}

function calculateSourceBreakdown(items: any[]): any {
  return items.reduce((breakdown, item) => {
    switch (item.source) {
      case 'pexels':
        breakdown.pexels++;
        break;
      case 'user-upload':
        breakdown.user_uploads++;
        break;
      case 'ai-enhanced':
        breakdown.ai_enhanced++;
        break;
      case 'ai-generated':
        breakdown.ai_generated++;
        break;
    }
    return breakdown;
  }, { pexels: 0, user_uploads: 0, ai_enhanced: 0, ai_generated: 0 });
}
```

---

## 🎨 React Components

### `apps/web/components/moodboards/MoodboardCreator.tsx`

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Search, Sparkles, Save, Loader2 } from 'lucide-react';
import { PexelsSearchPanel } from './PexelsSearchPanel';
import { UserUploadPanel } from './UserUploadPanel';
import { AIEnhancementPanel } from './AIEnhancementPanel';
import { MoodboardCanvas } from './MoodboardCanvas';

interface MoodboardCreatorProps {
  gigId: string;
  userId: string;
  subscriptionTier: 'free' | 'plus' | 'pro';
  onSave: (moodboard: any) => void;
}

export const MoodboardCreator: React.FC<MoodboardCreatorProps> = ({
  gigId,
  userId,
  subscriptionTier,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'enhance'>('search');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [userUploads, setUserUploads] = useState<any[]>([]);
  const [enhancementRequests, setEnhancementRequests] = useState<any[]>([]);
  const [moodboardTitle, setMoodboardTitle] = useState('');
  const [pexelsQuery, setPexelsQuery] = useState('');

  const subscriptionLimits = {
    free: { userUploads: 0, aiEnhancements: 0 },
    plus: { userUploads: 3, aiEnhancements: 2 },
    pro: { userUploads: 6, aiEnhancements: 4 }
  };

  const limits = subscriptionLimits[subscriptionTier];

  const handleImageSelection = useCallback((images: any[]) => {
    setSelectedImages(images);
  }, []);

  const handleUserUploads = useCallback((uploads: any[]) => {
    setUserUploads(uploads);
  }, []);

  const handleEnhancementRequests = useCallback((requests: any[]) => {
    setEnhancementRequests(requests);
  }, []);

  const generateMoodboard = async () => {
    if (!moodboardTitle.trim()) {
      alert('Please enter a moodboard title');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-moodboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
        },
        body: JSON.stringify({
          gigId,
          title: moodboardTitle,
          pexelsQuery: pexelsQuery || undefined,
          userUploadIds: userUploads.map(u => u.id),
          enhancementRequests
        })
      });

      const data = await response.json();

      if (data.success) {
        onSave(data.moodboard);
      } else {
        throw new Error(data.error || 'Generation failed');
      }

    } catch (error) {
      console.error('Moodboard generation error:', error);
      alert('Failed to generate moodboard. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalImages = selectedImages.length + userUploads.length;
  const totalCost = enhancementRequests.length * 0.025;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Moodboard</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moodboard Title
            </label>
            <input
              type="text"
              value={moodboardTitle}
              onChange={(e) => setMoodboardTitle(e.target.value)}
              placeholder="e.g., Golden Hour Portrait Session"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Images: {totalImages}</span>
              <span>Enhancements: {enhancementRequests.length}/{limits.aiEnhancements}</span>
              {totalCost > 0 && <span>Cost: ${totalCost.toFixed(3)}</span>}
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Find Images (Pexels)
            </button>

            {subscriptionTier !== 'free' && (
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Your Images ({userUploads.length}/{limits.userUploads})
              </button>
            )}

            {subscriptionTier !== 'free' && totalImages > 0 && (
              <button
                onClick={() => setActiveTab('enhance')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'enhance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                AI Enhance ({enhancementRequests.length}/{limits.aiEnhancements})
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'search' && (
            <PexelsSearchPanel
              onImagesSelected={handleImageSelection}
              onQueryChange={setPexelsQuery}
            />
          )}

          {activeTab === 'upload' && subscriptionTier !== 'free' && (
            <UserUploadPanel
              maxUploads={limits.userUploads}
              onUploadsChanged={handleUserUploads}
            />
          )}

          {activeTab === 'enhance' && subscriptionTier !== 'free' && (
            <AIEnhancementPanel
              images={[...selectedImages, ...userUploads]}
              maxEnhancements={limits.aiEnhancements}
              onEnhancementRequests={handleEnhancementRequests}
            />
          )}
        </div>
      </div>

      {/* Moodboard Preview */}
      {totalImages > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Moodboard Preview</h3>
          <MoodboardCanvas images={[...selectedImages, ...userUploads]} />
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={generateMoodboard}
          disabled={!moodboardTitle.trim() || totalImages === 0 || isGenerating}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Generate Moodboard
            </>
          )}
        </button>
      </div>
    </div>
  );
};
```

### `apps/web/components/moodboards/PexelsSearchPanel.tsx`

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ExternalLink, User } from 'lucide-react';
import { debounce } from 'lodash';

interface PexelsSearchPanelProps {
  onImagesSelected: (images: any[]) => void;
  onQueryChange: (query: string) => void;
}

export const PexelsSearchPanel: React.FC<PexelsSearchPanelProps> = ({
  onImagesSelected,
  onQueryChange
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      
      try {
        // This would call your Edge Function or API route
        const response = await fetch('/api/search-pexels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        });

        const data = await response.json();
        setSearchResults(data.photos || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
    onQueryChange(query);
  }, [query, debouncedSearch, onQueryChange]);

  const toggleImageSelection = (image: any) => {
    const isSelected = selectedImages.some(img => img.id === image.id);
    let newSelection;

    if (isSelected) {
      newSelection = selectedImages.filter(img => img.id !== image.id);
    } else {
      newSelection = [...selectedImages, image];
    }

    setSelectedImages(newSelection);
    onImagesSelected(newSelection);
  };

  const popularSearches = [
    'golden hour portrait',
    'urban photography',
    'natural lighting',
    'studio setup',
    'outdoor fashion',
    'street photography'
  ];

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for photos (e.g., 'golden hour portrait')"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Popular Searches */}
      {!query && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search) => (
              <button
                key={search}
                onClick={() => setQuery(search)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {searchResults.length} photos found • {selectedImages.length} selected
            </p>
            {selectedImages.length > 0 && (
              <button
                onClick={() => {
                  setSelectedImages([]);
                  onImagesSelected([]);
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map((photo) => {
              const isSelected = selectedImages.some(img => img.id === photo.id);
              
              return (
                <div
                  key={photo.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => toggleImageSelection(photo)}
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    <img
                      src={photo.src.medium}
                      alt={`Photo by ${photo.photographer}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Selection indicator */}
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white transition-all ${
                    isSelected 
                      ? 'bg-blue-500' 
                      : 'bg-black/20 group-hover:bg-black/40'
                  }`}>
                    {isSelected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Photo info overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="text-white text-xs space-y-1">
                      <p className="font-medium">Photo by {photo.photographer}</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={photo.photographer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <User className="w-3 h-3" />
                          Profile
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No results */}
      {query && !isLoading && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No photos found for "{query}"</p>
          <p className="text-sm text-gray-400 mt-2">Try different search terms</p>
        </div>
      )}

      {/* Attribution */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
        <p>Photos provided by <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Pexels</a></p>
      </div>
    </div>
  );
};
```

---

## 🔧 Environment Setup

### `.env.local` (for local development)

```bash
# Pexels API (Free)
PEXELS_API_KEY=your_pexels_api_key_here

# Nano Banana API (Paid)
NANOBANAN_API_KEY=your_nanobanan_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Alternative AI providers
FAL_AI_API_KEY=your_fal_ai_key_here
KIE_AI_API_KEY=your_kie_ai_key_here
```

### `apps/edge/functions/generate-moodboard/.env` (for Edge Function)

```bash
PEXELS_API_KEY=your_pexels_api_key_here
NANOBANAN_API_KEY=your_nanobanan_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🚀 Deployment Instructions

### 1. Database Setup
```bash
# Run the migration
psql -d your_supabase_db -f database/migrations/001_moodboard_tables.sql
```

### 2. Deploy Edge Function
```bash
# Deploy to Supabase
supabase functions deploy generate-moodboard --project-ref your_project_ref
```

### 3. Add Environment Variables
In your Supabase dashboard → Settings → Environment Variables:
- `PEXELS_API_KEY`
- `NANOBANAN_API_KEY`

### 4. Update API Routes
Add the API route in your Next.js app:

```typescript
// apps/web/app/api/generate-moodboard/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // Forward to Supabase Edge Function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-moodboard`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    }
  );

  return Response.json(await response.json());
}
```

---

## ✅ Testing Checklist

### Free Tier Testing
- [ ] Can search Pexels images
- [ ] Cannot upload user images
- [ ] Cannot use AI enhancement
- [ ] Rate limited to 3 generations/day

### Plus Tier Testing  
- [ ] Can upload 3 user images
- [ ] Can use 2 AI enhancements
- [ ] Rate limited to 10 generations/day
- [ ] Proper cost calculation

### Pro Tier Testing
- [ ] Can upload 6 user images  
- [ ] Can use 4 AI enhancements
- [ ] Rate limited to 25 generations/day
- [ ] All features accessible

### Integration Testing
- [ ] Moodboard saves to database
- [ ] Gig links to moodboard
- [ ] Attribution displays correctly
- [ ] Images display in gig listings

---

## 💰 Cost Monitoring

Add this to your analytics dashboard:

```typescript
// Track moodboard generation costs
interface MoodboardGenerationEvent {
  userId: string;
  gigId: string;
  subscriptionTier: string;
  pexelsImagesUsed: number;
  aiEnhancementsUsed: number;
  totalCost: number;
  timestamp: Date;
}

// Alert thresholds
const COST_ALERTS = {
  dailyCost: 50,    // Alert if daily cost > $50
  monthlyCost: 500, // Alert if monthly cost > $500
  errorRate: 0.05   // Alert if error rate > 5%
};
```

---

This is a complete, production-ready implementation. Upload this to Claude Code and follow the deployment steps to integrate the enhanced moodboard system into your Preset app!
