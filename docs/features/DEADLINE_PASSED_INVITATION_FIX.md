# Deadline Passed Invitation Fix ✅

## Problem
Users could send invitations to gigs where the application deadline had already passed, even though the UI showed a warning "⚠️ Applications closed (deadline passed)". This created a confusing UX where users could invite talent to gigs that were no longer accepting applications.

## Root Cause
The invitation dialog showed a warning for passed deadlines but didn't prevent users from selecting and inviting to those gigs. The validation only happened at the UI level (warning) but not at the functional level (disabled selection).

## Solution

### 1. Enhanced UI Logic ✅
**File**: `apps/web/components/gigs/InviteToGigDialog.tsx`

**Changes**:
- Added `isDeadlinePassed` check for each gig
- Combined with existing `hasInvitation` check to create `isDisabled` state
- Disabled gigs with passed deadlines from being selectable

```typescript
const hasInvitation = existingInvitations.has(gig.id)
const isDeadlinePassed = gig.application_deadline && new Date(gig.application_deadline) < new Date()
const isDisabled = hasInvitation || isDeadlinePassed
```

### 2. Visual Improvements ✅

#### Added "Deadline Passed" Badge
```typescript
{isDeadlinePassed && !hasInvitation && (
  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
    ⚠️ Deadline Passed
  </Badge>
)}
```

#### Updated Warning Message
**Before**: "Applications closed (deadline passed)"
**After**: "Cannot invite - application deadline has passed"

#### Disabled State Styling
- Grayed out text for disabled gigs
- Clear visual indication that the gig cannot be selected

### 3. Server-Side Validation ✅
**File**: `apps/web/app/api/gigs/[id]/invitations/route.ts`

**Added deadline check**:
```typescript
// Check if application deadline has passed
if (gig.application_deadline && new Date(gig.application_deadline) < new Date()) {
  return NextResponse.json({
    error: 'Cannot send invitations - application deadline has passed'
  }, { status: 400 });
}
```

**Updated gig data fetching**:
```typescript
.select('owner_user_id, title, status, application_deadline')
```

## User Experience Flow

### Before Fix:
1. ❌ User opens invitation dialog
2. ❌ Sees gig with "⚠️ Applications closed (deadline passed)" warning
3. ❌ Can still select and invite to that gig
4. ❌ Confusing UX - warning suggests it shouldn't work but it does

### After Fix:
1. ✅ User opens invitation dialog
2. ✅ Sees gig with "⚠️ Deadline Passed" badge and grayed out text
3. ✅ Gig is disabled and cannot be selected
4. ✅ Clear message: "Cannot invite - application deadline has passed"
5. ✅ Consistent UX - disabled items cannot be used

## Visual Indicators

### Available Gig:
```
[PUBLISHED] Urban Fashion Gig
📍 Manchester  📅 Oct 15, 2025  💰 Paid
```

### Already Invited Gig:
```
[PUBLISHED] [✓ Already Invited] Urban Fashion Gig
📍 Manchester  📅 Oct 15, 2025  💰 Paid
```

### Deadline Passed Gig:
```
[PUBLISHED] [⚠️ Deadline Passed] Urban Fashion Gig
📍 Manchester  📅 Oct 15, 2025  💰 Paid
📅 Cannot invite - application deadline has passed
```

## Benefits

1. ✅ **Consistent UX**: Disabled items cannot be selected
2. ✅ **Clear Visual Feedback**: Distinct badges for different states
3. ✅ **Server-Side Protection**: API prevents invalid invitations
4. ✅ **Better User Understanding**: Clear messaging about why gigs are unavailable
5. ✅ **Prevents Confusion**: No more invitations to closed applications

## Files Modified

- `apps/web/components/gigs/InviteToGigDialog.tsx` - UI logic and visual improvements
- `apps/web/app/api/gigs/[id]/invitations/route.ts` - Server-side validation

## Testing

The fix ensures that:
- ✅ Gigs with passed deadlines are disabled in the dropdown
- ✅ Clear visual indicators show why gigs are unavailable
- ✅ Server-side validation prevents API-level invitations to passed deadline gigs
- ✅ Consistent behavior between UI warnings and functional restrictions
