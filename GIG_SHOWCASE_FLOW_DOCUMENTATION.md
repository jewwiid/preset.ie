# 📋 Gig Showcase Approval System - Complete Flow Documentation

## 🎯 **System Overview**

A collaborative approval workflow for gig-based showcases where:
- **Gig creators** upload photos from completed gigs
- **Talent** reviews and approves before publication
- **Both parties** control what gets published from their collaborative work

---

## 🔄 **Complete User Flow**

### **Phase 1: Gig Completion**
```
Gig Status: PUBLISHED → COMPLETED
```

**Trigger:** Gig creator marks gig as completed after the shoot
**Result:** Gig detail page shows "Create Showcase" section

---

### **Phase 2: Creator Uploads Photos**

#### **2.1 Access Upload Interface**
- **User:** Gig Creator (`f97f181e-e0e1-4fad-999c-5d2b044b9816`)
- **Location:** Gig detail page (`/gigs/0cf28b9a-1941-441e-9f5a-3b909b991dac`)
- **Action:** Click "Create Showcase" button
- **UI Component:** `GigShowcaseUpload` modal opens

#### **2.2 Photo Upload Process**
```typescript
// Drag & Drop Interface
const uploadSpec = {
  maxFiles: 6,
  minFiles: 3,
  acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  sourceTagging: {
    source_type: "custom",
    gig_id: "0cf28b9a-1941-441e-9f5a-3b909b991dac",
    uploaded_by: "f97f181e-e0e1-4fad-999c-5d2b044b9816"
  }
};
```

**User Experience:**
1. **Drag photos** from computer to upload area
2. **See preview grid** of uploaded images (3-6 photos)
3. **Remove unwanted photos** with X button
4. **Add showcase details:**
   - Title: "High Fashion Editorial - Dublin Shoot"
   - Description: "Stunning editorial photos from our Dublin fashion shoot..."
   - Tags: `["fashion", "editorial", "dublin", "tfp", "portfolio"]`

#### **2.3 Database Changes**
```sql
-- Create showcase record
INSERT INTO showcases (
  id, gig_id, creator_user_id, title, description, tags,
  from_gig, approval_status, created_at
) VALUES (
  'showcase-uuid', '0cf28b9a-1941-441e-9f5a-3b909b991dac',
  'f97f181e-e0e1-4fad-999c-5d2b044b9816',
  'High Fashion Editorial - Dublin Shoot',
  'Stunning editorial photos...',
  '["fashion", "editorial", "dublin", "tfp", "portfolio"]',
  true, 'draft', NOW()
);

-- Link media with source tagging
INSERT INTO showcase_media (showcase_id, media_id) VALUES 
('showcase-uuid', 'media-1'), ('showcase-uuid', 'media-2'), 
('showcase-uuid', 'media-3'), ('showcase-uuid', 'media-4'), 
('showcase-uuid', 'media-5');

-- Update media exif_json with source info
UPDATE media SET exif_json = exif_json || '{
  "source_type": "custom",
  "gig_id": "0cf28b9a-1941-441e-9f5a-3b909b991dac",
  "uploaded_by": "f97f181e-e0e1-4fad-999c-5d2b044b9816",
  "uploaded_at": "2025-01-20T10:30:00Z"
}'::jsonb WHERE id IN ('media-1', 'media-2', 'media-3', 'media-4', 'media-5');
```

---

### **Phase 3: Creator Submits for Approval**

#### **3.1 Submit Action**
- **User:** Gig Creator
- **Action:** Click "Submit for Approval" button
- **API Call:** `POST /api/showcases/showcase-uuid/submit`
- **Result:** Status changes to `pending_approval`

#### **3.2 Database Update**
```sql
UPDATE showcases SET 
  approval_status = 'pending_approval',
  approved_by_creator_at = NOW(),
  updated_at = NOW()
WHERE id = 'showcase-uuid';
```

#### **3.3 Email Notification**
```typescript
// Email sent to talent
const emailTemplate = {
  to: "talent@email.com",
  subject: "📸 Showcase Review Required: High Fashion Editorial Photoshoot MCP",
  content: {
    talentName: "Model Name",
    gigTitle: "High Fashion Editorial Photoshoot MCP", 
    creatorName: "Photographer Name",
    showcaseId: "showcase-uuid",
    reviewUrl: "https://preset.ie/gigs/0cf28b9a-1941-441e-9f5a-3b909b991dac"
  }
};
```

---

### **Phase 4: Talent Reviews Showcase**

#### **4.1 Talent Receives Notification**
- **User:** Accepted talent from the gig
- **Notification:** Email with review link
- **Action:** Click "Review Showcase" button

#### **4.2 Review Interface**
- **Location:** Gig detail page with `ShowcaseApprovalReview` modal
- **UI Elements:**
  - **Header:** "Review Showcase: High Fashion Editorial - Dublin Shoot"
  - **Gig Info:** "From gig: High Fashion Editorial Photoshoot MCP"
  - **Creator Info:** "Created by @photographer_handle (Photographer Name)"
  - **Status Badge:** "Pending Your Approval"
  - **Photo Grid:** All 5 uploaded photos in responsive grid
  - **Description:** Full showcase description
  - **Tags:** Visual tag badges
  - **Feedback Input:** Optional textarea for comments

#### **4.3 Talent Decision Points**

