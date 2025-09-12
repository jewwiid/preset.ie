# Admin User Setup Instructions for Supabase

This document provides step-by-step instructions to fix and set up the admin authentication in your Supabase database.

## Overview

The admin user setup involves:
- **Email**: `admin@preset.ie`
- **Password**: `Admin123!@#`
- **Role**: `ADMIN` with `PRO` subscription tier
- **Handle**: `admin`
- **Verification**: Fully verified (email + ID)

## Files Created

1. **`check_admin_state.sql`** - Diagnostic script to check current admin state
2. **`fix_admin_authentication.sql`** - Main script to create/reset admin user
3. **`admin_user_functions.sql`** - Helper functions for admin management

## Step-by-Step Instructions

### Step 1: Check Current State (Optional but Recommended)

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `check_admin_state.sql`
4. Click **Run** to see the current state of admin authentication

This will show you:
- Whether admin@preset.ie exists in auth.users
- If there are entries in public.users and profiles
- Current table structures

### Step 2: Set Up Helper Functions

1. In the **Supabase SQL Editor**
2. Copy and paste the contents of `admin_user_functions.sql`
3. Click **Run** to create the helper functions

These functions will help with:
- Creating admin users programmatically
- Resetting passwords
- Checking admin status
- Ensuring proper permissions

### Step 3: Fix/Create Admin User

1. In the **Supabase SQL Editor**
2. Copy and paste the contents of `fix_admin_authentication.sql`
3. Click **Run** to execute the main fix script

This script will:
- Remove any existing admin@preset.ie user (clean slate)
- Create new admin user in auth.users with proper password hash
- Create corresponding entries in public.users and profiles
- Set up all required permissions and verification status

### Step 4: Verify Setup

After running the main script, you should see verification output showing:
- Admin user ID
- Email confirmation status
- Role and subscription tier
- Profile information

### Step 5: Test Login

1. Go to your application's login page
2. Use these credentials:
   - **Email**: `admin@preset.ie`
   - **Password**: `Admin123!@#`
3. Verify that you can log in successfully

## Alternative Approach Using Helper Functions

If you prefer to use the helper functions instead of the main script:

```sql
-- Create admin user using helper function
SELECT create_admin_user('admin@preset.ie', 'Admin123!@#', 'admin', 'Admin User');

-- Check status
SELECT * FROM check_admin_status('admin@preset.ie');

-- Reset password if needed
SELECT reset_admin_password('admin@preset.ie', 'Admin123!@#');

-- Ensure permissions are correct
SELECT ensure_admin_permissions('admin@preset.ie');
```

## Troubleshooting

### Issue: "Permission denied" error
- Make sure you're running the scripts with **service_role** permissions in Supabase
- Use the SQL Editor in Supabase Dashboard, not a regular database client

### Issue: "User already exists" error
- Run the `check_admin_state.sql` script first to see current state
- The main script should handle cleanup, but you can manually delete if needed

### Issue: Login fails after setup
- Check password hash was created correctly
- Verify email_confirmed_at is set in auth.users
- Ensure public.users has is_active = true

### Issue: Admin role not working
- Check that public.users has role = 'ADMIN'
- Verify subscription_tier = 'PRO'
- Ensure verification_status = 'ID_VERIFIED'

## Security Notes

- The password `Admin123!@#` is for initial setup only
- Change it immediately after first login
- Consider enabling 2FA for the admin account
- Use strong, unique passwords in production

## Database Schema Overview

The admin user setup touches three main tables:

1. **auth.users** - Supabase authentication table
   - Stores encrypted password and email confirmation
   - Managed by Supabase Auth

2. **public.users** - Application user table
   - Stores role, subscription, verification status
   - Links to auth.users via foreign key

3. **public.profiles** - User profile information
   - Stores handle, display name, bio, etc.
   - Links to users table via foreign key

## Next Steps

After successful setup:

1. **Test admin functionality** in your application
2. **Change the default password** through your app's UI
3. **Set up admin-specific routes** and permissions
4. **Configure admin dashboard** features
5. **Set up monitoring** for admin activities

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify RLS policies allow admin operations
3. Ensure your application code handles ADMIN role correctly
4. Check that all required tables and columns exist

---

**Created**: $(date)
**Version**: 1.0
**Status**: Ready for execution