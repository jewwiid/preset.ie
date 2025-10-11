# How Presets Become Featured - Complete Guide

## Overview
Your system has a **featured approval workflow** where creators request their presets to be featured, and admins approve/reject those requests.

## The Featured System Architecture

### 1. Database Tables

#### **`presets` table**
```sql
is_featured BOOLEAN DEFAULT false
```
- Simple boolean flag
- When `true`, preset shows "⭐ Featured" badge
- Can only be set to `true` through admin approval process

#### **`preset_featured_requests` table**
Tracks the approval workflow:
```sql
- id (UUID)
- preset_id (UUID) → references presets.id
- requester_user_id (UUID) → who requested it
- status (TEXT) → 'pending', 'approved', 'rejected'
- requested_at (TIMESTAMP)
- reviewed_at (TIMESTAMP)
- reviewer_user_id (UUID) → which admin reviewed it
- admin_notes (TEXT) → optional notes from admin
```

### 2. The Approval Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Creator Requests Feature Status                     │
│ POST /api/presets/featured-requests                         │
│ Body: { preset_id }                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Database: Insert into preset_featured_requests              │
│ - status: 'pending'                                         │
│ - requester_user_id: current user                          │
│ - requested_at: now()                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Admin Reviews Request                               │
│ GET /api/presets/featured-requests?status=pending          │
│ (Admin sees list of pending requests)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Admin Approves or Rejects                           │
│ PUT /api/presets/featured-requests/[id]                    │
│ Body: { status: 'approved', admin_notes: '...' }           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ If APPROVED:                                                │
│ 1. Update preset_featured_requests:                        │
│    - status = 'approved'                                    │
│    - reviewed_at = now()                                    │
│    - reviewer_user_id = admin's id                         │
│                                                             │
│ 2. Update presets table:                                   │
│    - is_featured = TRUE ✅                                  │
│                                                             │
│ If REJECTED:                                                │
│ 1. Update preset_featured_requests:                        │
│    - status = 'rejected'                                    │
│    - reviewed_at = now()                                    │
│    - reviewer_user_id = admin's id                         │
│                                                             │
│ 2. Preset remains is_featured = FALSE                      │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### For Creators

#### **Request Featured Status**
```typescript
POST /api/presets/featured-requests
Headers: Authorization: Bearer {token}
Body: {
  "preset_id": "uuid-here"
}

Response: {
  "id": "request-uuid",
  "preset_id": "preset-uuid",
  "status": "pending",
  "requested_at": "2025-01-08T..."
}
```

#### **Check Request Status**
```typescript
GET /api/presets/{preset_id}/featured-status
Headers: Authorization: Bearer {token}

Response: {
  "status": "pending" | "approved" | "rejected" | null,
  "requested_at": "2025-01-08T...",
  "reviewed_at": "2025-01-09T..." | null,
  "admin_notes": "Looks great!" | null,
  "is_featured": false | true
}
```

### For Admins

#### **List All Requests (with filter)**
```typescript
GET /api/presets/featured-requests?status=pending
Headers: Authorization: Bearer {admin-token}

Response: [
  {
    "id": "request-uuid",
    "preset_id": "preset-uuid",
    "status": "pending",
    "requested_at": "2025-01-08T...",
    "requester": {
      "id": "user-uuid",
      "display_name": "John Doe",
      "handle": "johndoe"
    },
    "preset": {
      "id": "preset-uuid",
      "name": "Cinematic Portrait",
      "description": "...",
      "category": "portrait",
      "is_featured": false
    }
  }
]
```

#### **Approve or Reject Request**
```typescript
PUT /api/presets/featured-requests/{request_id}
Headers: Authorization: Bearer {admin-token}
Body: {
  "status": "approved" | "rejected",
  "admin_notes": "Optional feedback message"
}

Response: {
  "id": "request-uuid",
  "status": "approved",
  "reviewed_at": "2025-01-09T...",
  "admin_notes": "Excellent quality!"
}
```

## Current State Check

To see how many featured presets exist:

```sql
-- Count featured presets
SELECT COUNT(*) as featured_count
FROM presets
WHERE is_featured = true;

-- List all featured presets
SELECT id, name, category, usage_count, created_at
FROM presets
WHERE is_featured = true
ORDER BY created_at DESC;

-- Check pending featured requests
SELECT COUNT(*) as pending_requests
FROM preset_featured_requests
WHERE status = 'pending';
```

## Who Can Feature Presets?

### Creators Can:
- ✅ Request their own presets to be featured
- ✅ Check the status of their request
- ❌ Cannot directly set `is_featured = true`

