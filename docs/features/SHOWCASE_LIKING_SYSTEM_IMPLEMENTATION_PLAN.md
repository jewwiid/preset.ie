# Showcase Liking System & Enhanced Showcase Feed Implementation Plan

## 🎯 **Project Overview**

This document outlines the comprehensive implementation plan for creating an Instagram-like showcase system with liking functionality, including a Preset Playground for AI image generation, allowing subscribers to create, edit, and showcase enhanced photos in a complete creative workflow.

## 📋 **Current System Analysis**

### ✅ **What's Already in Place:**

1. **Database Infrastructure:**
   - `showcases` table with basic structure
   - `notifications` system with comprehensive notification types
   - `subscription_tiers` table with FREE, PLUS, PRO tiers
   - `user_credits` system for subscription management
   - `moodboard_items` table storing enhanced photos

2. **Notification System:**
   - Multi-channel delivery (email, push, in-app)
   - Rich content support with avatars and thumbnails
   - User preference controls
   - Real-time delivery capabilities

3. **Subscription System:**
   - Tier-based feature gating
   - Rate limiting per subscription tier
   - Credit allocation system

4. **Enhanced Photos:**
   - NanoBanana and Seedream integration
   - Enhanced photos stored in moodboard items
   - Credit-based enhancement system

### ❌ **What's Missing:**

1. **Likes System:**
   - No likes table or functionality
   - No like counting mechanism
   - No like notifications

2. **Showcase Creation UI:**
   - No interface for creating showcases
   - No way to convert moodboard items to showcase media

3. **Instagram-like Feed:**
   - No masonry grid layout for showcases
   - No profile integration
   - No enhanced photo upload to showcases

4. **Preset Playground:**
   - No AI image generation interface
   - No custom image creation tools
   - No image editing/modification capabilities
   - No playground-to-moodboard workflow

## 🏗️ **Implementation Plan**

### **Phase 0: Preset Playground Foundation (Week 0)**

#### 0.1 Playground Database Schema

```sql
-- Migration: 078_preset_playground_system.sql

-- Playground projects table for user-created images
CREATE TABLE IF NOT EXISTS playground_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Generation settings
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    style VARCHAR(50) DEFAULT 'realistic',
    aspect_ratio VARCHAR(20) DEFAULT '1:1',
    resolution VARCHAR(20) DEFAULT '1024x1024',
    
    -- Generated images
    generated_images JSONB DEFAULT '[]', -- Array of image URLs and metadata
    selected_image_url TEXT, -- Currently selected image for editing
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'saved', 'published')),
    credits_used INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_generated_at TIMESTAMPTZ
);

-- Playground image edits table for modification history
CREATE TABLE IF NOT EXISTS playground_image_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES playground_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Edit details
    edit_type VARCHAR(50) NOT NULL, -- 'enhance', 'modify', 'upscale', 'style_transfer'
    edit_prompt TEXT,
    original_image_url TEXT NOT NULL,
    edited_image_url TEXT NOT NULL,
    
    -- Edit settings
    strength DECIMAL(3,2) DEFAULT 0.8,
    style_preset VARCHAR(50),
    
    -- Metadata
    credits_used INTEGER DEFAULT 1,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User playground gallery for saved images
CREATE TABLE IF NOT EXISTS playground_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    edit_id UUID REFERENCES playground_image_edits(id) ON DELETE SET NULL,
    
    -- Image data
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    format VARCHAR(10),
    
    -- Usage tracking
    used_in_moodboard BOOLEAN DEFAULT FALSE,
    used_in_showcase BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_playground_projects_user_id ON playground_projects(user_id);
CREATE INDEX idx_playground_projects_status ON playground_projects(status);
CREATE INDEX idx_playground_image_edits_project_id ON playground_image_edits(project_id);
CREATE INDEX idx_playground_image_edits_user_id ON playground_image_edits(user_id);
CREATE INDEX idx_playground_gallery_user_id ON playground_gallery(user_id);
CREATE INDEX idx_playground_gallery_used ON playground_gallery(used_in_moodboard, used_in_showcase);

-- RLS Policies
ALTER TABLE playground_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_image_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_gallery ENABLE ROW LEVEL SECURITY;

-- Users can manage their own playground projects
CREATE POLICY "Users can manage own playground projects" ON playground_projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own image edits" ON playground_image_edits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own gallery" ON playground_gallery
    FOR ALL USING (auth.uid() = user_id);
```

#### 0.2 Playground API Endpoints

