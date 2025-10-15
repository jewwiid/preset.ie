# 🎭 Multi-Talent Gig Analysis: "High Fashion Editorial Photoshoot MCP"

## 📋 **Gig Details**
- **ID**: `0cf28b9a-1941-441e-9f5a-3b909b991dac`
- **Owner**: `f97f181e-e0e1-4fad-999c-5d2b044b9816` (Gig Creator)
- **Title**: "High Fashion Editorial Photoshoot MCP"
- **Status**: `PUBLISHED` → Will become `COMPLETED` after shoot
- **Max Applicants**: `4` (Can have up to 4 talents)
- **Looking For**: `["Actor", "Model"]` and `["Model", "Fashion Model"]`
- **Location**: Dublin, Ireland
- **Type**: TFP (Trade for Photos)

---

## 🎯 **Multi-Talent Workflow Example**

### **Scenario: 3 Talents Accepted**
Let's say this gig has **3 accepted applicants**:
1. **Emma** - Fashion Model (Primary talent)
2. **James** - Actor/Model (Secondary talent)  
3. **Sarah** - Fashion Model (Supporting talent)

---

## 🔄 **Complete Multi-Talent Workflow**

### **Phase 1: Gig Completion**
```
Gig Status: PUBLISHED → COMPLETED
```

**What happens:**
- Gig creator marks gig as completed after the Dublin photoshoot
- Gig detail page shows "Create Showcase" section
- All 3 talents can see the completed gig

---

### **Phase 2: Creator Uploads Photos**
```
Creator → Visits gig page → Clicks "Create Showcase"
```

**Upload Process:**
```typescript
// Creator uploads 5 photos from the Dublin fashion shoot
const photos = [
  "emma_dramatic_pose.jpg",     // Emma in dramatic lighting
  "james_editorial_look.jpg",   // James in editorial styling  
  "sarah_fashion_portrait.jpg", // Sarah's fashion portrait
  "group_editorial_shot.jpg",   // All 3 talents together
  "behind_scenes_dublin.jpg"    // Behind the scenes
];

// Each photo gets tagged in exif_json:
{
  "source_type": "custom",
  "gig_id": "0cf28b9a-1941-441e-9f5a-3b909b991dac",
  "uploaded_by": "f97f181e-e0e1-4fad-999c-5d2b044b9816",
  "uploaded_at": "2025-01-20T10:30:00Z"
}
```

**Creator fills out:**
- **Title**: "High Fashion Editorial - Dublin Shoot"
- **Description**: "Stunning editorial photos from our Dublin fashion shoot featuring dramatic lighting and creative poses with our amazing talent team"
- **Tags**: `["fashion", "editorial", "dublin", "tfp", "portfolio", "group-shoot"]`

---

### **Phase 3: Creator Submits for Approval**
```
Creator → Clicks "Submit for Approval" → Status changes to pending_approval
```

**Database Changes:**
```sql
-- Update showcase
UPDATE showcases SET 
  approval_status = 'pending_approval',
  total_talents = 3,
  approved_talents = 0,
  change_requests = 0,
  updated_at = NOW()
WHERE id = 'showcase-uuid';

-- Create approval records for all 3 talents
INSERT INTO showcase_talent_approvals (showcase_id, talent_user_id, action) VALUES 
('showcase-uuid', 'emma-profile-id', 'pending'),
('showcase-uuid', 'james-profile-id', 'pending'),
('showcase-uuid', 'sarah-profile-id', 'pending');
```

**Email Notifications Sent:**
```typescript
// All 3 talents get emails simultaneously
const talents = [
  { name: "Emma", email: "emma@email.com", role: "Fashion Model" },
  { name: "James", email: "james@email.com", role: "Actor/Model" },
  { name: "Sarah", email: "sarah@email.com", role: "Fashion Model" }
];

for (const talent of talents) {
  await sendEmail({
    to: talent.email,
    template: 'showcase_submitted_for_approval',
    data: {
      talentName: talent.name,
      gigTitle: "High Fashion Editorial Photoshoot MCP",
      creatorName: "Photographer Name",
      totalTalents: 3,
      reviewUrl: "https://preset.ie/gigs/0cf28b9a-1941-441e-9f5a-3b909b991dac"
    }
  });
}
```

