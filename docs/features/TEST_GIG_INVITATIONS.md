# 🧪 Testing Gig Invitations System

## Prerequisites

### Test Users
- **Sarah Chen** (CONTRIBUTOR - Photographer)
  - Email: `sarah.chen@email.com`
  - Handle: `sarahchen_photo`
  - Role: Can create gigs and send invitations

- **James Murphy** (TALENT - Actor)
  - Email: `james.murphy@email.com`
  - Handle: `james_actor`
  - Role: Can receive gig invitations and apply

### Required Setup
1. ✅ Database migration applied (`gig_invitations` table exists)
2. ✅ Sarah needs at least one active gig (DRAFT or PUBLISHED status)
3. ✅ Both users need `allow_collaboration_invites = true`

---

## 🎬 Test Scenario: Sarah Invites James to a Gig

### Part 1: Create a Gig (as Sarah)

**If Sarah doesn't have an active gig:**

1. **Login as Sarah Chen**
   ```
   Email: sarah.chen@email.com
   ```

2. **Navigate to Create Gig**
   ```
   URL: /gigs/create
   ```

3. **Fill in basic details:**
   - Title: "Portrait Photoshoot - City Park"
   - Description: "Looking for male model for outdoor portrait session"
   - Looking For: "Model" or "Actor"
   - Purpose: "Portfolio"
   - Compensation: "TFP" or "Paid"
   - Location: "Dublin, Ireland"
   - Start Date: Tomorrow
   - End Date: Tomorrow + 3 hours
   - Application Deadline: Today + 2 days
   - Max Applicants: 10

4. **Save as DRAFT or PUBLISHED**
   - Status: "DRAFT" is fine for testing

5. **Note the Gig ID** from URL
   ```
   Example: /gigs/abc123-def456-ghi789
   ```

---

### Part 2: Send Invitation (as Sarah)

1. **Navigate to James's Profile**
   ```
   URL: /users/james_actor
   ```

2. **Verify "Invite to Gig" Button Appears**
   - Should be visible next to "Contact" and "Invite to Project"
   - Has briefcase icon 💼
   - Mobile: Shows "Gig"
   - Desktop: Shows "Invite to Gig"

3. **Click "Invite to Gig" Button**
   - Dialog should open
   - Title: "Invite James Murphy to a Gig"

4. **Select Gig from Dropdown**
   - Should list Sarah's active gigs
   - Each gig shows:
     - Title
     - Status badge (DRAFT/PUBLISHED)
     - Location
     - Start date
     - Compensation type

5. **Write Personal Message**
   ```
   Hi James,

   I think you'd be perfect for this outdoor portrait session! 
   Your theatrical background and natural expressions would work 
   great for the moody aesthetic I'm going for.

   Looking forward to working with you!
   - Sarah
   ```

6. **Send Invitation**
   - Click "Send Invitation" button
   - Should show "✓ Invitation sent successfully!"
   - Dialog closes after 1.5 seconds

7. **Verify in Database**
   ```sql
   SELECT 
     gi.id,
     gi.status,
     gi.message,
     gi.created_at,
     gi.expires_at,
     inviter.display_name as inviter_name,
     invitee.display_name as invitee_name,
     g.title as gig_title
   FROM gig_invitations gi
   JOIN users_profile inviter ON gi.inviter_id = inviter.id
   JOIN users_profile invitee ON gi.invitee_id = invitee.id
   JOIN gigs g ON gi.gig_id = g.id
   WHERE invitee.handle = 'james_actor'
   ORDER BY gi.created_at DESC
   LIMIT 1;
   ```

   Expected:
   - status: 'pending'
   - message: Your message
   - expires_at: ~7 days from now

---

### Part 3: View & Accept Invitation (as James)

1. **Logout as Sarah**
   ```
   Dashboard → Sign Out
   ```

2. **Login as James Murphy**
   ```
   Email: james.murphy@email.com
   ```

3. **Navigate to Dashboard**
   ```
   URL: /dashboard
   ```

4. **Verify "Gig Invitations" Card Appears**
   - Should show card with briefcase icon
   - Badge shows "1" invitation
   - Card description: "You've been invited to apply for these gigs"

5. **Verify Invitation Details**
   - Inviter: Sarah Chen's avatar and name
   - "Expires in X days" timestamp
   - Gig title: "Portrait Photoshoot - City Park"
   - Location, Date, Compensation icons and info
   - Personal message in quoted box

6. **Click "Accept & Apply" Button**
   - Button shows loading state: "Accepting..."
   - Card shows success indicator
   - Invitation disappears from card

