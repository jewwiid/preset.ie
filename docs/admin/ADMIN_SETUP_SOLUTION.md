# 🔧 Admin Setup Solution

## 🚨 **Current Issue**
The Supabase project is experiencing a "Database error saving new user" (500 error) when trying to create new users. This is preventing the normal signup flow from working.

## 🎯 **Immediate Solution**

Since the automated user creation is failing, here are your options:

### **Option 1: Use Supabase Dashboard (Recommended)**

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Navigate to your project: `zbsmgymyfhnwjdnmlelr`

2. **Create Admin User via Auth**:
   - Go to **Authentication** → **Users**
   - Click **"Add user"**
   - Enter:
     - **Email**: `admin@preset.ie`
     - **Password**: `Admin123!@#`
     - **Email Confirmed**: ✅ (check this)
   - Click **"Create user"**

3. **Create User Profile**:
   - Go to **Table Editor** → **users_profile**
   - Click **"Insert"** → **"Insert row"**
   - Enter:
     - **user_id**: (copy from the user you just created)
     - **display_name**: `Admin User`
     - **handle**: `admin_user`
     - **bio**: `Platform Administrator`
     - **city**: `Dublin`
     - **role_flags**: `["ADMIN", "CONTRIBUTOR", "TALENT"]`
     - **subscription_tier**: `PRO`
     - **subscription_status**: `ACTIVE`
     - **verified_id**: `true`

4. **Test Admin Access**:
   - Visit: http://localhost:3000/auth/signin
   - Sign in with: `admin@preset.ie` / `Admin123!@#`
   - Visit: http://localhost:3000/admin

### **Option 2: Fix Database Issue**

The root cause might be:
1. **Missing database functions** (exec_sql not available)
2. **RLS policies blocking user creation**
3. **Database constraints or triggers causing issues**

**To investigate further**:
1. Check Supabase Dashboard → **Database** → **Logs**
2. Look for any error messages during user creation
3. Check if there are any database triggers or functions causing issues

### **Option 3: Reset Supabase Project**

If the database is corrupted:
1. **Create a new Supabase project**
2. **Update environment variables** in `.env.local`
3. **Run database migrations** from scratch
4. **Test user creation**

## 🚀 **Quick Test Commands**

```bash
# Check current users
node scripts/check-existing-users.js

# Test signup process
node scripts/test-signup.js

# Check database schema
node scripts/check-database-schema.js
```

## 📋 **What This Achieves**

Once you have an admin user:
- ✅ **Admin Panel Access**: Full admin dashboard
- ✅ **Verification System**: Review verification requests
- ✅ **User Management**: Manage users and roles
- ✅ **Platform Analytics**: View platform statistics

## 🔧 **Next Steps**

1. **Create admin user** using Option 1 (Supabase Dashboard)
2. **Test admin access** at http://localhost:3000/admin
3. **Test verification system** by creating a test user
4. **Investigate database issue** if you want to fix the root cause

The admin user will have full access to all platform features and can help you test the verification system! 🎉
