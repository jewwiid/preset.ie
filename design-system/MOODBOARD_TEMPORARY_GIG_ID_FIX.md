# Moodboard Temporary Gig ID Fix

## Issue
Moodboard saving was failing with PostgreSQL UUID validation error when trying to save moodboards for temporary gigs.

### Error Details
```
Save error: 
Object { code: "22P02", details: null, hint: null, message: 'invalid input syntax for type uuid: "temp-1758330023818-suqew2fd6"' }
```

## Root Cause
The `MoodboardBuilder` component was attempting to insert the temporary gig ID (`"temp-1758330023818-suqew2fd6"`) into the `gig_id` field of the `moodboards` table. However, the `gig_id` field expects a valid UUID format, and the temporary ID format was not compatible with PostgreSQL's UUID type.

## Solution
Modified the moodboard creation logic in `MoodboardBuilder.tsx` to conditionally include the `gig_id` field only when it's a valid UUID:

### Code Changes
```typescript
// Create new moodboard
const moodboardData: any = {
  owner_user_id: profile.id,
  title: title || 'Untitled Moodboard',
  summary: description,
  items,
  palette
}

// Only include gig_id if it's a valid UUID (not a temporary ID)
if (gigId && !gigId.startsWith('temp-') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gigId)) {
  moodboardData.gig_id = gigId
}

const { data: newMoodboard, error: createError } = await supabase
  .from('moodboards')
  .insert(moodboardData)
  .select()
  .single()
```

### Validation Logic
1. **Check if gigId exists**: `gigId &&`
2. **Check if it's not a temporary ID**: `!gigId.startsWith('temp-')`
3. **Validate UUID format**: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gigId)`

## Benefits
- ✅ **Fixes Saving Issues**: Moodboards can now be saved for temporary gigs
- ✅ **Maintains Data Integrity**: Only valid UUIDs are stored in the database
- ✅ **Backward Compatibility**: Existing moodboards with valid gig IDs continue to work
- ✅ **Flexible Architecture**: Supports both temporary and permanent gig workflows

## Database Schema Impact
- The `gig_id` field in the `moodboards` table remains nullable, allowing moodboards to exist without being associated with a specific gig
- This is appropriate for temporary gig creation workflows where the gig hasn't been permanently saved yet

## Testing
To verify the fix:
1. Create a new gig (which uses temporary IDs)
2. Navigate to the moodboard creation step
3. Create and save a moodboard
4. Verify that the moodboard saves successfully without UUID errors
5. Check that the moodboard appears correctly in the review step

## Related Files
- `apps/web/app/components/MoodboardBuilder.tsx` - Main fix implementation
- `apps/web/app/gigs/create/page.tsx` - Temporary gig ID generation
- `supabase/migrations/001_initial_schema.sql` - Database schema definition
