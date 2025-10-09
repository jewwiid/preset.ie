# Notification Bell Troubleshooting Guide 🔔

## Issue: "I don't see the notification shown in the bell icon"

---

## ✅ Quick Checklist

### 1. **Send a NEW Invitation**
The notification triggers only fire for events that happen AFTER the migration was run.

**Steps**:
1. Log in as Sarah (gig creator)
2. Go to any talent's profile
3. Click "Invite to Apply"
4. Select a gig and send invitation
5. ✅ Trigger fires → Notification created

### 2. **Manual Refresh Required**
Real-time updates are currently disabled in the `useNotifications` hook (line 411-453 in `apps/web/lib/hooks/useNotifications.tsx`).

**To see notifications**:
1. Log in as James (invitee)
2. Click the 🔔 bell icon in the navbar
3. Click the **↻ Refresh** button in the dropdown header
4. Notifications will load

### 3. **Or Reload the Page**
Since real-time is disabled, you can also:
- Refresh the page (F5 or Cmd+R)
- Notifications load on page mount

---

## 🔍 Detailed Debugging

### Check Database Directly

Run this SQL to verify notifications exist:

```sql
-- Check if ANY notifications exist
SELECT COUNT(*) FROM notifications;

-- View recent notifications
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.read_at,
  n.created_at,
  up.handle as recipient
FROM notifications n
JOIN auth.users au ON au.id = n.recipient_id
JOIN users_profile up ON up.user_id = au.id
ORDER BY n.created_at DESC
LIMIT 10;

-- Check James's notifications specifically
SELECT * FROM notifications
WHERE recipient_id = (
  SELECT user_id FROM users_profile WHERE handle = 'james_actor'
)
ORDER BY created_at DESC;
```

### Expected Results:

**If James has notifications**:
```
| type            | title                        | created_at          |
|-----------------|------------------------------|---------------------|
| gig_invitation  | You've been invited to a gig!| 2025-10-09...       |
```

**If no notifications**: 
- Send a new invitation
- Check that triggers are installed: `SELECT proname FROM pg_proc WHERE proname LIKE '%notify_%invitation%';`

---

## 🎯 Testing Flow

### Complete Test Scenario:

```
STEP 1: Sarah Sends Invitation (AFTER migration)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Log in as Sarah
2. Navigate to James's profile: /users/james_actor
3. Click "Invite to Apply" button
4. Select a gig from dropdown
5. Write message: "Hey James, perfect for this gig!"
6. Click "Send Invitation"
   ✅ Trigger fires: notify_gig_invitation_sent()
   ✅ INSERT into notifications table


STEP 2: James Checks Notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Log out Sarah
2. Log in as James
3. Look at navbar - see 🔔 bell icon
4. Check for red badge with "1"
   - If NO badge: Click bell → Click refresh (↻)
   - Badge should appear with "1"
5. Click the bell icon
6. See notification:
   Title: "You've been invited to a gig!"
   Message: "Sarah Chen invited you to apply for..."
   ✅ Avatar shows Sarah's picture
   ✅ Blue background (unread)
7. Click notification
   ✅ Redirects to /dashboard/invitations?type=gigs


STEP 3: James Accepts Invitation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. On invitations page, click "Accept & Apply"
2. Status changes to 'accepted'
   ✅ Trigger fires: notify_gig_invitation_response()
   ✅ INSERT into notifications table (for Sarah)


STEP 4: Sarah Checks Response Notification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Log out James
2. Log in as Sarah
3. Look at navbar - see 🔔 bell icon
4. Badge should show "1" (or click refresh)
5. Click bell icon
6. See notification:
   Title: "Gig invitation accepted!"
   Message: "James Murphy accepted your invitation..."
   ✅ Avatar shows James's picture
7. Click notification
   ✅ Redirects to /gigs/[id]
```

---

## 🔧 Common Issues

### Issue 1: No Bell Icon Visible
**Check**: Are you logged in?
- Bell only shows for authenticated users
- Check `NavBar.tsx` line 606: `{user && <NotificationBell />}`

### Issue 2: Bell Shows But No Badge
**Reasons**:
- No unread notifications
- Need to refresh (real-time disabled)
- Notifications muted (see bell icon - if `BellOff` icon shown, notifications are muted)

