# 🎭 Multiple Talents in Gig Showcase Approval System

## 🚨 **CURRENT ISSUE**

The existing implementation assumes **single talent approval**, but gigs can have **multiple accepted applicants**. This creates several problems:

### **Current Problems:**
1. **Single talent assumption** - Only checks if current user is in `acceptedApplicants`
2. **All-or-nothing approval** - Either all talents approve or none do
3. **No individual talent tracking** - Can't see which talents have approved
4. **Email notifications** - Only sent to one "talent" 
5. **Dashboard widget** - Shows same approval for all talents

---

## 🎯 **SOLUTION: Multi-Talent Approval System**

### **Approach: Individual Talent Approvals**

Instead of requiring ALL talents to approve, implement **individual talent approvals** where:
- **Each talent** can independently approve/request changes
- **Showcase goes live** when **any talent approves** (first approval wins)
- **Creator gets feedback** from talents who request changes
- **Individual tracking** of who approved/requested changes

---

## 🔄 **UPDATED WORKFLOW**

### **Phase 1: Creator Uploads Photos** (Same)
- Creator uploads 3-6 photos from completed gig
- Creates showcase with `from_gig=true`, `approval_status='draft'`

### **Phase 2: Creator Submits for Approval** (Updated)
- Creator clicks "Submit for Approval"
- **Status changes** to `pending_approval`
- **Emails sent to ALL accepted talents** (not just one)

### **Phase 3: Multiple Talents Review** (New)
- **Each talent** gets their own review interface
- **Each talent** can independently:
  - ✅ **Approve** → Showcase goes live immediately
  - 📝 **Request Changes** → Creator gets feedback
  - ⏸️ **Ignore** → No action taken

### **Phase 4: Showcase Publication** (Updated)
- **First approval** makes showcase live
- **Subsequent approvals** are logged but don't change status
- **Change requests** are collected and shown to creator

---

## 🗄️ **DATABASE SCHEMA UPDATES**

### **New Table: `showcase_talent_approvals`**
```sql
CREATE TABLE showcase_talent_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  talent_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'request_changes', 'pending')),
  note TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(showcase_id, talent_user_id)
);

-- Indexes
CREATE INDEX idx_showcase_talent_approvals_showcase ON showcase_talent_approvals(showcase_id);
CREATE INDEX idx_showcase_talent_approvals_talent ON showcase_talent_approvals(talent_user_id);
CREATE INDEX idx_showcase_talent_approvals_action ON showcase_talent_approvals(action);
```

### **Updated Showcases Table**
```sql
-- Add fields to track multi-talent approval
ALTER TABLE showcases ADD COLUMN IF NOT EXISTS approved_by_talent_at TIMESTAMPTZ;
ALTER TABLE showcases ADD COLUMN IF NOT EXISTS approved_talent_user_id UUID REFERENCES users_profile(id);
ALTER TABLE showcases ADD COLUMN IF NOT EXISTS total_talents INTEGER DEFAULT 0;
ALTER TABLE showcases ADD COLUMN IF NOT EXISTS approved_talents INTEGER DEFAULT 0;
ALTER TABLE showcases ADD COLUMN IF NOT EXISTS change_requests INTEGER DEFAULT 0;
```

---

## 🔧 **API ENDPOINT UPDATES**

### **1. Submit for Approval** (`/api/showcases/[id]/submit`)
```typescript
// Updated to create approval records for all talents
export async function POST(request: NextRequest) {
  // 1. Verify user is gig creator
  // 2. Update showcase status to 'pending_approval'
  // 3. Get all accepted talents from gig
  // 4. Create showcase_talent_approvals records for each talent
  // 5. Send emails to ALL talents
  // 6. Update total_talents count
}
```

### **2. Approve/Request Changes** (`/api/showcases/[id]/approve`)
```typescript
// Updated to handle individual talent actions
export async function POST(request: NextRequest) {
  const { action, note } = await request.json();
  
  // 1. Verify user is accepted talent
  // 2. Update showcase_talent_approvals record
  // 3. If action === 'approve':
  //    - Update showcase status to 'approved'
  //    - Set approved_by_talent_at and approved_talent_user_id
  //    - Send email to creator
  // 4. If action === 'request_changes':
  //    - Increment change_requests count
  //    - Send email to creator with feedback
  // 5. Return updated showcase with approval status
}
```

### **3. New Endpoint: Get Talent Approvals** (`/api/showcases/[id]/approvals`)
```typescript
// Get approval status for all talents
export async function GET(request: NextRequest) {
  // Return array of talent approvals with status
  return {
    approvals: [
      {
        talent_id: "uuid",
        talent_name: "Model Name",
        action: "approve" | "request_changes" | "pending",
        note: "Optional feedback",
        approved_at: "timestamp"
      }
    ],
    total_talents: 3,
    approved_talents: 1,
    change_requests: 1
  }
}
```

---

## 🎨 **FRONTEND COMPONENT UPDATES**

### **1. ShowcaseApprovalReview Component**
```typescript
// Updated to show individual talent approval
export function ShowcaseApprovalReview({ showcaseId }: Props) {
  const [approvals, setApprovals] = useState([]);
  const [currentUserApproval, setCurrentUserApproval] = useState(null);
  
  // Show:
  // - All uploaded photos
  // - Current user's approval status
  // - Other talents' approval status (if any)
  // - Approve/Request Changes buttons
}
```