```typescript
// apps/web/app/api/playground/generate/route.ts
export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  const { prompt, style, aspectRatio, resolution, projectId } = await request.json();
  
  try {
    // Check user credits
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();
    
    if (!userCredits || userCredits.current_balance < 2) {
      return NextResponse.json(
        { error: 'Insufficient credits. Need 2 credits for image generation.' },
        { status: 403 }
      );
    }
    
    // Call Seedream API for image generation
    const seedreamResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4-generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: 'blurry, low quality, distorted',
        style: style || 'realistic',
        aspect_ratio: aspectRatio || '1:1',
        resolution: resolution || '1024x1024',
        num_images: 4,
        enable_sync_mode: true
      })
    });
    
    if (!seedreamResponse.ok) {
      throw new Error('Seedream API error');
    }
    
    const seedreamData = await seedreamResponse.json();
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - 2,
        consumed_this_month: userCredits.consumed_this_month + 2
      })
      .eq('user_id', user.id);
    
    // Save or update project
    const projectData = {
      user_id: user.id,
      title: prompt.substring(0, 50),
      prompt,
      style,
      aspect_ratio: aspectRatio,
      resolution,
      generated_images: seedreamData.data.outputs.map((img: any) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        generated_at: new Date().toISOString()
      })),
      credits_used: 2,
      status: 'generated',
      last_generated_at: new Date().toISOString()
    };
    
    let project;
    if (projectId) {
      const { data, error } = await supabase
        .from('playground_projects')
        .update(projectData)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      project = data;
    } else {
      const { data, error } = await supabase
        .from('playground_projects')
        .insert(projectData)
        .select()
        .single();
      
      if (error) throw error;
      project = data;
    }
    
    return NextResponse.json({ 
      success: true, 
      project,
      images: seedreamData.data.outputs 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 });
  }
}

// apps/web/app/api/playground/edit/route.ts
export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  const { projectId, imageUrl, editType, editPrompt, strength } = await request.json();
  
  try {
    // Check credits for editing
    const creditsNeeded = editType === 'upscale' ? 1 : 2;
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${editType}.` },
        { status: 403 }
      );
    }
    
    // Call Seedream API for image editing
    const editResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4-edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: editPrompt,
        strength: strength || 0.8,
        edit_type: editType,
        enable_sync_mode: true
      })
    });
    
    if (!editResponse.ok) {
      throw new Error('Seedream edit API error');
    }
    
    const editData = await editResponse.json();
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id);
    
    // Save edit record
    const { data: editRecord } = await supabase
      .from('playground_image_edits')
      .insert({
        project_id: projectId,
        user_id: user.id,
        edit_type: editType,
        edit_prompt: editPrompt,
        original_image_url: imageUrl,
        edited_image_url: editData.data.output_url,
        strength,
        credits_used: creditsNeeded
      })
      .select()
      .single();
    
    return NextResponse.json({ 
      success: true, 
      editRecord,
      editedImage: editData.data.output_url 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to edit image' }, { status: 500 });
  }
}

