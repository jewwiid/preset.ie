# Gig Status Enum Fix ✅

## Problem
The application was trying to fetch gigs with status "CLOSED" but the database enum only accepts "APPLICATIONS_CLOSED". This caused a 400 Bad Request error:

```
GET https://zbsmgymyfhnwjdnmlelr.supabase.co/rest/v1/gigs?select=*&owner_user_i…e0f9627-3852-4501-b18f-f98739812c4f&order=created_at.desc&status=eq.CLOSED 400 (Bad Request)

{code: '22P02', details: null, hint: null, message: 'invalid input value for enum gig_status: "CLOSED"'}
```

## Root Cause
In `apps/web/app/gigs/my-gigs/page.tsx`, the filter logic was converting the UI filter "closed" to uppercase "CLOSED", but the database enum expects "APPLICATIONS_CLOSED".

**Valid Database Enum Values**:
- `DRAFT`
- `PUBLISHED` 
- `APPLICATIONS_CLOSED`
- `BOOKED`
- `COMPLETED`
- `CANCELLED`

## Solution

### 1. Fixed Filter Mapping ✅
**File**: `apps/web/app/gigs/my-gigs/page.tsx`

**Before**:
```typescript
// Apply filter
if (filter !== 'all') {
  query = query.eq('status', filter.toUpperCase())
}
```

**After**:
```typescript
// Apply filter
if (filter !== 'all') {
  // Map UI filter values to database enum values
  const statusMap: Record<string, string> = {
    'draft': 'DRAFT',
    'published': 'PUBLISHED', 
    'closed': 'APPLICATIONS_CLOSED'  // Map 'closed' to 'APPLICATIONS_CLOSED'
  }
  query = query.eq('status', statusMap[filter])
}
```

### 2. Enhanced Status Color Function ✅
Updated `getStatusColor()` to handle both `APPLICATIONS_CLOSED` and `closed` for backward compatibility:

```typescript
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'published':
      return 'bg-primary-100 text-primary-800'
    case 'draft':
      return 'bg-muted text-muted-foreground'
    case 'applications_closed':
    case 'closed':  // Keep for backward compatibility
      return 'bg-destructive-100 text-destructive-800'
    case 'completed':
      return 'bg-primary-100 text-primary-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}
```

### 3. Added Status Formatting Function ✅
Created `formatStatus()` to display user-friendly status text:

```typescript
const formatStatus = (status: string) => {
  switch (status) {
    case 'APPLICATIONS_CLOSED':
      return 'Closed'
    case 'PUBLISHED':
      return 'Published'
    case 'DRAFT':
      return 'Draft'
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}
```

### 4. Updated Status Display ✅
Changed the status display to use the formatted text:

**Before**:
```typescript
<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gig.status)}`}>
  {gig.status}
</span>
```

**After**:
```typescript
<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gig.status)}`}>
  {formatStatus(gig.status)}
</span>
```

## Benefits

1. ✅ **Fixed API Error**: No more 400 Bad Request errors when filtering by closed gigs
2. ✅ **Proper Enum Mapping**: UI filters correctly map to database enum values
3. ✅ **Better UX**: Status displays as "Closed" instead of "APPLICATIONS_CLOSED"
4. ✅ **Backward Compatibility**: Still handles old "closed" values if they exist
5. ✅ **Consistent Styling**: Proper color coding for all status types

## Database Schema Reference

The `gig_status` enum in the database is defined as:
```sql
CREATE TYPE gig_status AS ENUM (
  'DRAFT', 
  'PUBLISHED', 
  'APPLICATIONS_CLOSED', 
  'BOOKED', 
  'COMPLETED', 
  'CANCELLED'
);
```

## Files Modified

- `apps/web/app/gigs/my-gigs/page.tsx` - Fixed filter mapping and status display

## Testing

The fix ensures that:
- ✅ Filtering by "Closed" gigs works without API errors
- ✅ Status badges display user-friendly text ("Closed" instead of "APPLICATIONS_CLOSED")
- ✅ Proper color coding for all status types
- ✅ Backward compatibility with existing data
