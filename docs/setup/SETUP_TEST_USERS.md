# 🧪 Test Users Setup Guide

Since the automated scripts are having issues, let's create test users manually through the web interface.

## 📋 **Step-by-Step Setup**

### **1. Create Admin User**

**Visit**: http://localhost:3000/auth/signup

**Complete the full signup flow:**
- **Role**: Choose "I do both" (Contributor + Talent)
- **Email**: `admin@preset.ie`
- **Password**: `Admin123!@#`
- **Date of Birth**: Any date (must be 18+)
- **Agree to terms**: ✅
- **Display Name**: `Admin User`
- **Handle**: `admin_user`
- **Bio**: `Platform Administrator`
- **City**: `Dublin`
- **Style Tags**: Choose any (e.g., Professional, Administrative)
- **Complete signup**

### **2. Promote to Admin**

After completing signup, run this command:

```bash
node scripts/promote-to-admin.js admin@preset.ie
```

This will automatically:
- ✅ Find the user by email
- ✅ Update their role to ADMIN
- ✅ Set subscription to PRO
- ✅ Mark as verified
- ✅ Enable admin panel access

### **3. Create Marcus Chen (Test User)**

**Visit**: http://localhost:3000/auth/signup

**Complete the full signup flow:**
- **Role**: Choose "I do both" (Contributor + Talent)
- **Email**: `marcus@test.com`
- **Password**: `TestPassword123!`
- **Date of Birth**: Any date (must be 18+)
- **Agree to terms**: ✅
- **Display Name**: `Marcus Chen`
- **Handle**: `marcus_model`
- **Bio**: `Professional photographer specializing in portraits and fashion photography. Available for creative collaborations.`
- **City**: `Los Angeles`
- **Style Tags**: Choose any (e.g., Portrait, Fashion, Editorial)
- **Complete signup**

### **4. Test Username Login**

After both users are created:

**Test with Marcus Chen:**
1. **Go to**: http://localhost:3000/auth/signin
2. **Try email**: `marcus@test.com` + `TestPassword123!` ✅
3. **Try username**: `marcus_model` + `TestPassword123!` ✅ (if RPC function is working)
4. **Try @username**: `@marcus_model` + `TestPassword123!` ✅ (if RPC function is working)

**Test admin access:**
1. **Sign in**: `admin@preset.ie` + `Admin123!@#`
2. **Visit**: http://localhost:3000/admin
3. **Check**: Should have admin panel access

## 🔧 **Troubleshooting**

### **If Username Login Doesn't Work:**
The RPC function might need to be refreshed. Run this in Supabase SQL Editor:

```sql
-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Or test the function directly
SELECT resolve_username_to_email('marcus_model');
```

### **If Admin Panel Access is Denied:**
Make sure the role_flags array includes 'ADMIN':

```sql
-- Check current roles
SELECT role_flags FROM users_profile 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@preset.ie');

-- Fix if needed
UPDATE users_profile 
SET role_flags = ARRAY['ADMIN', 'CONTRIBUTOR', 'TALENT']
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@preset.ie');
```

## 🎯 **What This Achieves**

- ✅ **Admin user** with full platform access
- ✅ **Marcus Chen** for username login testing  
- ✅ **Test verification system** (admin can review Marcus's requests)
- ✅ **Test username login** (both email and username formats)

## 📝 **Login Credentials Summary**

**Admin User:**
- Email: `admin@preset.ie`
- Password: `Admin123!@#`
- Username: `admin_user`

**Marcus Chen (Test User):**
- Email: `marcus@test.com`
- Password: `TestPassword123!`
- Username: `marcus_model`

Both users can now test the complete authentication and admin functionality!