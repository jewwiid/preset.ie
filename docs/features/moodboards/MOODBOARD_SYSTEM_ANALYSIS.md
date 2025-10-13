# Moodboard System Analysis

## Overview

After reviewing the moodboard system in the gig creation flow, here's a comprehensive analysis of how moodboards are saved, whether they're temporary or permanent, and how they can be reused.

---

## ✅ Current Implementation Status

### 1. **Moodboard Saving - FULLY IMPLEMENTED**

The system has **both temporary and permanent saving** implemented:

#### **Temporary Storage (During Creation)**
- When creating a gig, a temporary ID is generated: `temp-${Date.now()}-${random}`
- This allows moodboard creation **without** creating a database record first
- Located in [gig create page.tsx:220](apps/web/app/gigs/create/page.tsx#L220)

```typescript
const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

#### **Permanent Storage (After Save)**
Located in [MoodboardBuilder.tsx:1448](apps/web/app/components/MoodboardBuilder.tsx#L1448)

**Two saving modes:**

1. **Regular Moodboard Save** (linked to gig)
   - Saved to `moodboards` table
   - `is_template = false`
   - `gig_id` is set when gig is created
   - ✅ **Permanently saved** to database

2. **Template Save** (reusable)
   - Saved to `moodboards` table
   - `is_template = true`
   - `template_name` and `template_description` set
   - `gig_id` is **NULL** (not tied to any specific gig)
   - ✅ **Permanently saved** as template

---

## 2. **Moodboard Linking to Gigs - FULLY IMPLEMENTED**

When a gig is saved, the moodboard is properly linked:

Located in [gig create page.tsx:293-296](apps/web/app/gigs/create/page.tsx#L293-296)

```typescript
// Update moodboard to link to the real gig ID if one exists
if (formData.moodboardId) {
  await supabase
    .from('moodboards')
    .update({ gig_id: gigId })
    .eq('id', formData.moodboardId)
}
```

✅ **This ensures the moodboard is permanently linked to the gig**

---

## 3. **Moodboard Fetching/Reusing - FULLY IMPLEMENTED**

Users can **import existing moodboards** into new gigs:

Located in [MoodboardStep.tsx:47-66](apps/web/app/components/gig-edit-steps/MoodboardStep.tsx#L47-66)

```typescript
const fetchSavedMoodboards = async () => {
  const { data } = await supabase
    .from('moodboards')
    .select('id, title, summary, items, created_at, updated_at')
    .eq('owner_user_id', user?.id)
    .neq('gig_id', gigId) // Exclude moodboards already attached to this gig
    .order('updated_at', { ascending: false })
    .limit(20)
}
```

✅ **Fetches all saved moodboards (both templates and regular moodboards)**

### Import Flow

Located in [MoodboardStep.tsx:68-109](apps/web/app/components/gig-edit-steps/MoodboardStep.tsx#L68-109)

1. User clicks "Import Existing"
2. Shows list of saved moodboards (excluding current gig's moodboard)
3. User selects a moodboard
4. **Creates a duplicate** for the new gig
5. Links duplicate to new gig

```typescript
const newMoodboard = {
  title: sourceMoodboard.title,
  summary: sourceMoodboard.summary,
  items: sourceMoodboard.items,
  palette: sourceMoodboard.palette,
  owner_user_id: user?.id,
  gig_id: gigId,
  is_template: false
}

await supabase.from('moodboards').insert(newMoodboard)
```

✅ **Creates a new copy so original moodboard is preserved**

---

## 4. **Template System - FULLY IMPLEMENTED**

Database schema from [008b_add_moodboard_templates.sql](supabase/migrations/008b_add_moodboard_templates.sql):

```sql
ALTER TABLE moodboards
ADD COLUMN is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN template_name VARCHAR(255),
ADD COLUMN template_description TEXT;
```

### Save as Template Flow

Located in [MoodboardBuilder.tsx:1438-1446](apps/web/app/components/MoodboardBuilder.tsx#L1438-1446)

**User clicks "Save as Template" toggle:**

```typescript
const moodboardData = {
  owner_user_id: profile.id,
  title: title || 'Untitled Moodboard',
  summary: description,
  items,
  palette,
  tags: selectedTags,
  is_template: saveAsTemplate, // TRUE when saving as template
  template_name: saveAsTemplate ? (templateName || title || 'Untitled Template') : null,
  template_description: saveAsTemplate ? description : null
}

// Only include gig_id if NOT saving as template
if (!saveAsTemplate && gigId && !gigId.startsWith('temp-')) {
  moodboardData.gig_id = gigId
}
```

✅ **Templates are NOT linked to gigs, making them reusable**

---

## 5. **Showcase Integration - PARTIALLY IMPLEMENTED**

Showcases can be created from moodboards, but there's a question about the workflow.

### Current Showcase Schema

From [001_initial_schema.sql](supabase/migrations/001_initial_schema.sql:106-120):

```sql
CREATE TABLE showcases (
    id UUID PRIMARY KEY,
    gig_id UUID REFERENCES gigs(id),
    creator_user_id UUID NOT NULL,
    talent_user_id UUID,
    media_ids UUID[],
    caption TEXT,
    ...
)
```

### How Moodboards Relate to Showcases

**Moodboards** are for **planning/inspiration** before the gig
**Showcases** are for **displaying final results** after the gig

**Current Flow:**
1. Create gig with moodboard (inspiration/reference)
2. Complete gig (actual photoshoot happens)
3. Upload final photos to media table
4. Create showcase with final photos (not moodboard images)

**The moodboard images are NOT automatically transferred to showcases** - and that's correct because:
- Moodboard = Reference/inspiration images
- Showcase = Actual work produced

---

## Summary Table

| Feature | Status | Database Saved | Can Be Fetched | Can Be Reused | Public/Private |
|---------|--------|----------------|----------------|---------------|----------------|
| **Temporary Moodboard** (during creation) | ✅ Working | ❌ No (temp ID only) | N/A | N/A | N/A |
| **Regular Moodboard** (linked to gig) | ✅ Working | ✅ Yes (`moodboards` table) | ✅ Yes | ✅ Yes (via import) | ❌ UI Missing |
| **Template Moodboard** | ✅ Working | ✅ Yes (`is_template=true`) | ✅ Yes | ✅ Yes (via import) | ❌ UI Missing |
| **Moodboard → Gig Linking** | ✅ Working | ✅ Yes (`gig_id` set) | ✅ Yes | N/A | N/A |
| **Import Existing Moodboards** | ✅ Working | ✅ Yes (creates copy) | ✅ Yes | ✅ Yes | N/A |
| **Public/Private Control** | ⚠️ Partial | ✅ DB field exists | ✅ RLS policies exist | N/A | ❌ No UI toggle |
| **Moodboard → Showcase** | ⚠️ Separate | Different purpose | N/A | N/A | N/A |

---

## Key Findings

### ✅ **What's Working Well:**

1. **Permanent Storage**: All saved moodboards are permanently stored in the database
2. **Template System**: Users can save moodboards as reusable templates
3. **Import/Reuse**: Users can import previous moodboards into new gigs
4. **Gig Linking**: Moodboards are properly linked to gigs when saved
5. **Duplicate Creation**: Import creates copies, preserving originals
6. **Temporary IDs**: Allows moodboard creation without database commitment

### ⚠️ **Potential Issues:**

1. **Temporary Moodboards Lost**: If user doesn't save, moodboard is lost
   - **Mitigation**: Could add auto-save to drafts

2. **No Moodboard Page**: The system assumes moodboards are accessed through:
   - Gig creation flow
   - Import dialog in new gigs
   - **Missing**: Dedicated `/moodboards` page to browse all saved moodboards/templates

3. **Template Discovery**: Templates are mixed with regular moodboards in import
   - **Improvement**: Could separate templates into dedicated tab/section

4. **❌ Privacy Control Missing in UI**: Database has `is_public` field but UI doesn't have toggle
   - **Database Schema**: ✅ `is_public BOOLEAN DEFAULT false` exists (from [007_complete_moodboard_schema.sql](supabase/migrations/007_complete_moodboard_schema.sql#L6))
   - **RLS Policies**: ✅ "Public moodboards are viewable by everyone" policy exists
   - **UI Toggle**: ❌ **MISSING** in MoodboardBuilder component
   - **Current Behavior**: All moodboards are private by default (is_public = false)
   - **Impact**: Users cannot make moodboards public for sharing/inspiration
   - **Fix Required**: Add public/private toggle in save dialog

---

## Recommended Improvements

### 1. **Add Dedicated Moodboards Page** 🆕

Create `/moodboards` page to:
- Browse all user's moodboards
- Filter by templates vs gig-specific
- Edit/delete moodboards
- Create standalone moodboards (not tied to gigs)
- Use as gallery/inspiration library

### 2. **Auto-Save During Creation** 🆕

Implement auto-save for temporary moodboards:
```typescript
// Save as draft every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (items.length > 0 && !moodboardId) {
      saveMoodboardAsDraft()
    }
  }, 30000)
  return () => clearInterval(interval)
}, [items])
```

### 3. **Template Gallery** 🆕

Add dedicated template browsing:
- Separate "Templates" tab in import dialog
- Template preview cards with descriptions
- Filter templates by tags/style

### 4. **Moodboard Search** 🆕

Add search functionality:
```typescript
const searchMoodboards = async (query: string) => {
  const { data } = await supabase
    .from('moodboards')
    .select('*')
    .eq('owner_user_id', user.id)
    .or(`title.ilike.%${query}%,template_name.ilike.%${query}%`)
}
```

### 5. **🔴 CRITICAL: Add Public/Private Toggle** 🆕

**Status**: Database ready, UI missing

The database already supports public/private moodboards but there's no UI control:

```typescript
// Add to MoodboardBuilder.tsx state
const [isPublic, setIsPublic] = useState(false)

