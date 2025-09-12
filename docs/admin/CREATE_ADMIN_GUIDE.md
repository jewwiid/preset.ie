# 🔧 Create Admin User - Manual Guide

Since the automated admin creation is having issues, here's a simple manual process:

## 📋 **Step 1: Create User Account**

1. **Visit**: http://localhost:3000/auth/signup
2. **Complete the signup flow**:
   - Choose role: **"I do both"** (Contributor + Talent)
   - Email: `admin@preset.ie`
   - Password: `Admin123!@#`
   - Date of Birth: Any date (must be 18+)
   - Agree to terms
   - Display Name: `Admin User`
   - Handle: `admin_user`
   - Bio: `Platform Administrator`
   - City: `Dublin`
   - Choose some style tags
   - Complete signup

## 📋 **Step 2: Promote to Admin**

After completing signup, run this command:

```bash
node scripts/promote-to-admin.js admin@preset.ie
```

This will:
- ✅ Find the user by email
- ✅ Update their role to ADMIN
- ✅ Set subscription to PRO
- ✅ Mark as verified
- ✅ Enable admin panel access

## 📋 **Step 3: Verify Admin Access**

1. **Sign in**: http://localhost:3000/auth/signin
   - Email: `admin@preset.ie`
   - Password: `Admin123!@#`

2. **Test admin panel**: http://localhost:3000/admin
   - Should see admin dashboard
   - Should have access to verification queue
   - Should see user management

## 📋 **Step 4: Create Test User (Optional)**

To test the verification system:

1. **Sign up another user**:
   - Email: `marcus@test.com`
   - Password: `TestPassword123!`
   - Handle: `marcus_model`
   - Display Name: `Marcus Chen`

2. **Test verification**:
   - Visit: http://localhost:3000/verify
   - Submit a verification request
   - Review it in admin panel

## 🎯 **What This Achieves**

- ✅ **Admin user** with full platform access
- ✅ **Admin panel** access for verification system
- ✅ **Test user** for verification testing
- ✅ **Complete verification workflow** testing

## 🚀 **Quick Commands**

```bash
# Promote user to admin
node scripts/promote-to-admin.js admin@preset.ie

# Check existing users
node scripts/check-existing-users.js

# Create test user (if needed)
node scripts/create-test-user.js
```

## 🔧 **Troubleshooting**

If promotion fails:
1. Make sure the user completed the full signup flow
2. Check that the email matches exactly
3. Verify the user profile was created successfully

The admin user will have access to:
- **Admin Dashboard**: `/admin`
- **Verification Queue**: Review verification requests
- **User Management**: Manage users and roles
- **Platform Analytics**: View platform statistics
