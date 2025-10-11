# "User Unknown" Bug Fix

## Problem
Presets were showing "User unknown" or "@unknown" instead of the actual creator's name, even though valid users existed in the database (e.g., user `c231dca2-2973-46f6-98ba-a20c51d71b69`).

## Root Cause

### Database Schema Mismatch
The `presets` table has this foreign key:
```sql
user_id UUID REFERENCES auth.users(id)
```

This means `presets.user_id` → `auth.users.id`

However, the `users_profile` table structure is:
```sql
CREATE TABLE users_profile (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    display_name TEXT,
    handle TEXT,
    ...
)
```

So the relationship chain is:
```
presets.user_id → auth.users.id → users_profile.user_id
```

### The Bug
The API code was incorrectly looking up profiles by **`users_profile.id`** when it should have been using **`users_profile.user_id`**:

```typescript
// ❌ WRONG - Looking by id field
.select('id, display_name, handle, avatar_url')
.in('id', userIds)  // userIds contains auth.users.id values

// ✅ CORRECT - Looking by user_id field
.select('id, user_id, display_name, handle, avatar_url')
.in('user_id', userIds)  // Now matches correctly!
```

## Files Fixed

### 1. `/apps/web/app/api/presets/route.ts`
**Lines 126-137**: Fixed profile lookup to use `user_id` field
```typescript
// Before:
.in('id', userIds)
acc[profile.id] = profile

// After:
.in('user_id', userIds)  // Fixed
acc[profile.user_id] = profile  // Fixed
```

### 2. `/apps/web/app/api/presets/[id]/route.ts`
**Line 174**: Fixed single preset profile lookup
```typescript
// Before:
.eq('id', preset.user_id)

// After:
.eq('user_id', preset.user_id)  // Fixed
```

### 3. `/apps/web/app/api/presets/trending/route.ts`
**Lines 79-133**: Added profile lookup (was hardcoded to "Unknown")
```typescript
// Before:
creator: {
  id: preset.user_id,
  display_name: 'Unknown',  // Always Unknown!
  handle: 'unknown',
  avatar_url: null
}

// After:
// Fetch profiles first, then:
creator: userProfile ? {
  id: userProfile.id,
  display_name: userProfile.display_name || 'Unknown',
  handle: userProfile.handle || 'unknown',
  avatar_url: userProfile.avatar_url
} : { ... fallback ... }
```

## How the Fix Works

### Before (Broken):
```
1. Get presets with user_id = "c231dca2-2973-46f6-98ba-a20c51d71b69"
2. Query: SELECT * FROM users_profile WHERE id IN ("c231dca2-...")
3. No match! (because users_profile.id is a different UUID)
4. Show "Unknown"
```

### After (Fixed):
```
1. Get presets with user_id = "c231dca2-2973-46f6-98ba-a20c51d71b69"
2. Query: SELECT * FROM users_profile WHERE user_id IN ("c231dca2-...")
3. Match found! users_profile.user_id = "c231dca2-..."
4. Show actual display_name from profile ✓
```

## Testing

### Verify the Fix:
1. **Check Database Structure:**
   ```sql
   -- Run the debug script
   psql $DATABASE_URL -f scripts/debug-user-profile.sql
   ```

2. **Test in Browser:**
   - Go to `/presets` page
   - Presets should now show actual creator names
   - No more "User unknown" for valid users

3. **Test Specific User:**
   ```sql
   -- Check if user c231dca2-2973-46f6-98ba-a20c51d71b69 has a profile
   SELECT
       p.name as preset_name,
       up.display_name as creator_name,
       up.handle as creator_handle
   FROM presets p
   JOIN users_profile up ON p.user_id = up.user_id
   WHERE p.user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';
   ```

## Impact

### Affected Endpoints:
- ✅ `GET /api/presets` - List all presets
- ✅ `GET /api/presets/[id]` - Single preset details
- ✅ `GET /api/presets/trending` - Trending presets

### User Experience:
- **Before**: All preset creators showed as "User unknown" / "@unknown"
- **After**: Actual creator names, handles, and avatars display correctly

## Related Issues

### Other Endpoints to Check:
If you see "Unknown" users in other places, check for the same pattern:
```typescript
// Look for this pattern:
.from('users_profile')
.select(...)
.eq('id', someAuthUserId)  // ❌ Wrong if someAuthUserId is from auth.users

// Should be:
.eq('user_id', someAuthUserId)  // ✅ Correct
```

### Common Locations:
- Showcase creators
- Comment authors
- Generation history
- Marketplace listings
- Any user attribution

## Prevention

### Remember the Relationship:
```
auth.users.id
    ↓
users_profile.user_id  ← Use this for lookups!
users_profile.id       ← This is a different UUID (profile's own ID)
```

### When to Use Each:
- **Use `users_profile.user_id`**: When you have an auth user ID (from presets, auth context, etc.)
- **Use `users_profile.id`**: When referencing the profile record itself (likes, follows, etc.)

## Verification Script

Run this to verify all presets now have correct creator info:
```sql
SELECT
    p.name as preset,
    p.user_id as auth_user_id,
    up.id as profile_id,
    up.display_name,
    up.handle,
    CASE
        WHEN up.id IS NULL THEN '❌ Profile missing'
        WHEN up.display_name IS NULL THEN '⚠️  No display name'
        ELSE '✅ Profile found'
    END as status
FROM presets p
LEFT JOIN users_profile up ON p.user_id = up.user_id
WHERE p.user_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 20;
```

## Summary

**Root Cause**: Querying `users_profile` by wrong field (`id` instead of `user_id`)
**Solution**: Use `users_profile.user_id` to match against `presets.user_id`
**Files Changed**: 3 API route files
**Result**: Creators now display correctly! ✨
