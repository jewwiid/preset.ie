# Gig Invitation → Application Logic

## 🎯 **Final Decision: Pending Review Approach**

After analyzing the database structure and user experience, we've implemented the **Pending Review** approach where accepting an invitation creates a `PENDING` application that requires creator confirmation.

## 📋 **The Complete Flow:**

### **1. Sarah Sends Invitation**
- Sarah invites James to her gig
- Invitation status: `pending`
- James receives notification

### **2. James Accepts Invitation**
- James accepts the invitation
- Invitation status: `accepted`
- **Database trigger automatically creates application** with status: `PENDING`
- James's application note: "Accepted invitation: [Sarah's message]"

### **3. Sarah Reviews Application**
- Sarah sees James in her applications list with `PENDING` status
- Sarah can either:
  - ✅ **Accept** → Application becomes `ACCEPTED` (spot filled)
  - ❌ **Decline** → Application becomes `DECLINED` (spot remains open)

## 🏗️ **Database Implementation:**

### **Automatic Application Creation (Trigger)**
```sql
-- Trigger fires when invitation status changes to 'accepted'
CREATE TRIGGER trigger_handle_gig_invitation_acceptance
  BEFORE UPDATE ON gig_invitations
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION handle_gig_invitation_acceptance();

-- Function creates PENDING application
INSERT INTO applications (
  gig_id,
  applicant_user_id,
  note,
  status,
  applied_at
) VALUES (
  NEW.gig_id,
  NEW.invitee_id,
  COALESCE(NEW.message, 'Applied via invitation'),
  'PENDING',  -- ← Creates PENDING application
  NOW()
);
```

### **Spot Counting Logic**
```sql
-- Gig page counts both ACCEPTED and PENDING applications
SELECT COUNT(*) FROM applications 
WHERE gig_id = ? 
AND status IN ('ACCEPTED', 'PENDING')
```

## ✅ **Why This Approach is Better:**

### **1. Creator Control**
- Sarah maintains final say over who gets the spot
- Can review profile before final commitment

### **2. Flexibility**
- If James's profile doesn't match expectations, Sarah can decline
- Prevents auto-filling spots with unsuitable candidates

### **3. Clear Workflow**
- Invitation = "We're interested in you"
- PENDING Application = "Please review and confirm"
- ACCEPTED Application = "Spot is filled"

### **4. Better UX**
- Invitation system becomes a "shortlisting" tool
- Clear distinction between "invited" and "confirmed"

## 🎨 **Visual Indicators:**

### **Similar Talent Section**
- Green checkmark appears for users with `PENDING` or `ACCEPTED` applications
- Shows that they've been invited/applied

### **Gig Availability**
- Shows "1/3 spots filled" for both `PENDING` and `ACCEPTED` applications
- Indicates tentative commitment until final confirmation

## 📱 **User Experience:**

### **For James (Invitee):**
1. Receives invitation notification
2. Accepts invitation
3. Application automatically created as `PENDING`
4. Waits for Sarah's final confirmation

### **For Sarah (Creator):**
1. Sends invitation to James
2. Receives notification when James accepts
3. Reviews James's application in applications page
4. Accepts/declines to fill the spot

## 🔄 **Status Flow:**

```
Invitation: pending → accepted
Application: (none) → PENDING → ACCEPTED/DECLINED
```

This approach balances automation with creator control, ensuring the best user experience for both parties.