7. **Verify Application Created**
   
   **Option A: Via UI**
   - Navigate to: `/gigs/{gig-id}`
   - If gig owner: Check "Applications" tab
   - Should see James Murphy's application

   **Option B: Via Database**
   ```sql
   SELECT 
     a.id,
     a.status,
     a.note,
     a.applied_at,
     u.display_name as applicant_name,
     g.title as gig_title
   FROM applications a
   JOIN users_profile u ON a.applicant_user_id = u.id
   JOIN gigs g ON a.gig_id = g.id
   WHERE u.handle = 'james_actor'
   ORDER BY a.applied_at DESC
   LIMIT 1;
   ```

   Expected:
   - status: 'PENDING'
   - note: Sarah's invitation message
   - applied_at: Current timestamp

8. **Verify Invitation Status Updated**
   ```sql
   SELECT 
     status,
     accepted_at,
     responded_at
   FROM gig_invitations
   WHERE invitee_id = (SELECT id FROM users_profile WHERE handle = 'james_actor')
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   Expected:
   - status: 'accepted'
   - accepted_at: Current timestamp
   - responded_at: Current timestamp

---

## 🧪 Additional Test Cases

### Test 2: Duplicate Invitation (Should Fail)
1. As Sarah, try to invite James again to the same gig
2. Expected error: "An active invitation already exists for this user"

### Test 3: Already Applied (Should Fail)
1. As James, manually apply to a gig
2. As Sarah, try to invite James to that gig
3. Expected error: "User has already applied to this gig"

### Test 4: Decline Invitation
1. As Sarah, create second gig and invite James
2. As James, click "Decline" instead of "Accept"
3. Verify invitation disappears
4. Verify no application created

### Test 5: Invitation to Non-Talent (Should Fail)
1. Create a CONTRIBUTOR-only test user
2. As Sarah, try to send invitation
3. Expected: User doesn't appear in search or error message

### Test 6: Expired Invitation
1. Manually update invitation in database:
   ```sql
   UPDATE gig_invitations
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE id = 'invitation-id';
   ```
2. Run expiration function:
   ```sql
   SELECT expire_old_gig_invitations();
   ```
3. Verify status changes to 'expired'
4. Verify invitation no longer appears on dashboard

---

## ✅ Success Criteria

- [ ] "Invite to Gig" button appears on talent profiles
- [ ] Button only visible to CONTRIBUTORS viewing TALENT
- [ ] Dialog lists gig owner's active gigs
- [ ] Invitation sent successfully with custom message
- [ ] Invitation appears on talent's dashboard
- [ ] Invitation details displayed correctly
- [ ] Accept button auto-creates application
- [ ] Decline button marks invitation as declined
- [ ] Duplicate invitations prevented
- [ ] Already-applied users can't be invited
- [ ] Invitations expire after 7 days
- [ ] Database records accurate and complete

---

## 🐛 Common Issues & Solutions

### Issue: "Invite to Gig" button not appearing
**Solution:** 
- Verify user is logged in
- Verify viewing user is CONTRIBUTOR
- Verify profile user is TALENT
- Check `profileRoleFlags` prop is passed

### Issue: No gigs in dropdown
**Solution:**
- Verify Sarah has created at least one gig
- Verify gig status is DRAFT or PUBLISHED
- Check gig owner_user_id matches Sarah's profile.id

### Issue: "Failed to send invitation"
**Solution:**
- Check browser console for detailed error
- Verify `allow_collaboration_invites = true` for James
- Check rate limiting (20/min)
- Verify API authentication token

### Issue: Application not created after accept
**Solution:**
- Check database trigger: `trigger_handle_gig_invitation_acceptance`
- Verify trigger function exists: `handle_gig_invitation_acceptance()`
- Check for existing application (duplicate prevention)

---

## 📊 Database Queries for Monitoring

### View All Pending Invitations
```sql
SELECT 
  gi.id,
  inviter.display_name as from_user,
  invitee.display_name as to_user,
  g.title as gig_title,
  gi.status,
  gi.created_at,
  gi.expires_at
FROM gig_invitations gi
JOIN users_profile inviter ON gi.inviter_id = inviter.id
JOIN users_profile invitee ON gi.invitee_id = invitee.id
JOIN gigs g ON gi.gig_id = g.id
WHERE gi.status = 'pending'
ORDER BY gi.created_at DESC;
```

### View Invitation Accept Rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM gig_invitations
GROUP BY status
ORDER BY count DESC;
```

### View Most Active Inviters
```sql
SELECT 
  u.display_name,
  u.handle,
  COUNT(*) as invitations_sent,
  COUNT(CASE WHEN gi.status = 'accepted' THEN 1 END) as accepted
FROM gig_invitations gi
JOIN users_profile u ON gi.inviter_id = u.id
GROUP BY u.id, u.display_name, u.handle
ORDER BY invitations_sent DESC
LIMIT 10;
```