---

### **Phase 4: Multiple Talents Review**

#### **Emma Reviews First** ✅
```
Emma → Gets email → Clicks review link → Opens ShowcaseApprovalReview modal
```

**Emma's Experience:**
1. **Sees all 5 photos** in responsive grid
2. **Reads description**: "Stunning editorial photos from our Dublin fashion shoot..."
3. **Sees tags**: fashion, editorial, dublin, tfp, portfolio, group-shoot
4. **Clicks "Approve & Publish"**
5. **Confirmation dialog**: "This will publish the showcase and make it visible to everyone"

**Emma Approves:**
```sql
-- Update Emma's approval
UPDATE showcase_talent_approvals SET 
  action = 'approve',
  approved_at = NOW()
WHERE showcase_id = 'showcase-uuid' AND talent_user_id = 'emma-profile-id';

-- Update showcase (FIRST APPROVAL WINS!)
UPDATE showcases SET 
  approval_status = 'approved',
  approved_by_talent_at = NOW(),
  approved_talent_user_id = 'emma-profile-id',
  approved_talents = 1,
  visibility = 'public',
  updated_at = NOW()
WHERE id = 'showcase-uuid';
```

**Email to Creator:**
```typescript
await sendEmail({
  to: "creator@email.com",
  template: 'showcase_approved',
  data: {
    creatorName: "Photographer Name",
    gigTitle: "High Fashion Editorial Photoshoot MCP",
    talentName: "Emma",
    totalTalents: 3,
    approvedTalents: 1,
    showcaseUrl: "https://preset.ie/showcases/showcase-uuid"
  }
});
```

#### **James Reviews Second** 📝
```
James → Gets email → Clicks review link → Opens ShowcaseApprovalReview modal
```

**James's Experience:**
1. **Sees all 5 photos** (same as Emma)
2. **Notices**: "Already approved by Emma" status
3. **Still can provide feedback**: "The lighting looks great, but could you add more close-up shots?"
4. **Clicks "Request Changes"** (optional feedback)

**James Requests Changes:**
```sql
-- Update James's approval
UPDATE showcase_talent_approvals SET 
  action = 'request_changes',
  note = 'The lighting looks great, but could you add more close-up shots?',
  approved_at = NOW()
WHERE showcase_id = 'showcase-uuid' AND talent_user_id = 'james-profile-id';

-- Update showcase counts
UPDATE showcases SET 
  change_requests = 1,
  updated_at = NOW()
WHERE id = 'showcase-uuid';
```

**Email to Creator:**
```typescript
await sendEmail({
  to: "creator@email.com",
  template: 'showcase_changes_requested',
  data: {
    creatorName: "Photographer Name",
    gigTitle: "High Fashion Editorial Photoshoot MCP",
    talentName: "James",
    feedback: "The lighting looks great, but could you add more close-up shots?",
    totalTalents: 3,
    changeRequests: 1,
    gigUrl: "https://preset.ie/gigs/0cf28b9a-1941-441e-9f5a-3b909b991dac"
  }
});
```

#### **Sarah Reviews Third** ✅
```
Sarah → Gets email → Clicks review link → Opens ShowcaseApprovalReview modal
```

**Sarah's Experience:**
1. **Sees all 5 photos** (same as others)
2. **Notices**: "Already approved by Emma" status
3. **Clicks "Approve"** (additional approval)

**Sarah Approves:**
```sql
-- Update Sarah's approval
UPDATE showcase_talent_approvals SET 
  action = 'approve',
  approved_at = NOW()
WHERE showcase_id = 'showcase-uuid' AND talent_user_id = 'sarah-profile-id';

-- Update showcase counts (showcase already live)
UPDATE showcases SET 
  approved_talents = 2,
  updated_at = NOW()
WHERE id = 'showcase-uuid';
```

---

### **Phase 5: Showcase Goes Live** (After Emma's Approval)

