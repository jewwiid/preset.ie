# Admin User Backup Solution

## 🚨 Emergency Admin Recovery

If the admin user gets lost or corrupted, use this script to restore it:

**File**: `create-admin-backup-solution.sql`

## 📋 Admin Credentials

- **Email**: `admin@preset.ie`
- **Password**: `Admin123!@#`
- **Role**: `ADMIN`
- **User ID**: `550e8400-e29b-41d4-a716-446655440000`

## 🔧 How to Use

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `create-admin-backup-solution.sql`
3. Click "Run"
4. Verify the success message shows all records created
5. Test sign-in with the credentials above

## 📁 Backup Files

Old admin creation attempts have been moved to:
- `sql-backups/admin-creation-attempts/`

## ✅ What This Script Creates

1. **auth.users** - Core authentication record
2. **public.users** - User role and subscription info
3. **users_profile** - Profile information
4. **user_settings** - User preferences
5. **user_credits** - Credit balance and subscription
6. **notification_preferences** - Notification settings

## 🎯 Success Indicators

The script will show:
- ✅ All 6 records created successfully
- ✅ Admin user ready for sign-in
- ✅ Proper role assignment (ADMIN)
- ✅ Credit balance initialized (1000)

## 🔒 Security Notes

- Password is properly encrypted using `crypt()` function
- Email is confirmed for immediate sign-in
- All records use consistent UUID for data integrity
- No ON CONFLICT clauses to avoid constraint errors

---

**Last Updated**: September 18, 2025
**Status**: ✅ Tested and Working
