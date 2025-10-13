# Image Metadata Editing Implementation

**Date:** 2025-01-12
**Status:** READY FOR IMPLEMENTATION
**Priority:** HIGH

---

## Problem Statement

Currently, the `MediaMetadataModal` popup shows image metadata (title, description, technical details) but **does NOT allow users to edit the title and description**. This means:

❌ Users cannot set custom titles for their images
❌ Users cannot add descriptions to their images
❌ Image metadata is not editable after creation
❌ Images show generic or auto-generated titles everywhere

---

## Current State Analysis

### Database Schema ✅ READY
The `showcase_media` table already supports title/description:

```sql
CREATE TABLE showcase_media (
  id UUID PRIMARY KEY,
  showcase_id UUID REFERENCES showcases(id),
  moodboard_item_id UUID REFERENCES moodboard_items(id),
  image_url TEXT NOT NULL,
  title TEXT,              -- ✅ Already exists
  description TEXT,        -- ✅ Already exists
  tags TEXT[],
  order_index INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### UI Component - MediaMetadataModal.tsx
**Location:** `apps/web/app/components/MediaMetadataModal.tsx`

**Current Behavior:**
- Lines 593-606: Displays title and description as READ-ONLY text
- No input fields for editing
- No save button for metadata changes

```typescript
// Current code (READ-ONLY):
<div className="flex items-start gap-2 mb-2">
  <span className="text-sm font-medium text-muted-foreground min-w-[60px]">Title:</span>
  <span className="text-sm font-semibold text-foreground">
    "{(media as any).title || showcase.caption || 'Untitled'}"
  </span>