### Admins Can:
- ✅ View all featured requests (pending, approved, rejected)
- ✅ Approve requests → sets `is_featured = true`
- ✅ Reject requests → keeps `is_featured = false`
- ✅ Add admin notes to explain decision
- ✅ Directly set `is_featured = true` via database (bypass workflow)

### System/Database Can:
- ✅ Directly set `is_featured = true` for system presets
- Used for initial seed data or special promotional presets

## Benefits of This System

### For Creators:
- ✅ Transparent process (can track request status)
- ✅ Fair opportunity to get featured
- ✅ No direct manipulation of featured status

### For Platform:
- ✅ Quality control (admin approval required)
- ✅ Audit trail (who requested, who approved, when)
- ✅ Can add feedback/notes for rejected requests
- ✅ Prevents abuse (creators can't spam featured status)

### For Users:
- ✅ Featured presets are curated/high-quality
- ✅ Trustworthy recommendations
- ✅ Clear visual indicator (⭐ Featured badge)

## UI Implementation

### On Preset Detail Page
```typescript
// Check if user can request featured status
if (isCreator && !preset.is_featured && !hasPendingRequest) {
  // Show "Request Featured" button
}

if (isCreator && hasPendingRequest) {
  // Show "Request Pending" badge
}

if (preset.is_featured) {
  // Show "⭐ Featured" badge
}
```

### On Admin Dashboard
```typescript
// Show pending requests with approve/reject buttons
featuredRequests.map(request => (
  <RequestCard
    preset={request.preset}
    requester={request.requester}
    onApprove={() => approveFeaturedRequest(request.id)}
    onReject={() => rejectFeaturedRequest(request.id)}
  />
))
```

## Recommended: Featured Presets First

Yes, featured presets should be shown first! Here's why:

### Benefits:
- ✅ **Curated Content First**: Users see high-quality, admin-approved presets
- ✅ **Social Proof**: Featured badge indicates quality/popularity
- ✅ **Incentive for Creators**: Encourages quality submissions
- ✅ **Better Discovery**: Best presets are immediately visible

### Implementation Options:

#### **Option 1: Featured Section (Recommended)**
```typescript
// Separate featured presets into their own section
<div>
  {/* Featured Presets Section */}
  {featuredPresets.length > 0 && (
    <section>
      <h2>⭐ Featured Presets</h2>
      <PresetGrid presets={featuredPresets} />
    </section>
  )}

  {/* All Presets Section */}
  <section>
    <h2>All Presets</h2>
    <PresetGrid presets={regularPresets} />
  </section>
</div>
```

#### **Option 2: Priority Sort**
```typescript
// Sort featured presets to top of list
const sortedPresets = [...presets].sort((a, b) => {
  // Featured presets always come first
  if (a.is_featured && !b.is_featured) return -1
  if (!a.is_featured && b.is_featured) return 1

  // Within each group, sort by selected criteria (popular, new, etc.)
  return sortBySelectedCriteria(a, b)
})
```

#### **Option 3: Tab-Based**
```typescript
<Tabs>
  <TabsList>
    <TabsTrigger value="featured">⭐ Featured</TabsTrigger>
    <TabsTrigger value="all">All Presets</TabsTrigger>
    <TabsTrigger value="new">New</TabsTrigger>
    <TabsTrigger value="popular">Popular</TabsTrigger>
  </TabsList>

  <TabsContent value="featured">
    <PresetGrid presets={featuredPresets} />
  </TabsContent>

  <TabsContent value="all">
    <PresetGrid presets={allPresets} />
  </TabsContent>
</Tabs>
```

## Next Steps

### To Implement Featured-First Sorting:

1. **Update `/api/presets` route** to sort featured first
2. **Update frontend** to show featured section or sort featured to top
3. **Add filter/tab** for "Featured Only" view
4. **Highlight featured presets** with more prominent styling

Would you like me to implement any of these options?

## Summary

**How Presets Become Featured:**
1. ✅ Creator requests featured status via API
2. ✅ Admin reviews request in admin dashboard
3. ✅ Admin approves → `is_featured = true`
4. ✅ OR Admin rejects → stays `false`

**Should Featured Be First:**
- ✅ **YES!** Featured presets are curated, high-quality content
- ✅ Better user experience seeing best presets first
- ✅ Incentivizes creators to make quality presets
- ✅ Standard pattern across most platforms (marketplace, galleries, etc.)

Let's implement featured-first sorting now! 🚀
