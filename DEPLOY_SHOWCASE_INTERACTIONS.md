# Showcase Interactions Deployment Guide

## Overview

This guide covers the deployment of showcase likes and comments functionality. The UI is already fully implemented and functional - we just need to create the database tables to support it.

## Discovery

The showcase like API exists at [apps/web/app/api/showcases/[id]/like/route.ts](apps/web/app/api/showcases/[id]/like/route.ts) and the UI component [ShowcaseFeed.tsx](apps/web/components/ShowcaseFeed.tsx) already implements like functionality, but the required database tables were missing.

**Evidence:**
- Line 84-86 in like API: `await supabase.from('showcase_likes').insert({ showcase_id, user_id })`
- Line 92-120 in ShowcaseFeed: `handleLike` function fully implemented
- Line 232 in showcases route: `comments_count: 0, // TODO: Implement comments`

## Deployment Steps

### Step 1: Run Showcase Interactions Migration

This creates the required tables and activates notification triggers.

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20251008000013_create_showcase_interactions.sql
```

**What it creates:**
- `showcase_likes` table with RLS policies
- `showcase_comments` table with nested reply support (parent_id)
- Count update triggers for `showcases.likes_count` and `comments_count`
- Activates notification triggers for showcase_liked and showcase_comment events

### Step 2: (Optional) Run Cleanup Migration

This removes unused follower notification functions but keeps showcase functions.

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20251008000012_cleanup_unused_social_notifications.sql
```

**What it does:**
- Removes `notify_new_follower()` function (we don't have followers)
- Removes `notify_profile_incomplete()` function (not used)
- **KEEPS** `notify_showcase_liked()` and `notify_showcase_comment()` functions
- Expected result: 14 notification functions remain

### Step 3: Test Showcase Likes

1. **Navigate to showcases page:**
   - Visit `/showcases` or any showcase feed
   - Ensure you're logged in

2. **Like a showcase:**
   - Click the heart icon on any showcase card
   - Verify the like count increments
   - Verify the heart icon fills/animates

3. **Unlike a showcase:**
   - Click the filled heart icon again
   - Verify the like count decrements
   - Verify the heart icon unfills

4. **Check notifications:**
   - As the showcase creator, verify you receive a notification when someone likes your showcase
   - Notification should include: liker's name, showcase title, and link

### Step 4: Verify Database State

```sql
-- Check showcase_likes table exists
SELECT COUNT(*) FROM showcase_likes;

-- Check showcase_comments table exists
SELECT COUNT(*) FROM showcase_comments;

-- Verify notification triggers are active
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_showcase_liked', 'trigger_notify_showcase_comment');

-- Expected: 2 rows showing both triggers on showcase_likes and showcase_comments
```

## Table Structures

### showcase_likes

```sql
CREATE TABLE showcase_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(showcase_id, user_id)
);
```

**RLS Policies:**
- Anyone can view likes on public showcases
- Users can like/unlike showcases
- Users can only delete their own likes

### showcase_comments

```sql
CREATE TABLE showcase_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES showcase_comments(id) ON DELETE CASCADE, -- For nested replies
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- Anyone can view comments on public showcases
- Users can comment on public showcases
- Users can update/delete their own comments

## Notification Triggers

### showcase_liked notification

**Trigger:** When a user likes a showcase
**Recipients:** Showcase creator (unless they liked their own)
**Notification includes:**
- Liker's name and profile link
- Showcase title and link
- Action: "liked your showcase"

### showcase_comment notification

**Trigger:** When a user comments on a showcase
**Recipients:**
- Showcase creator (unless they commented themselves)
- Parent comment author (if replying to a comment)
**Notification includes:**
- Commenter's name and profile link
- Comment preview (first 100 chars)
- Showcase title and link
- Action: "commented on your showcase" or "replied to your comment"

## Expected Behavior

### Like Flow
1. User clicks heart icon → POST to `/api/showcases/[id]/like`
2. API inserts into `showcase_likes` table
3. `update_showcase_likes_count()` trigger fires → increments `showcases.likes_count`
4. `notify_showcase_liked()` trigger fires → creates notification for showcase creator
5. API returns updated like count and is_liked status
6. UI updates heart icon and count

### Comment Flow (Future)
1. User submits comment → POST to `/api/showcases/[id]/comments`
2. API inserts into `showcase_comments` table
3. `update_showcase_comments_count()` trigger fires → increments `showcases.comments_count`
4. `notify_showcase_comment()` trigger fires → creates notification for creator/parent author
5. API returns new comment data
6. UI renders new comment

## Migration Dependencies

**Required before running:**
- Migration 20251008000004 (creates notify_showcase_liked function)
- Migration 20251008000004 (creates notify_showcase_comment function)
- `showcases` table must exist (it does)

**Optional to run after:**
- Migration 20251008000012 (cleanup unused functions)

## Rollback Plan

If issues arise:

```sql
-- Disable triggers
DROP TRIGGER IF EXISTS trigger_notify_showcase_liked ON showcase_likes;
DROP TRIGGER IF EXISTS trigger_notify_showcase_comment ON showcase_comments;
DROP TRIGGER IF EXISTS trigger_update_showcase_likes_count_insert ON showcase_likes;
DROP TRIGGER IF EXISTS trigger_update_showcase_likes_count_delete ON showcase_likes;
DROP TRIGGER IF EXISTS trigger_update_showcase_comments_count_insert ON showcase_comments;
DROP TRIGGER IF EXISTS trigger_update_showcase_comments_count_delete ON showcase_comments;

-- Drop tables
DROP TABLE IF EXISTS showcase_comments CASCADE;
DROP TABLE IF EXISTS showcase_likes CASCADE;

-- Remove columns from showcases
ALTER TABLE showcases DROP COLUMN IF EXISTS likes_count;
ALTER TABLE showcases DROP COLUMN IF EXISTS comments_count;
```

## Testing Checklist

- [ ] Showcase like button visible in feed
- [ ] Can like a showcase (heart fills)
- [ ] Like count increments
- [ ] Can unlike a showcase (heart unfills)
- [ ] Like count decrements
- [ ] Cannot like own showcase (optional - currently allowed)
- [ ] Showcase creator receives notification when liked
- [ ] Notification includes correct liker name and showcase title
- [ ] Notification links work correctly
- [ ] Like state persists on page refresh
- [ ] Like state syncs across multiple showcases of same creator

## UI Components Already Implemented

✅ **ShowcaseFeed.tsx** - Like button with handleLike function
✅ **ShowcaseSection.tsx** - Displays likes_count and comments_count
✅ **Showcase detail page** - Shows like and comment counts
✅ **Like API route** - `/api/showcases/[id]/like/route.ts`

## Next Steps After Deployment

1. **Implement Comments UI:**
   - Create comment input component
   - Create comment list component with nested replies
   - Add comment API route at `/api/showcases/[id]/comments`

2. **Add Comment Reactions:**
   - Allow reactions on comments (optional)
   - Update notification triggers for reactions

3. **Real-time Updates:**
   - Re-enable real-time subscription for notifications
   - Add real-time like/comment count updates

## Status

- [x] Database tables designed
- [x] Migration created (20251008000013)
- [x] Notification functions verified (already exist from migration 004)
- [x] UI components verified (already implemented)
- [x] Like API verified (already implemented)
- [ ] **READY TO DEPLOY** - Run migration 20251008000013

---

**Deployment Date:** _Pending_
**Deployed By:** _Pending_
**Verification Status:** _Pending_