// apps/web/app/api/playground/save-to-gallery/route.ts
export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  const { imageUrl, title, description, tags, projectId, editId } = await request.json();
  
  try {
    // Get image metadata
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    // Upload to Supabase storage
    const fileName = `${user.id}/${crypto.randomUUID()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('playground-gallery')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('playground-gallery')
      .getPublicUrl(fileName);
    
    // Save to gallery
    const { data: galleryItem } = await supabase
      .from('playground_gallery')
      .insert({
        user_id: user.id,
        project_id: projectId,
        edit_id: editId,
        image_url: publicUrl,
        thumbnail_url: publicUrl, // Could generate thumbnail
        title: title || 'Untitled',
        description,
        tags: tags || [],
        width: 1024, // Default, could extract from image
        height: 1024,
        file_size: imageBlob.size,
        format: 'jpg'
      })
      .select()
      .single();
    
    return NextResponse.json({ 
      success: true, 
      galleryItem 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save to gallery' }, { status: 500 });
  }
}
```

### **Phase 1: Database Schema & Core Infrastructure (Week 1)**

#### 1.1 Create Likes System Tables

```sql
-- Migration: 079_showcase_likes_system.sql

-- Likes table for showcases
CREATE TABLE IF NOT EXISTS showcase_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate likes
    UNIQUE(showcase_id, user_id)
);

-- Like counts cache table for performance
CREATE TABLE IF NOT EXISTS showcase_like_counts (
    showcase_id UUID PRIMARY KEY REFERENCES showcases(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_showcase_likes_showcase_id ON showcase_likes(showcase_id);
CREATE INDEX idx_showcase_likes_user_id ON showcase_likes(user_id);
CREATE INDEX idx_showcase_likes_created_at ON showcase_likes(created_at);

-- RLS Policies
ALTER TABLE showcase_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_like_counts ENABLE ROW LEVEL SECURITY;

-- Users can like/unlike showcases
CREATE POLICY "Users can like showcases" ON showcase_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike showcases" ON showcase_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view like counts
CREATE POLICY "Anyone can view like counts" ON showcase_like_counts
    FOR SELECT USING (true);

-- System can update like counts
CREATE POLICY "System can update like counts" ON showcase_like_counts
    FOR ALL USING (true);
```

#### 1.2 Enhanced Showcase Media System

```sql
-- Migration: 080_enhanced_showcase_media.sql

-- Create showcase_media table to bridge moodboard items and showcases
CREATE TABLE IF NOT EXISTS showcase_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    moodboard_item_id UUID REFERENCES moodboard_items(id) ON DELETE SET NULL,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    
    -- Enhanced photo data
    enhanced_url TEXT,
    original_url TEXT,
    thumbnail_url TEXT,
    
    -- Metadata
    width INTEGER,
    height INTEGER,
    caption TEXT,
    position INTEGER DEFAULT 0,
    
    -- Source tracking
    source VARCHAR(20) DEFAULT 'moodboard' CHECK (source IN ('moodboard', 'upload', 'enhanced')),
    enhancement_type VARCHAR(50),
    enhancement_prompt TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_showcase_media_showcase_id ON showcase_media(showcase_id);
CREATE INDEX idx_showcase_media_moodboard_item ON showcase_media(moodboard_item_id);
CREATE INDEX idx_showcase_media_position ON showcase_media(showcase_id, position);

-- RLS Policies
ALTER TABLE showcase_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view showcase media" ON showcase_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM showcases 
            WHERE id = showcase_media.showcase_id 
            AND visibility = 'PUBLIC'
        )
    );

CREATE POLICY "Showcase creators can manage media" ON showcase_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM showcases 
            WHERE id = showcase_media.showcase_id 
            AND (creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                 OR talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()))
        )
    );
```

#### 1.3 Update Showcases Table

```sql
-- Add missing columns to showcases table
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS moodboard_id UUID REFERENCES moodboards(id),
ADD COLUMN IF NOT EXISTS created_from_moodboard BOOLEAN DEFAULT FALSE;

-- Update constraint to allow moodboard-based showcases
ALTER TABLE showcases DROP CONSTRAINT IF EXISTS media_count;
ALTER TABLE showcases ADD CONSTRAINT showcase_media_count CHECK (
    (array_length(media_ids, 1) BETWEEN 3 AND 6) OR 
    (created_from_moodboard = true AND moodboard_id IS NOT NULL)
);
```

### **Phase 2: Backend API Development (Week 2)**

#### 2.1 Likes API Endpoints

```typescript
// apps/web/app/api/showcases/[id]/like/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getUserFromRequest(request);
  const { id: showcaseId } = await params;
  
  try {
    // Check if user already liked
    const { data: existingLike } = await supabase
      .from('showcase_likes')
      .select('id')
      .eq('showcase_id', showcaseId)
      .eq('user_id', user.id)
      .single();
    
    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 });
    }
    
    // Add like
    const { error } = await supabase
      .from('showcase_likes')
      .insert({
        showcase_id: showcaseId,
        user_id: user.id
      });
    
    if (error) throw error;
    
    // Update like count
    await updateShowcaseLikeCount(showcaseId);
    
    // Send notification to showcase creator
    await sendLikeNotification(showcaseId, user.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to like showcase' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getUserFromRequest(request);
  const { id: showcaseId } = await params;
  
  try {
    // Remove like
    const { error } = await supabase
      .from('showcase_likes')
      .delete()
      .eq('showcase_id', showcaseId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    // Update like count
    await updateShowcaseLikeCount(showcaseId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unlike showcase' }, { status: 500 });
  }
}
```

#### 2.2 Showcase Creation API

```typescript
// apps/web/app/api/showcases/create/route.ts
export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  const { moodboardId, title, description, tags } = await request.json();
  
  try {
    // Check subscription tier for showcase creation
    const { data: userProfile } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();
    
    if (!userProfile || userProfile.subscription_tier === 'FREE') {
      return NextResponse.json(
        { error: 'Subscription required to create showcases' },
        { status: 403 }
      );
    }
    
    // Get moodboard data
    const { data: moodboard } = await supabase
      .from('moodboards')
      .select('*, items: moodboard_items(*)')
      .eq('id', moodboardId)
      .eq('owner_user_id', (await getUserProfileId(user.id)).id)
      .single();
    
    if (!moodboard) {
      return NextResponse.json({ error: 'Moodboard not found' }, { status: 404 });
    }
    
    // Create showcase
    const { data: showcase, error: showcaseError } = await supabase
      .from('showcases')
      .insert({
        title: title || moodboard.title,
        description: description || moodboard.summary,
        creator_user_id: (await getUserProfileId(user.id)).id,
        talent_user_id: (await getUserProfileId(user.id)).id, // Self-showcase
        visibility: 'PUBLIC',
        created_from_moodboard: true,
        moodboard_id: moodboardId,
        tags: tags || []
      })
      .select()
      .single();
    
    if (showcaseError) throw showcaseError;
    
    // Create showcase media from moodboard items
    const enhancedItems = moodboard.items.filter(item => 
      item.source === 'ai-enhanced' || item.enhanced_url
    );
    
    for (const [index, item] of enhancedItems.entries()) {
      await supabase
        .from('showcase_media')
        .insert({
          showcase_id: showcase.id,
          moodboard_item_id: item.id,
          enhanced_url: item.enhanced_url || item.url,
          original_url: item.original_url,
          thumbnail_url: item.thumbnail_url,
          width: item.width,
          height: item.height,
          caption: item.caption,
          position: index,
          source: 'moodboard',
          enhancement_type: item.enhancement_type,
          enhancement_prompt: item.enhancement_prompt
        });
    }
    
    return NextResponse.json({ showcaseId: showcase.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create showcase' }, { status: 500 });
  }
}
```

#### 2.3 Notification System Integration

```typescript
// utils/notifications.ts
export async function sendLikeNotification(showcaseId: string, likerUserId: string) {
  try {
    // Get showcase and creator info
    const { data: showcase } = await supabase
      .from('showcases')
      .select(`
        creator_user_id,
        creator_profile:creator_user_id(display_name, handle),
        liker_profile:users_profile!showcase_likes_user_id_fkey(display_name, handle)
      `)
      .eq('id', showcaseId)
      .single();
    
    const { data: likerProfile } = await supabase
      .from('users_profile')
      .select('display_name, handle')
      .eq('user_id', likerUserId)
      .single();
    
    // Create notification
    await supabase
      .from('notifications')
      .insert({
        recipient_id: showcase.creator_user_id,
        type: 'showcase_liked',
        category: 'showcase',
        title: 'New Like on Your Showcase',
        message: `${likerProfile.display_name} liked your showcase`,
        avatar_url: `/api/avatars/${likerProfile.handle}`,
        action_url: `/showcases/${showcaseId}`,
        sender_id: likerUserId,
        related_showcase_id: showcaseId
      });
  } catch (error) {
    console.error('Failed to send like notification:', error);
  }
}
```

### **Phase 2.5: Playground UI Components (Week 2.5)**

#### 2.5.1 Preset Playground Page

```typescript
// apps/web/app/playground/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Wand2, Download, Save, Sparkles, Settings, Palette } from 'lucide-react'
import { useAuth } from '../lib/auth-context'

interface PlaygroundProject {
  id: string
  title: string
  prompt: string
  generated_images: Array<{
    url: string
    width: number
    height: number
    generated_at: string
  }>
  selected_image_url?: string
  status: string
  credits_used: number
}

export default function PlaygroundPage() {
  const { user } = useAuth()
  const [currentProject, setCurrentProject] = useState<PlaygroundProject | null>(null)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('1024x1024')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [editStrength, setEditStrength] = useState(0.8)
  const [userCredits, setUserCredits] = useState(0)

  useEffect(() => {
    fetchUserCredits()
  }, [user])

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits')
      const data = await response.json()
      setUserCredits(data.current_balance)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  const generateImages = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio,
          resolution,
          projectId: currentProject?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const { project, images } = await response.json()
      setCurrentProject(project)
      setUserCredits(prev => prev - 2)
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const editImage = async () => {
    if (!selectedImage || !editPrompt.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          projectId: currentProject?.id,
          imageUrl: selectedImage,
          editType: 'enhance',
          editPrompt,
          strength: editStrength
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to edit image')
      }

      const { editedImage } = await response.json()
      
      // Add edited image to project
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          generated_images: [
            ...currentProject.generated_images,
            {
              url: editedImage,
              width: 1024,
              height: 1024,
              generated_at: new Date().toISOString()
            }
          ]
        }
        setCurrentProject(updatedProject)
        setUserCredits(prev => prev - 2)
      }
    } catch (error) {
      console.error('Edit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveToGallery = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/playground/save-to-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          imageUrl,
          title: prompt.substring(0, 50),
          description: `Generated from: ${prompt}`,
          tags: ['ai-generated', style],
          projectId: currentProject?.id
        })
      })

      if (response.ok) {
        alert('Image saved to gallery!')
      }
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Preset Playground</h1>
          <p className="text-gray-600">Create and edit AI-generated images with Seedream</p>
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Credits: {userCredits}</span>
            </div>
            <div className="text-sm text-gray-500">
              Generation: 2 credits | Editing: 2 credits | Upscale: 1 credit
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
                Generate Images
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe the image you want to create..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Style
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="realistic">Realistic</option>
                      <option value="artistic">Artistic</option>
                      <option value="cartoon">Cartoon</option>
                      <option value="anime">Anime</option>
                      <option value="fantasy">Fantasy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aspect Ratio
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="1:1">Square (1:1)</option>
                      <option value="16:9">Landscape (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                      <option value="4:3">Standard (4:3)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateImages}
                  disabled={loading || !prompt.trim() || userCredits < 2}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate (2 credits)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Edit Panel */}
            {selectedImage && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-blue-500" />
                  Edit Selected Image
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edit Prompt
                    </label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe how you want to modify the image..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strength: {editStrength}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={editStrength}
                      onChange={(e) => setEditStrength(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={editImage}
                    disabled={loading || !editPrompt.trim() || userCredits < 2}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit Image (2 credits)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Generated Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Generated Images</h2>
              
              {currentProject?.generated_images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {currentProject.generated_images.map((image, index) => (
                    <div 
                      key={index}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden ${
                        selectedImage === image.url ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-64 object-cover"
                      />
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              saveToGallery(image.url)
                            }}
                            className="bg-white text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-100 flex items-center"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </button>
                          <a
                            href={image.url}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-100 flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No images generated yet. Create your first image!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 2.5.2 Playground Gallery Component

```typescript
// apps/web/app/components/PlaygroundGallery.tsx
'use client'

import { useState, useEffect } from 'react'
import { Download, Plus, Upload, Heart } from 'lucide-react'

interface GalleryItem {
  id: string
  image_url: string
  thumbnail_url: string
  title: string
  description?: string
  tags: string[]
  used_in_moodboard: boolean
  used_in_showcase: boolean
  created_at: string
}

export default function PlaygroundGallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    fetchGalleryItems()
  }, [])

  const fetchGalleryItems = async () => {
    try {
      const response = await fetch('/api/playground/gallery')
      const data = await response.json()
      setGalleryItems(data.items)
    } catch (error) {
      console.error('Failed to fetch gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToMoodboard = async (itemId: string) => {
    try {
      const response = await fetch('/api/moodboards/add-from-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          galleryItemId: itemId,
          moodboardId: 'current' // Could be current moodboard or new one
        })
      })

      if (response.ok) {
        setGalleryItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, used_in_moodboard: true }
            : item
        ))
        alert('Added to moodboard!')
      }
    } catch (error) {
      console.error('Failed to add to moodboard:', error)
    }
  }

  const addToShowcase = async (itemId: string) => {
    try {
      const response = await fetch('/api/showcases/add-from-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          galleryItemId: itemId
        })
      })

      if (response.ok) {
        setGalleryItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, used_in_showcase: true }
            : item
        ))
        alert('Added to showcase!')
      }
    } catch (error) {
      console.error('Failed to add to showcase:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading gallery...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Gallery</h2>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {galleryItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images in gallery</h3>
          <p className="text-gray-600 mb-4">
            Create your first AI-generated image in the Playground
          </p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Go to Playground
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {galleryItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                
                {/* Status badges */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {item.used_in_moodboard && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Moodboard</span>
                  )}
                  {item.used_in_showcase && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Showcase</span>
                  )}
                </div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToMoodboard(item.id)}
                      disabled={item.used_in_moodboard}
                      className="bg-white text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50"
                    >
                      Add to Moodboard
                    </button>
                    <button
                      onClick={() => addToShowcase(item.id)}
                      disabled={item.used_in_showcase}
                      className="bg-white text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50"
                    >
                      Add to Showcase
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {item.title}
                </h3>
                
                {item.description && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <a
                    href={item.image_url}
                    download
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### **Phase 3: Frontend Components (Week 3)**

#### 3.1 Instagram-like Showcase Feed Component

```typescript
// apps/web/app/components/ShowcaseFeed.tsx
'use client'

import { useState, useEffect } from 'react'
import { Heart, Eye, User, Calendar } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'

interface ShowcaseFeedItem {
  id: string
  title: string
  description?: string
  creator_profile: {
    display_name: string
    handle: string
    avatar_url?: string
  }
  media: Array<{
    id: string
    enhanced_url: string
    thumbnail_url: string
    width: number
    height: number
    caption?: string
  }>
  likes_count: number
  views_count: number
  created_at: string
  tags: string[]
  is_liked: boolean
}

export default function ShowcaseFeed() {
  const { user } = useAuth()
  const [showcases, setShowcases] = useState<ShowcaseFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShowcases()
  }, [])

  const fetchShowcases = async () => {
    try {
      const response = await fetch('/api/showcases/feed')
      const data = await response.json()
      setShowcases(data.showcases)
    } catch (error) {
      console.error('Failed to fetch showcases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (showcaseId: string) => {
    try {
      const response = await fetch(`/api/showcases/${showcaseId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      })
      
      if (response.ok) {
        setShowcases(prev => prev.map(showcase => 
          showcase.id === showcaseId 
            ? { 
                ...showcase, 
                is_liked: !showcase.is_liked,
                likes_count: showcase.is_liked 
                  ? showcase.likes_count - 1 
                  : showcase.likes_count + 1
              }
            : showcase
        ))
      }
    } catch (error) {
      console.error('Failed to like showcase:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading showcases...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {showcases.map((showcase) => (
          <ShowcaseCard 
            key={showcase.id}
            showcase={showcase}
            onLike={handleLike}
          />
        ))}
      </div>
    </div>
  )
}