### **2. Gig Detail Page Updates**
```typescript
// Updated approval logic
{!isOwner && showcase.approval_status === 'pending_approval' && 
 acceptedApplicants.some(app => app.users_profile.id === userProfile?.id) && (
  <Button onClick={() => setShowApprovalReview(true)}>
    <CheckSquare className="w-4 h-4 mr-2" />
    Review & Approve
  </Button>
)}

// Show approval status for creators
{isOwner && showcase.approval_status === 'pending_approval' && (
  <div className="space-y-2">
    <Badge variant="outline">
      {showcase.approved_talents}/{showcase.total_talents} Talents Approved
    </Badge>
    {showcase.change_requests > 0 && (
      <Badge variant="destructive">
        {showcase.change_requests} Change Request(s)
      </Badge>
    )}
  </div>
)}
```

### **3. Dashboard Widget Updates**
```typescript
// Updated to show individual talent approvals
export function PendingShowcaseApprovals() {
  // Show:
  // - Showcases pending current user's approval
  // - Showcases where user is creator (with approval status)
  // - Quick action buttons for each
}
```

---

## 📧 **EMAIL NOTIFICATION UPDATES**

### **1. Submit for Approval Email**
```typescript
// Send to ALL accepted talents
const talents = await getAcceptedTalents(gigId);
for (const talent of talents) {
  await sendEmail({
    to: talent.email,
    template: 'showcase_submitted_for_approval',
    data: {
      talentName: talent.display_name,
      gigTitle: gig.title,
      creatorName: creator.display_name,
      totalTalents: talents.length,
      reviewUrl: `${baseUrl}/gigs/${gigId}`
    }
  });
}
```

### **2. Approval Email**
```typescript
// Send to creator when ANY talent approves
await sendEmail({
  to: creator.email,
  template: 'showcase_approved',
  data: {
    creatorName: creator.display_name,
    gigTitle: gig.title,
    talentName: approvingTalent.display_name,
    totalTalents: totalTalents,
    approvedTalents: approvedTalents,
    showcaseUrl: `${baseUrl}/showcases/${showcaseId}`
  }
});
```

### **3. Change Request Email**
```typescript
// Send to creator when talent requests changes
await sendEmail({
  to: creator.email,
  template: 'showcase_changes_requested',
  data: {
    creatorName: creator.display_name,
    gigTitle: gig.title,
    talentName: requestingTalent.display_name,
    feedback: note,
    totalTalents: totalTalents,
    changeRequests: changeRequests,
    gigUrl: `${baseUrl}/gigs/${gigId}`
  }
});
```

---

## 🎯 **USER EXPERIENCE SCENARIOS**

### **Scenario 1: Single Talent Approves**
```
Gig: "Fashion Editorial Shoot" (3 talents)
Creator uploads photos → Submits for approval
Talent A approves → Showcase goes live immediately
Talent B & C see "Already Approved" status
```

### **Scenario 2: Multiple Change Requests**
```
Gig: "Group Photo Shoot" (4 talents)
Creator uploads photos → Submits for approval
Talent A requests changes: "Need more variety in poses"
Talent B requests changes: "Lighting could be better"
Talent C approves → Showcase goes live
Talent D sees "Already Approved" status
```

### **Scenario 3: Mixed Responses**
```
Gig: "Portrait Session" (2 talents)
Creator uploads photos → Submits for approval
Talent A approves → Showcase goes live
Talent B requests changes: "Can you add more close-ups?"
Creator sees: "1 approved, 1 change request"
```

---

## 🔒 **PERMISSIONS & SECURITY**

### **RLS Policies**
```sql
-- Showcase talent approvals
CREATE POLICY "Users can view approvals for their showcases" ON showcase_talent_approvals
  FOR SELECT USING (
    talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    OR showcase_id IN (
      SELECT id FROM showcases 
      WHERE creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Talents can update their own approvals" ON showcase_talent_approvals
  FOR UPDATE USING (
    talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  );
```

---

## 📊 **DASHBOARD ANALYTICS**

### **For Creators:**
- **Pending Approvals**: Showcases waiting for talent approval
- **Approval Status**: "2/3 talents approved, 1 change request"
- **Quick Actions**: "View Feedback", "Make Changes"

### **For Talents:**
- **Pending Reviews**: Showcases waiting for your approval
- **Approval History**: Showcases you've approved/requested changes
- **Quick Actions**: "Review & Approve", "Request Changes"

---

## 🚀 **IMPLEMENTATION PRIORITY**

### **Phase 1: Database Schema** (30 minutes)
1. Create `showcase_talent_approvals` table
2. Add multi-talent fields to `showcases` table
3. Update RLS policies

### **Phase 2: API Updates** (45 minutes)
1. Update submit endpoint to create approval records
2. Update approve endpoint for individual actions
3. Create new approvals endpoint
4. Update email notifications

### **Phase 3: Frontend Updates** (60 minutes)
1. Update `ShowcaseApprovalReview` component
2. Update gig detail page approval logic
3. Update dashboard widget
4. Add approval status displays

### **Phase 4: Testing** (30 minutes)
1. Test single talent approval
2. Test multiple talent scenarios
3. Test mixed approval/change requests
4. Test email notifications

---

## 🎉 **BENEFITS OF MULTI-TALENT APPROVAL**

✅ **Faster Publication** - First approval makes showcase live  
✅ **Individual Control** - Each talent has their own approval  
✅ **Better Feedback** - Multiple perspectives on changes needed  
✅ **Flexible Workflow** - Works for any number of talents  
✅ **Clear Tracking** - See exactly who approved/requested changes  
✅ **Scalable** - Handles 1 talent or 10+ talents equally well  

This approach makes the system much more practical for real-world gigs with multiple participants!
