# Test Plan: Signup with Name Persistence

## What Changed
1. ✅ Added first_name and last_name fields to signup form
2. ✅ Store names in sessionStorage during signup
3. ✅ Pass names as user metadata to Supabase Auth
4. ✅ Updated database trigger to extract names from metadata
5. ✅ Pre-fill complete-profile page with stored names

## Manual Testing Steps

### Test 1: Email Signup Flow
1. Navigate to `/auth/signup`
2. Select a role (Contributor/Talent/Both)
3. In the credentials step, you should now see:
   - First Name field
   - Last Name field
   - Email field
   - Password fields
   - Date of Birth
4. Fill in:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe.test@example.com"
   - Password: (meet requirements)
   - DOB: Valid date (18+)
   - Agree to terms
5. Submit the form
6. After email confirmation (if required), you should be redirected to `/auth/complete-profile`
7. **Verify**: Display Name should be pre-filled with "John Doe"
8. **Verify**: Handle should be auto-generated from name (e.g., "johndoe")
9. Complete the profile setup
10. **Verify in Database**: Check `users_profile` table:
    - `first_name` = 'John'
    - `last_name` = 'Doe'
    - `display_name` = 'John Doe'

### Test 2: Google OAuth Flow
1. Navigate to `/auth/signup`
2. Select a role
3. Click "Sign up with Google" button
4. Complete Google OAuth
5. **Verify**: Display name should be extracted from Google profile
6. **Verify in Database**: `first_name`, `last_name`, and `display_name` populated from Google metadata

### Test 3: Database Trigger Verification
Run this SQL query to verify the trigger is working:

```sql
-- Check if the trigger exists
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_simple';

-- Check a newly created user's profile
SELECT
    user_id,
    first_name,
    last_name,
    display_name,
    email,
    created_at
FROM users_profile
ORDER BY created_at DESC
LIMIT 5;
```

### Test 4: Fallback Logic
Test what happens when names are not provided (edge case):
- Create user via admin panel without metadata
- **Expected**: display_name should fallback to email username

## Expected Results

### ✅ Success Criteria
- [ ] First name and last name fields appear in signup form
- [ ] Names are required for email signup
- [ ] Names persist to sessionStorage
- [ ] Names are passed to Supabase user metadata
- [ ] Database trigger extracts names from metadata
- [ ] Complete-profile page shows pre-filled display name
- [ ] Database stores first_name, last_name, and display_name correctly
- [ ] Google OAuth still works and extracts names from Google profile

### ❌ Potential Issues to Watch For
- Names not appearing in complete-profile page → Check sessionStorage
- Names not in database → Check trigger execution
- Display name still showing email → Check metadata extraction
- Handle generation fails → Check name sanitization logic

## Quick Verification Query

```sql
-- After signing up a test user, run this to verify all fields are populated:
SELECT
    up.user_id,
    up.first_name,
    up.last_name,
    up.display_name,
    up.handle,
    up.email,
    au.raw_user_meta_data->>'first_name' as meta_first_name,
    au.raw_user_meta_data->>'last_name' as meta_last_name,
    au.raw_user_meta_data->>'full_name' as meta_full_name
FROM users_profile up
JOIN auth.users au ON au.id = up.user_id
ORDER BY up.created_at DESC
LIMIT 5;
```

## Rollback Plan (if needed)

If the migration causes issues, run:
```sql
-- Revert to previous trigger version
DROP FUNCTION IF EXISTS handle_new_user_simple() CASCADE;
-- Then apply the previous migration
```