**Option A: Approve** ✅
```typescript
// Talent clicks "Approve & Publish"
const approvalAction = {
  action: "approve",
  note: "These photos look amazing! Great work on the lighting and composition."
};

// API Call: POST /api/showcases/showcase-uuid/approve
// Database Update:
UPDATE showcases SET 
  approval_status = 'approved',
  approved_by_talent_at = NOW(),
  visibility = 'public',
  updated_at = NOW()
WHERE id = 'showcase-uuid';

// Email to creator: "🎉 Your showcase has been approved!"
```

**Option B: Request Changes** 📝
```typescript
// Talent clicks "Request Changes"
const changeRequest = {
  action: "request_changes", 
  note: "Could you include more variety in poses? The lighting looks great but I'd love to see some different angles."
};

// API Call: POST /api/showcases/showcase-uuid/approve
// Database Update:
UPDATE showcases SET 
  approval_status = 'changes_requested',
  approval_notes = 'Could you include more variety in poses?...',
  updated_at = NOW()
WHERE id = 'showcase-uuid';

// Email to creator: "📝 Changes requested for your showcase"
```

---

### **Phase 5: Showcase Publication (If Approved)**

#### **5.1 Public Visibility**
- **Showcase Status:** `approved` + `visibility: public`
- **Visible To:** Everyone (public showcase feed)
- **Profile Integration:** Shows on both creator and talent profiles

#### **5.2 UI Updates**
- **Gig Page:** Shows "View Showcase" button instead of creation buttons
- **Creator Profile:** Showcase appears in portfolio
- **Talent Profile:** Showcase appears in portfolio
- **Public Feed:** Showcase appears in main showcase feed

---

### **Phase 6: Changes Requested Flow (If Applicable)**

#### **6.1 Creator Receives Feedback**
- **Email:** "📝 Changes requested for your showcase"
- **Feedback:** "Could you include more variety in poses? The lighting looks great but I'd love to see some different angles."

#### **6.2 Creator Makes Changes**
- **Action:** Click "Make Changes" button
- **Process:** Re-open `GigShowcaseUpload` modal
- **Options:**
  - Upload additional photos
  - Replace existing photos
  - Update description/tags
  - Resubmit for approval

#### **6.3 Resubmission**
- **Status:** `changes_requested` → `pending_approval`
- **Notification:** Talent gets new review email
- **Process:** Repeat Phase 4 (Talent Reviews)

---

## 🎛️ **Dashboard Integration**

### **Pending Approvals Widget**
```typescript
// For Talent
const talentWidget = {
  title: "Pending Showcase Approvals",
  count: 1,
  items: [{
    id: "showcase-uuid",
    title: "High Fashion Editorial - Dublin Shoot",
    gigTitle: "High Fashion Editorial Photoshoot MCP", 
    creator: "@photographer_handle",
    status: "pending_approval",
    action: "Review & Approve"
  }]
};

// For Creator  
const creatorWidget = {
  title: "Pending Showcase Approvals",
  count: 1,
  items: [{
    id: "showcase-uuid", 
    title: "High Fashion Editorial - Dublin Shoot",
    gigTitle: "High Fashion Editorial Photoshoot MCP",
    status: "changes_requested",
    action: "Make Changes"
  }]
};
```

---

## 📧 **Email Notification Timeline**

1. **Creator submits** → Talent gets "Review Required" email
2. **Talent approves** → Creator gets "Approved" email
3. **Talent requests changes** → Creator gets "Changes Requested" email  
4. **Creator resubmits** → Talent gets "Review Required" email (again)

---

## 🔒 **Security & Permissions**

### **Access Control**
- **Gig Creator:** Can upload, edit draft, submit for approval
- **Accepted Talent:** Can review, approve, request changes
- **Other Users:** Can view approved showcases only

### **Data Validation**
- **Gig Status:** Must be `COMPLETED` to create showcase
- **User Roles:** Must be gig creator or accepted talent
- **Photo Limits:** 3-6 images minimum/maximum
- **Source Tagging:** All photos tagged as `custom` source

### **RLS Policies**
```sql
-- Showcases from gigs
CREATE POLICY "Users can view approved gig showcases" ON showcases
  FOR SELECT USING (
    visibility = 'public' OR 
    (from_gig = true AND creator_user_id = auth.uid()) OR
    (from_gig = true AND talent_user_id = auth.uid())
  );
```

---

## 🎯 **Success Criteria**

✅ **Creator can upload 3-6 custom photos from completed gigs**  
✅ **Photos are tagged with source_type in exif_json**  
✅ **Talent receives notification to review showcase**  
✅ **Talent can approve or request changes**  
✅ **Approved showcases automatically become public**  
✅ **Both parties see showcase on their profiles**  
✅ **Existing showcases continue to work unchanged**  

---

## 🔄 **Status Flow Diagram**

```
draft → pending_approval → approved (public)
  ↓           ↓
  ↓      changes_requested
  ↓           ↓
  └───────────┘ (resubmit)
```

---

## 📱 **Mobile Responsiveness**

- **Upload Interface:** Touch-friendly drag & drop
- **Photo Grid:** Responsive columns (2-6 per row)
- **Review Modal:** Full-screen on mobile
- **Dashboard Widget:** Stacked layout on small screens

This flow ensures professional collaboration while maintaining quality control and giving both parties equal say in what gets published from their joint creative work.