</div>
```

### API Endpoints
**Missing:** No API endpoint to update `showcase_media` title/description

---

## Implementation Plan

### Phase 1: Add Editing UI to MediaMetadataModal (30 min)

1. **Add Edit Mode State**
```typescript
const [isEditingMetadata, setIsEditingMetadata] = useState(false)
const [editedTitle, setEditedTitle] = useState('')
const [editedDescription, setEditedDescription] = useState('')
const [isSavingMetadata, setIsSavingMetadata] = useState(false)
```

2. **Replace Display with Editable Fields**
```typescript
{isEditingMetadata ? (
  // Edit mode
  <div className="space-y-3">
    <div>
      <Label htmlFor="image-title">Title</Label>
      <Input
        id="image-title"
        value={editedTitle}
        onChange={(e) => setEditedTitle(e.target.value)}
        placeholder="Enter image title..."
        maxLength={200}
      />
    </div>
    <div>
      <Label htmlFor="image-description">Description</Label>
      <Textarea
        id="image-description"
        value={editedDescription}
        onChange={(e) => setEditedDescription(e.target.value)}
        placeholder="Enter image description..."
        rows={4}
        maxLength={1000}
      />
    </div>
    <div className="flex gap-2">
      <Button onClick={handleSaveMetadata} disabled={isSavingMetadata}>
        {isSavingMetadata ? 'Saving...' : 'Save Changes'}
      </Button>
      <Button variant="outline" onClick={handleCancelEdit}>
        Cancel
      </Button>
    </div>
  </div>
) : (
  // View mode with Edit button
  <div className="space-y-2">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <span className="text-sm font-medium text-muted-foreground">Title:</span>
        <p className="text-sm font-semibold text-foreground">
          {editedTitle || 'Untitled'}
        </p>
      </div>
      {canEdit && (
        <Button variant="ghost" size="sm" onClick={() => setIsEditingMetadata(true)}>
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
    {editedDescription && (
      <div>
        <span className="text-sm font-medium text-muted-foreground">Description:</span>
        <p className="text-sm text-muted-foreground">{editedDescription}</p>
      </div>
    )}
  </div>
)}
```

3. **Add Permission Check**
```typescript
// Only allow editing if user owns the showcase
const canEdit = user && showcase?.creator?.user_id === user.id
```

### Phase 2: Create API Endpoint (20 min)

**File:** `apps/web/app/api/showcase-media/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * PATCH /api/showcase-media/[id]
 * Update showcase media title and description
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id;
    const body = await request.json();
    const { title, description } = body;

    // Validate
    if (!title && !description) {
      return NextResponse.json(
        { error: 'At least one field (title or description) is required' },
        { status: 400 }
      );
    }

    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get showcase media to verify ownership
    const { data: showcaseMedia, error: fetchError } = await supabaseAdmin
      .from('showcase_media')
      .select(`
        id,
        showcase_id,
        showcases!inner(creator_user_id)
      `)
      .eq('id', mediaId)
      .single();

    if (fetchError || !showcaseMedia) {
      return NextResponse.json(
        { error: 'Showcase media not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (showcaseMedia.showcases.creator_user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this image' },
        { status: 403 }
      );
    }

    // Update metadata
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('showcase_media')
      .update(updateData)
      .eq('id', mediaId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating showcase media:', updateError);
      return NextResponse.json(
        { error: 'Failed to update image metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Image metadata updated successfully'
    });

  } catch (error) {
    console.error('Error in showcase-media PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/showcase-media/[id]
 * Get showcase media details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id;

    const { data, error } = await supabaseAdmin
      .from('showcase_media')
      .select(`
        *,
        showcases!inner(
          id,
          caption,
          creator_user_id,
          users_profile!inner(
            display_name,
            handle
          )
        )
      `)
      .eq('id', mediaId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Showcase media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in showcase-media GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Phase 3: Implement Save Handler (15 min)

Add to `MediaMetadataModal.tsx`:

```typescript
const handleSaveMetadata = async () => {
  if (!media.id) {
    showError('Cannot update: Media ID not found');
    return;
  }

  setIsSavingMetadata(true);

  try {
    const response = await fetch(`/api/showcase-media/${media.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        title: editedTitle.trim(),
        description: editedDescription.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update metadata');
    }

    const result = await response.json();

    showSuccess('Image metadata updated successfully!');
    setIsEditingMetadata(false);

    // Optionally refresh the showcase data or trigger a callback
    if (onMetadataUpdated) {
      onMetadataUpdated(result.data);
    }

  } catch (error: any) {
    console.error('Error saving metadata:', error);
    showError('Failed to save changes', error.message);
  } finally {
    setIsSavingMetadata(false);
  }
};

const handleCancelEdit = () => {
  // Reset to original values
  setEditedTitle((media as any).title || showcase?.caption || '');
  setEditedDescription((media as any).description || '');
  setIsEditingMetadata(false);
};
```

### Phase 4: Propagate Changes Across References (10 min)

Ensure title/description updates appear everywhere:

1. **ShowcaseFeed** - Refresh after edit
2. **Moodboard** - Update display name
3. **Profile showcases** - Update card text
4. **Search results** - Update metadata

Add callback prop to MediaMetadataModal:

```typescript
interface MediaMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: {...};
  showcase?: {...};
  onMetadataUpdated?: (updated: any) => void; // NEW
}
```

---

## Testing Checklist

### Manual Testing

- [ ] Open MediaMetadataModal for an image you own
- [ ] Click Edit button (should appear for owned images)
- [ ] Edit title and description
- [ ] Click Save - should show success message
- [ ] Close modal and reopen - changes should persist
- [ ] Check image title appears on showcase feed
- [ ] Check image description appears in search results
- [ ] Try editing someone else's image - should show "No permission" error
- [ ] Try editing without being logged in - should show "Unauthorized"

### Database Verification

```sql
-- Check that title and description are being saved
SELECT
  id,
  title,
  description,
  updated_at
FROM showcase_media
WHERE id = '<test-media-id>'
ORDER BY updated_at DESC;

-- Verify ownership is checked
SELECT
  sm.id,
  sm.title,
  s.creator_user_id,
  up.display_name
FROM showcase_media sm
JOIN showcases s ON s.id = sm.showcase_id
JOIN users_profile up ON up.user_id = s.creator_user_id
WHERE sm.id = '<test-media-id>';
```

### Edge Cases

- [ ] Very long titles (200+ characters) - should truncate
- [ ] Very long descriptions (1000+ characters) - should truncate
- [ ] Special characters in title/description (emoji, unicode)
- [ ] Empty title - should allow (shows "Untitled")
- [ ] Empty description - should allow (hides description field)
- [ ] Concurrent edits by same user - last write wins
- [ ] Network failure during save - should show error

---

## Files to Create/Modify

### New Files (1)
1. `apps/web/app/api/showcase-media/[id]/route.ts` - API endpoint

### Modified Files (1)
2. `apps/web/app/components/MediaMetadataModal.tsx` - Add editing UI

### Optional Enhancements
3. `apps/web/components/ShowcaseFeed.tsx` - Add refresh callback
4. `apps/web/app/showcases/[id]/page.tsx` - Handle metadata updates

---

## Database Migration

**Status:** ✅ NO MIGRATION NEEDED

The `showcase_media` table already has `title` and `description` columns. However, we should add an index for better performance:

```sql
-- Optional performance optimization
CREATE INDEX IF NOT EXISTS idx_showcase_media_showcase_id
ON showcase_media(showcase_id);

CREATE INDEX IF NOT EXISTS idx_showcase_media_title
ON showcase_media(title) WHERE title IS NOT NULL;
```

---

## Security Considerations

✅ **Permission Checks:**
- Users can only edit their own images
- Authorization verified via JWT token
- Ownership checked via `showcase.creator_user_id`

✅ **Input Validation:**
- Title max length: 200 characters
- Description max length: 1000 characters
- HTML/script injection prevented (use textContent, not innerHTML)

✅ **Rate Limiting:**
- Consider adding rate limit for metadata updates (max 10/minute per user)

---

## Deployment Checklist

- [ ] Create API endpoint
- [ ] Update MediaMetadataModal component
- [ ] Test locally with real showcase data
- [ ] Deploy to staging
- [ ] Test on staging with multiple users
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours
- [ ] Gather user feedback

---

## Future Enhancements

1. **Bulk Edit** - Edit title/description for multiple images at once
2. **AI-Generated Descriptions** - Auto-generate descriptions from image content
3. **Version History** - Track changes to title/description over time
4. **Tags Editing** - Add UI to edit `tags` array field
5. **Alt Text** - Add alt text field for accessibility
6. **SEO Optimization** - Use title/description for meta tags

---

## Success Criteria

✅ Users can edit image titles
✅ Users can edit image descriptions
✅ Changes persist across page refreshes
✅ Changes appear everywhere image is referenced
✅ Only image owners can edit their images
✅ No performance degradation
✅ No security vulnerabilities introduced

---

**Status: READY FOR IMPLEMENTATION** 🚀

**Estimated Time:** ~1.5 hours
**Priority:** HIGH - User-requested feature
**Impact:** Improves user control over their content
