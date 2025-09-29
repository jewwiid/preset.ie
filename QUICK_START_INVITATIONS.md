# Quick Start Guide: Collaboration Invitations

## 🚀 Getting Started in 5 Minutes

### Step 1: Run the Migration
```bash
# Navigate to your project directory
cd /Users/judeokun/Documents/GitHub/preset/preset.ie/preset

# Apply the migration
supabase db push

# Or if using direct SQL connection
psql -d your_database -f supabase/migrations/099_collaboration_invitations.sql
```

### Step 2: Verify Database Setup
```sql
-- Check that the table was created
SELECT * FROM collab_invitations LIMIT 1;

-- Check that the policies are in place
SELECT * FROM pg_policies WHERE tablename = 'collab_invitations';

-- Verify the updated project visibility policy
SELECT * FROM pg_policies WHERE tablename = 'collab_projects' AND policyname = 'collab_projects_read';
```

### Step 3: Test the Feature

#### Creating an Invite-Only Project
1. Go to `/collaborate`
2. Click "Create Project"
3. Set visibility to "Invite Only"
4. Fill in project details
5. Submit

#### Inviting Users (Requires Project Details Page Enhancement)
For now, you can test via API:
```bash
# Get your auth token from browser dev tools (Application > Local Storage > supabase.auth.token)
TOKEN="your_access_token"
PROJECT_ID="your_project_id"

# Send invitation by user ID
curl -X POST "http://localhost:3000/api/collab/projects/${PROJECT_ID}/invitations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "invitee_id": "user_id_to_invite",
    "message": "Join my awesome project!",
    "role_id": "optional_role_id"
  }'

# Or send invitation by email
curl -X POST "http://localhost:3000/api/collab/projects/${PROJECT_ID}/invitations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "invitee_email": "user@example.com",
    "message": "Join my awesome project!"
  }'
```

#### Viewing and Managing Invitations
1. Go to `/collaborate`
2. Click on "Invitations" tab
3. View pending invitations
4. Click "Accept" or "Decline"

#### Viewing Your Projects
1. Go to `/collaborate`
2. Click on "My Projects" tab
3. See all projects you've created (including private ones)

---

## 📋 Quick API Reference

### Send Invitation
```
POST /api/collab/projects/[id]/invitations
Body: {
  invitee_id?: string,
  invitee_email?: string,
  role_id?: string,
  message?: string
}
```

### List Project Invitations
```
GET /api/collab/projects/[id]/invitations
```

### Get My Invitations
```
GET /api/collab/invitations?status=pending
```

### Accept/Decline Invitation
```
PATCH /api/collab/invitations/[id]
Body: { action: "accept" | "decline" | "cancel" }
```

### Revoke Invitation
```
DELETE /api/collab/invitations/[id]
```

---

## 🧪 Testing Scenarios

### Test 1: Send and Accept Invitation
1. Create invite-only project as User A
2. Invite User B (use API or UI when available)
3. Log in as User B
4. Check "Invitations" tab
5. Accept invitation
6. Verify User B can now see the project

### Test 2: Expired Invitation
1. Create invitation
2. Manually update `expires_at` to past date
3. Try to accept - should show "expired" error

### Test 3: Duplicate Invitation Prevention
1. Send invitation to User X
2. Try sending another invitation to User X
3. Should get error: "An active invitation already exists"

### Test 4: Private Project Visibility
1. Create private project as User A
2. Log in as User B (not invited)
3. Verify User B cannot see project in "All Projects"
4. Verify project doesn't appear in any API calls

---

## 🔧 Troubleshooting

### Issue: Migration fails
**Solution**: Check if tables already exist, drop them first if needed

### Issue: RLS policies blocking access
**Solution**: Verify user authentication token is valid

### Issue: Can't see invited projects
**Solution**: Check invitation status is 'pending' or 'accepted'

### Issue: UI components not appearing
**Solution**: Clear browser cache and rebuild Next.js app

---

## 🎯 Next Steps

1. **Add Invite Button to Project Details Page**
   - Create project details page route
   - Add InviteUserDialog component
   - Wire up to existing API

2. **Integrate Notifications**
   - Hook up invitation events to notification system
   - Send emails for invitations
   - Show badge count for pending invitations

3. **Test with Real Users**
   - Create test projects
   - Send real invitations
   - Gather feedback

---

## 📝 Component Usage Examples

### Using InviteUserDialog in Your Page
```typescript
import { InviteUserDialog } from '@/components/collaborate/InviteUserDialog';

function ProjectDetailsPage({ project }) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setInviteDialogOpen(true)}>
        Invite People
      </Button>

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        projectId={project.id}
        projectTitle={project.title}
        roles={project.collab_roles}
        onInviteSent={() => {
          // Refresh invitations list
          fetchInvitations();
        }}
      />
    </>
  );
}
```

### Using InvitationsList Component
```typescript
import { InvitationsList } from '@/components/collaborate/InvitationsList';

function InvitationsPage() {
  return (
    <div>
      <h1>Your Invitations</h1>
      <InvitationsList />
    </div>
  );
}
```

---

## 🎉 You're All Set!

The collaboration invitation system is now fully functional. Start creating invite-only projects and inviting users!

For detailed documentation, see `COLLABORATION_INVITATIONS_IMPLEMENTATION.md`.