function ShowcaseCard({ showcase, onLike }: { 
  showcase: ShowcaseFeedItem
  onLike: (id: string) => void 
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Media Grid */}
      <div className="grid grid-cols-2 gap-1 p-2">
        {showcase.media.slice(0, 4).map((media, index) => (
          <div 
            key={media.id}
            className={`relative ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
          >
            <img
              src={media.thumbnail_url || media.enhanced_url}
              alt={media.caption || ''}
              className="w-full h-32 object-cover rounded"
            />
            {index === 3 && showcase.media.length > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                <span className="text-white font-bold">+{showcase.media.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {showcase.title}
          </h3>
          <button
            onClick={() => onLike(showcase.id)}
            className={`p-1 rounded-full transition-colors ${
              showcase.is_liked 
                ? 'text-red-500 bg-red-50' 
                : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`h-5 w-5 ${showcase.is_liked ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        {/* Creator Info */}
        <div className="flex items-center space-x-2 mb-3">
          <img
            src={showcase.creator_profile.avatar_url || '/default-avatar.png'}
            alt={showcase.creator_profile.display_name}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-gray-600">
            {showcase.creator_profile.display_name}
          </span>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{showcase.likes_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{showcase.views_count}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(showcase.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 3.2 Create Showcase Modal

```typescript
// apps/web/app/components/CreateShowcaseModal.tsx
'use client'

import { useState } from 'react'
import { X, Upload, Sparkles } from 'lucide-react'

interface CreateShowcaseModalProps {
  isOpen: boolean
  onClose: () => void
  moodboardId?: string
  onSuccess: (showcaseId: string) => void
}

export default function CreateShowcaseModal({ 
  isOpen, 
  onClose, 
  moodboardId,
  onSuccess 
}: CreateShowcaseModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/showcases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          moodboardId,
          ...formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create showcase')
      }

      const { showcaseId } = await response.json()
      onSuccess(showcaseId)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Create Showcase</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter showcase title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Describe your showcase"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>Enhanced photos from your moodboard will be included</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Showcase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### **Phase 4: Profile Integration (Week 4)**

#### 4.1 Profile Showcase Section

```typescript
// apps/web/app/components/profile/ShowcaseSection.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Heart, Eye } from 'lucide-react'
import CreateShowcaseModal from '../CreateShowcaseModal'

interface ProfileShowcaseSectionProps {
  userId: string
  isOwnProfile: boolean
}

export default function ProfileShowcaseSection({ 
  userId, 
  isOwnProfile 
}: ProfileShowcaseSectionProps) {
  const [showcases, setShowcases] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserShowcases()
  }, [userId])

  const fetchUserShowcases = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/showcases`)
      const data = await response.json()
      setShowcases(data.showcases)
    } catch (error) {
      console.error('Failed to fetch user showcases:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Showcases</h2>
        {isOwnProfile && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Showcase</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      ) : showcases.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isOwnProfile ? 'No showcases yet' : 'No showcases'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isOwnProfile 
              ? 'Create your first showcase from your enhanced moodboard photos'
              : 'This user hasn\'t created any showcases yet'
            }
          </p>
          {isOwnProfile && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Create Your First Showcase
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcases.map((showcase) => (
            <ShowcaseCard key={showcase.id} showcase={showcase} />
          ))}
        </div>
      )}

      <CreateShowcaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(showcaseId) => {
          fetchUserShowcases()
          // Redirect to new showcase
          window.location.href = `/showcases/${showcaseId}`
        }}
      />
    </div>
  )
}
```

## 🔧 **Technical Implementation Details**

### **Database Functions**

```sql
-- Function to update showcase like counts
CREATE OR REPLACE FUNCTION update_showcase_like_count(p_showcase_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO showcase_like_counts (showcase_id, likes_count, last_updated)
    SELECT 
        p_showcase_id,
        COUNT(*),
        NOW()
    FROM showcase_likes
    WHERE showcase_id = p_showcase_id
    ON CONFLICT (showcase_id) DO UPDATE SET
        likes_count = EXCLUDED.likes_count,
        last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update like counts
CREATE OR REPLACE FUNCTION trigger_update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        PERFORM update_showcase_like_count(COALESCE(NEW.showcase_id, OLD.showcase_id));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_count_trigger
    AFTER INSERT OR DELETE ON showcase_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_like_count();
```

### **Subscription Gating**

```typescript
// utils/subscription-gating.ts
export async function checkShowcaseCreationPermission(userId: string): Promise<{
  allowed: boolean
  reason?: string
  upgradeRequired?: boolean
}> {
  try {
    const { data: userProfile } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', userId)
      .single()

    if (!userProfile) {
      return { allowed: false, reason: 'User profile not found' }
    }

    // Free users cannot create showcases
    if (userProfile.subscription_tier === 'FREE') {
      return { 
        allowed: false, 
        reason: 'Subscription required to create showcases',
        upgradeRequired: true
      }
    }

    // Check showcase count limits
    const { data: showcaseCount } = await supabase
      .from('showcases')
      .select('id', { count: 'exact' })
      .eq('creator_user_id', userProfile.id)
      .eq('visibility', 'PUBLIC')

    const maxShowcases = getMaxShowcases(userProfile.subscription_tier)
    
    if (showcaseCount && showcaseCount.length >= maxShowcases) {
      return { 
        allowed: false, 
        reason: `Showcase limit reached (${maxShowcases})`,
        upgradeRequired: true
      }
    }

    return { allowed: true }
  } catch (error) {
    return { allowed: false, reason: 'Error checking permissions' }
  }
}

function getMaxShowcases(tier: string): number {
  switch (tier) {
    case 'PLUS': return 10
    case 'PRO': return -1 // unlimited
    default: return 0
  }
}
```

## 📱 **Mobile Responsiveness**

### **Responsive Design Considerations**

1. **Masonry Grid:**
   - 1 column on mobile
   - 2 columns on tablet
   - 3+ columns on desktop

2. **Touch Interactions:**
   - Larger touch targets for like buttons
   - Swipe gestures for image galleries
   - Pull-to-refresh functionality

3. **Performance:**
   - Lazy loading for images
   - Virtual scrolling for large feeds
   - Image optimization and compression

## 🔔 **Notification Types**

### **Like Notifications**

```typescript
// Notification types for likes
const LIKE_NOTIFICATION_TYPES = {
  SHOWCASE_LIKED: 'showcase_liked',
  SHOWCASE_UNLIKED: 'showcase_unliked', // Optional
  LIKE_MILESTONE: 'like_milestone' // 10, 50, 100 likes
}

// Notification templates
const NOTIFICATION_TEMPLATES = {
  showcase_liked: {
    title: 'New Like on Your Showcase',
    message: '{liker_name} liked your showcase "{showcase_title}"',
    action_url: '/showcases/{showcase_id}',
    category: 'showcase'
  },
  like_milestone: {
    title: 'Milestone Reached!',
    message: 'Your showcase "{showcase_title}" reached {count} likes!',
    action_url: '/showcases/{showcase_id}',
    category: 'achievement'
  }
}
```

## 🔗 **Playground Integration Workflow**

### **Complete Creative Pipeline**

1. **Playground → Gallery:**
   - Users generate images with Seedream
   - Save favorites to personal gallery
   - Track usage across platform

2. **Gallery → Moodboard:**
   - Add gallery images to moodboards
   - Enhance with NanoBanana/Seedream
   - Create cohesive visual collections

3. **Moodboard → Showcase:**
   - Convert enhanced moodboards to showcases
   - Share with Instagram-like feed
   - Enable community interaction

4. **Showcase → Profile:**
   - Display user's best work
   - Build creator reputation
   - Drive engagement and follows

### **API Integration Points**

```typescript
// Integration API endpoints
// apps/web/app/api/moodboards/add-from-gallery/route.ts
export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  const { galleryItemId, moodboardId } = await request.json();
  
  try {
    // Get gallery item
    const { data: galleryItem } = await supabase
      .from('playground_gallery')
      .select('*')
      .eq('id', galleryItemId)
      .eq('user_id', user.id)
      .single();
    
    if (!galleryItem) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }
    
    // Add to moodboard
    const { data: moodboardItem } = await supabase
      .from('moodboard_items')
      .insert({
        moodboard_id: moodboardId,
        source: 'playground',
        url: galleryItem.image_url,
        thumbnail_url: galleryItem.thumbnail_url,
        caption: galleryItem.title,
        width: galleryItem.width,
        height: galleryItem.height,
        position: 0
      })
      .select()
      .single();
    
    // Mark as used
    await supabase
      .from('playground_gallery')
      .update({ used_in_moodboard: true })
      .eq('id', galleryItemId);
    
    return NextResponse.json({ success: true, moodboardItem });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add to moodboard' }, { status: 500 });
  }
}