**What becomes visible:**
- **Creator's profile**: Shows the approved showcase
- **All 3 talents' profiles**: Shows the approved showcase
- **Public showcase feed**: Showcase appears in main feed
- **Gig page**: Shows "View Showcase" button

**Final Showcase Status:**
```json
{
  "id": "showcase-uuid",
  "title": "High Fashion Editorial - Dublin Shoot",
  "description": "Stunning editorial photos from our Dublin fashion shoot featuring dramatic lighting and creative poses with our amazing talent team",
  "tags": ["fashion", "editorial", "dublin", "tfp", "portfolio", "group-shoot"],
  "status": "approved",
  "visibility": "public",
  "photos": 5,
  "from_gig": true,
  "gig_title": "High Fashion Editorial Photoshoot MCP",
  "creator": "Photographer Name",
  "total_talents": 3,
  "approved_talents": 2,
  "change_requests": 1,
  "approved_by": "Emma",
  "approvals": [
    {
      "talent": "Emma",
      "action": "approve",
      "approved_at": "2025-01-20T11:00:00Z"
    },
    {
      "talent": "James", 
      "action": "request_changes",
      "note": "The lighting looks great, but could you add more close-up shots?",
      "approved_at": "2025-01-20T11:15:00Z"
    },
    {
      "talent": "Sarah",
      "action": "approve", 
      "approved_at": "2025-01-20T11:30:00Z"
    }
  ]
}
```

---

## 🎛️ **Dashboard Integration**

### **For Creator:**
```typescript
const creatorWidget = {
  title: "Showcase Approval Status",
  items: [{
    id: "showcase-uuid",
    title: "High Fashion Editorial - Dublin Shoot",
    gigTitle: "High Fashion Editorial Photoshoot MCP",
    status: "approved",
    approvedTalents: 2,
    totalTalents: 3,
    changeRequests: 1,
    actions: ["View Showcase", "View Feedback"]
  }]
};
```

### **For Talents:**
```typescript
// Emma's dashboard
const emmaWidget = {
  title: "Showcase Approvals",
  items: [{
    id: "showcase-uuid",
    title: "High Fashion Editorial - Dublin Shoot", 
    status: "approved_by_you",
    action: "View Published Showcase"
  }]
};

// James's dashboard  
const jamesWidget = {
  title: "Showcase Approvals",
  items: [{
    id: "showcase-uuid",
    title: "High Fashion Editorial - Dublin Shoot",
    status: "changes_requested_by_you", 
    action: "View Feedback"
  }]
};

// Sarah's dashboard
const sarahWidget = {
  title: "Showcase Approvals", 
  items: [{
    id: "showcase-uuid",
    title: "High Fashion Editorial - Dublin Shoot",
    status: "approved_by_you",
    action: "View Published Showcase"
  }]
};
```

---

## 📧 **Email Timeline**

1. **Creator submits** → All 3 talents get "Review Required" emails
2. **Emma approves** → Creator gets "Approved" email (showcase goes live)
3. **James requests changes** → Creator gets "Changes Requested" email
4. **Sarah approves** → Creator gets "Additional Approval" email (optional)

---

## 🎯 **Key Benefits of Multi-Talent System**

✅ **Fast Publication** - Emma's approval made showcase live immediately  
✅ **Individual Control** - Each talent had their own approval decision  
✅ **Valuable Feedback** - James provided constructive feedback  
✅ **Multiple Perspectives** - 2 approvals + 1 change request  
✅ **Clear Tracking** - Know exactly who approved/requested changes  
✅ **Scalable** - Works for 1 talent or 10+ talents  

---

## 🔄 **Alternative Scenarios**

### **Scenario A: All Talents Approve**
```
Emma approves → James approves → Sarah approves
Result: 3/3 approvals, showcase live after first approval
```

### **Scenario B: Mixed Responses**
```
Emma approves → James requests changes → Sarah ignores
Result: 1/3 approvals, showcase live, 1 change request
```

### **Scenario C: All Request Changes**
```
Emma requests changes → James requests changes → Sarah requests changes  
Result: 0/3 approvals, creator gets all feedback, can resubmit
```

This multi-talent system makes the workflow much more practical for real-world gigs like this Dublin fashion shoot with multiple participants!