**Solution**:
- Click bell → Click refresh button (↻)
- If muted, click sound icon to unmute

### Issue 3: Badge Shows But Dropdown Empty
**Check**:
- Click refresh button in dropdown
- Check browser console for errors
- Verify notifications table exists: `SELECT * FROM notifications LIMIT 1;`

### Issue 4: "Notifications table not found"
**Check**:
- Run migration: `npx supabase db push`
- Verify table exists: `\dt notifications`
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'notifications';`

---

## ⚡ Enable Real-Time Updates (Optional)

Currently, real-time subscriptions are commented out (lines 411-453 in `useNotifications.tsx`).

To enable automatic notifications without refresh:

1. Uncomment the `useEffect` block (lines 413-453)
2. Ensure Supabase realtime is enabled for `notifications` table:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```
3. Restart your app
4. Notifications will appear instantly without refresh!

---

## 📊 Notification Flow

```
┌─────────────────────────────────────────────┐
│           NOTIFICATION SYSTEM FLOW          │
└─────────────────────────────────────────────┘

1. Sarah sends invitation
         │
         ▼
   Database INSERT
   (gig_invitations table)
         │
         ▼
   ✨ TRIGGER FIRES
   notify_gig_invitation_sent()
         │
         ▼
   INSERT into notifications table
   {
     recipient_id: james_user_id,
     type: 'gig_invitation',
     title: 'You've been invited...',
     read_at: null  ← UNREAD
   }
         │
         ▼
   🔔 Notification Created
         │
         ├─ Real-time: Instant (if enabled)
         └─ Manual: Refresh/reload required
         │
         ▼
   James's browser queries:
   SELECT * FROM notifications
   WHERE recipient_id = james_user_id
   AND read_at IS NULL
         │
         ▼
   unreadCount = 1
         │
         ▼
   🔴 Red badge appears on bell
```

---

## ✅ Verification Checklist

- [ ] Migration ran successfully (`20251009000002_invitation_notifications.sql`)
- [ ] Triggers exist in database:
  ```sql
  SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table 
  FROM information_schema.triggers 
  WHERE trigger_name LIKE '%invitation%';
  ```
- [ ] Functions exist:
  ```sql
  SELECT proname FROM pg_proc 
  WHERE proname IN (
    'notify_gig_invitation_sent',
    'notify_gig_invitation_response',
    'notify_collab_invitation_sent',
    'notify_collab_invitation_response'
  );
  ```
- [ ] Sent NEW invitation (after migration)
- [ ] Clicked refresh button in bell dropdown
- [ ] Checked browser console for errors
- [ ] Verified notification exists in database

---

## 🎉 Expected Behavior

### When Working Correctly:

1. **Sarah sends invitation**:
   - ✅ No errors in console
   - ✅ Success message shown
   - ✅ Invitation appears in her sent invitations

2. **James logs in**:
   - ✅ Bell icon visible in navbar
   - ✅ Red badge shows "1"
   - ✅ Clicking bell shows notification
   - ✅ Notification has correct title, message, avatar
   - ✅ Clicking notification navigates to invitations page

3. **James accepts**:
   - ✅ Invitation marked as accepted
   - ✅ Redirect to gig page
   - ✅ Sarah's notification created

4. **Sarah logs in**:
   - ✅ Bell badge shows "1"
   - ✅ Sees "Gig invitation accepted!" notification
   - ✅ Can click to view gig

---

## 🚀 Quick Fix

If notifications still don't show after following all steps:

**Nuclear Option - Force Refresh**:
```sql
-- Delete old test notifications
DELETE FROM notifications 
WHERE type IN ('gig_invitation', 'gig_invitation_response');

-- Send fresh invitation
-- Then check again
```

**Still not working?**
1. Check browser console for errors
2. Verify user is authenticated: `SELECT auth.uid();`
3. Check notification preferences aren't blocking
4. Try different browser/incognito mode
5. Check network tab for API calls to `/notifications`

---

## 📝 Summary

**Most Common Fix**: 
1. Send a NEW invitation after running migration
2. Click the ↻ refresh button in the bell dropdown
3. Notifications will appear!

**If still not working**, check database directly to verify notifications exist, then debug from there.