// apps/web/app/api/showcases/add-from-gallery/route.ts
export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  const { galleryItemId } = await request.json();
  
  try {
    // Check subscription for showcase creation
    const permission = await checkShowcaseCreationPermission(user.id);
    if (!permission.allowed) {
      return NextResponse.json({ error: permission.reason }, { status: 403 });
    }
    
    // Get gallery item
    const { data: galleryItem } = await supabase
      .from('playground_gallery')
      .select('*')
      .eq('id', galleryItemId)
      .eq('user_id', user.id)
      .single();
    
    if (!galleryItem) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }
    
    // Create showcase with single image
    const { data: showcase } = await supabase
      .from('showcases')
      .insert({
        title: galleryItem.title,
        description: galleryItem.description,
        creator_user_id: (await getUserProfileId(user.id)).id,
        talent_user_id: (await getUserProfileId(user.id)).id,
        visibility: 'PUBLIC',
        created_from_playground: true
      })
      .select()
      .single();
    
    // Add to showcase media
    await supabase
      .from('showcase_media')
      .insert({
        showcase_id: showcase.id,
        image_url: galleryItem.image_url,
        thumbnail_url: galleryItem.thumbnail_url,
        caption: galleryItem.title,
        width: galleryItem.width,
        height: galleryItem.height,
        source: 'playground',
        position: 0
      });
    
    // Mark as used
    await supabase
      .from('playground_gallery')
      .update({ used_in_showcase: true })
      .eq('id', galleryItemId);
    
    return NextResponse.json({ success: true, showcaseId: showcase.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create showcase' }, { status: 500 });
  }
}
```

## 🚀 **Deployment Strategy**

### **Phase 0: Preset Playground Foundation (Week 0)**
- [ ] Playground database schema
- [ ] Seedream API integration
- [ ] Basic playground UI
- [ ] Gallery system

### **Phase 1: Core Infrastructure (Week 1)**
- [ ] Database migrations
- [ ] Basic API endpoints
- [ ] Like system functionality
- [ ] Playground-to-moodboard integration

### **Phase 2: Showcase Creation (Week 2)**
- [ ] Showcase creation API
- [ ] Moodboard integration
- [ ] Subscription gating
- [ ] Playground-to-showcase integration

### **Phase 2.5: Playground UI Components (Week 2.5)**
- [ ] Complete playground interface
- [ ] Image editing capabilities
- [ ] Gallery management
- [ ] Integration workflows

### **Phase 3: Frontend Components (Week 3)**
- [ ] Showcase feed component
- [ ] Create showcase modal
- [ ] Like/unlike functionality
- [ ] Mobile responsiveness

### **Phase 4: Profile Integration (Week 4)**
- [ ] Profile showcase section
- [ ] User showcase pages
- [ ] Creator reputation system
- [ ] Cross-platform integration

### **Phase 5: Polish & Testing (Week 5)**
- [ ] Notification system integration
- [ ] Performance optimization
- [ ] User testing and feedback
- [ ] Analytics implementation

## 📊 **Analytics & Monitoring**

### **Key Metrics to Track**

1. **Engagement Metrics:**
   - Likes per showcase
   - Like-to-view ratio
   - Time spent on showcase pages

2. **Creation Metrics:**
   - Showcases created per day
   - Conversion rate from moodboard to showcase
   - Subscription upgrade rate

3. **User Behavior:**
   - Most liked showcase types
   - Peak usage times
   - User retention after showcase creation

### **Analytics Implementation**

```typescript
// Analytics tracking for showcases
export const trackShowcaseEvent = (event: string, data: any) => {
  // Track with your analytics service
  analytics.track(event, {
    ...data,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent
  })
}