// Add toggle in save dialog (alongside "Save as Template")
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={isPublic}
    onChange={(e) => setIsPublic(e.target.checked)}
    className="rounded"
  />
  <label>Make this moodboard public (visible to everyone)</label>
</div>

// Update saveMoodboard function
const moodboardData = {
  ...existingFields,
  is_public: isPublic  // Add this field
}
```

**Use Cases:**
- Share inspiration moodboards with community
- Allow others to discover and import your templates
- Build portfolio of public moodboards
- Keep private moodboards for personal/client work

**RLS Already Configured:**
```sql
-- From migration 007_complete_moodboard_schema.sql
CREATE POLICY "Public moodboards are viewable by everyone"
  ON public.moodboards
  FOR SELECT USING (is_public = true);
```

---

## API Endpoints to Create

### 1. **GET /api/moodboards**
Get all user's moodboards (paginated)

```typescript
GET /api/moodboards?page=1&limit=20&type=template
```

### 2. **GET /api/moodboards/templates**
Get only templates for quick access

```typescript
GET /api/moodboards/templates
```

### 3. **POST /api/moodboards/duplicate**
Duplicate a moodboard/template

```typescript
POST /api/moodboards/duplicate
Body: { moodboard_id: "uuid", new_gig_id?: "uuid" }
```

### 4. **DELETE /api/moodboards/[id]**
Delete a moodboard (if not linked to completed gig)

```typescript
DELETE /api/moodboards/[id]
```

---

## Conclusion

**YES**, moodboards are being saved properly! The system is fully functional:

✅ **Moodboards are permanently saved** to the database
✅ **Templates can be created** and reused across gigs
✅ **Import functionality works** to reuse existing moodboards
✅ **Gig linking is automatic** when gig is created
✅ **Data is persistent** and can be fetched later

**Missing Pieces:**
1. A dedicated `/moodboards` page for browsing and managing all saved moodboards
2. **🔴 CRITICAL**: Public/Private toggle in UI (database ready, just needs UI component)

**Next Steps (Priority Order):**
1. **🔴 HIGH PRIORITY**: Add public/private toggle to MoodboardBuilder UI
2. Create `/moodboards` page for browsing/managing
3. Add auto-save for temporary moodboards
4. Improve template discovery/filtering
5. Add search functionality

**Quick Win**: The public/private toggle is the easiest fix - database is ready, just add the checkbox to the UI!