// Event types
const SHOWCASE_EVENTS = {
  SHOWCASE_CREATED: 'showcase_created',
  SHOWCASE_LIKED: 'showcase_liked',
  SHOWCASE_VIEWED: 'showcase_viewed',
  SHOWCASE_SHARED: 'showcase_shared'
}
```

## 🔒 **Security Considerations**

### **Rate Limiting**

```typescript
// Rate limiting for likes
const LIKE_RATE_LIMITS = {
  FREE: { requests: 50, window: '1 hour' },
  PLUS: { requests: 200, window: '1 hour' },
  PRO: { requests: 500, window: '1 hour' }
}

// Rate limiting for showcase creation
const SHOWCASE_CREATION_LIMITS = {
  FREE: { requests: 0, window: '1 day' }, // Not allowed
  PLUS: { requests: 5, window: '1 day' },
  PRO: { requests: 20, window: '1 day' }
}
```

### **Content Moderation**

1. **Automated Checks:**
   - Image content analysis
   - Text content filtering
   - Spam detection

2. **User Reporting:**
   - Report inappropriate showcases
   - Report spam likes
   - Moderation queue integration

## 🎯 **Success Metrics**

### **Primary KPIs**

1. **User Engagement:**
   - Daily active users on showcase feed
   - Average likes per showcase
   - User retention after showcase creation

2. **Content Creation:**
   - Showcases created per day
   - Conversion rate from moodboard to showcase
   - Enhanced photo usage in showcases

3. **Monetization:**
   - Subscription upgrades for showcase creation
   - User lifetime value increase
   - Feature adoption rates

### **Success Criteria**

- **Week 1:** Core like system functional
- **Week 2:** Showcase creation working
- **Week 3:** Instagram-like feed live
- **Week 4:** Profile integration complete
- **Week 5:** 100+ showcases created, 1000+ likes

## 🔄 **Future Enhancements**

### **Phase 2 Features**

1. **Advanced Interactions:**
   - Comments on showcases
   - Share functionality
   - Bookmark/save showcases

2. **Discovery Features:**
   - Trending showcases
   - Category-based browsing
   - Search functionality

3. **Social Features:**
   - Follow creators
   - Personalized feed
   - Collaboration showcases

4. **Monetization:**
   - Premium showcase features
   - Sponsored showcases
   - Creator revenue sharing

---

## 📋 **Implementation Checklist**

### **Database Setup**
- [ ] Create playground_projects table
- [ ] Create playground_image_edits table
- [ ] Create playground_gallery table
- [ ] Create showcase_likes table
- [ ] Create showcase_like_counts table
- [ ] Create showcase_media table
- [ ] Update showcases table schema
- [ ] Add database functions and triggers
- [ ] Set up RLS policies

### **Backend Development**
- [ ] Playground generation API (Seedream integration)
- [ ] Playground editing API
- [ ] Gallery management API
- [ ] Likes API endpoints
- [ ] Showcase creation API
- [ ] Playground-to-moodboard integration
- [ ] Playground-to-showcase integration
- [ ] Notification system integration
- [ ] Subscription gating logic
- [ ] Rate limiting implementation

### **Frontend Development**
- [ ] Preset Playground page
- [ ] Playground Gallery component
- [ ] Showcase feed component
- [ ] Create showcase modal
- [ ] Like/unlike functionality
- [ ] Profile showcase section
- [ ] Mobile responsiveness
- [ ] Loading states and error handling
- [ ] Integration workflows

### **Testing & Deployment**
- [ ] Unit tests for API endpoints
- [ ] Integration tests for playground system
- [ ] Integration tests for like system
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

## 🎨 **Playground Features Summary**

### **Core Playground Capabilities**
- **AI Image Generation:** Create custom images with Seedream V4
- **Image Editing:** Modify and enhance generated images
- **Style Options:** Multiple artistic styles (realistic, artistic, cartoon, anime, fantasy)
- **Aspect Ratios:** Square, landscape, portrait, standard formats
- **Credit System:** Pay-per-generation with subscription tiers
- **Project Management:** Save and organize generation projects
- **Gallery System:** Personal collection of favorite images

### **Integration Benefits**
- **Seamless Workflow:** Playground → Gallery → Moodboard → Showcase
- **Enhanced Creativity:** AI-generated content enhances moodboards
- **Community Sharing:** Showcase AI creations in Instagram-like feed
- **Creator Economy:** Build reputation through unique AI-generated content
- **Subscription Value:** Premium features drive subscription upgrades

This comprehensive implementation plan provides a roadmap for creating a complete creative ecosystem with AI image generation, Instagram-like showcase system with liking functionality, subscription gating, and seamless integration across all platform features.
