# 🔐 Supabase Google OAuth Setup Guide

## 🎯 Overview

This guide will help you configure Google OAuth authentication with Supabase for your Preset platform.

## 📋 Prerequisites

- ✅ Google Cloud Console project created
- ✅ OAuth client ID and secret generated
- ✅ Supabase project set up
- ✅ Domain verification completed

---

## 🚀 Step-by-Step Setup

### **Step 1: Configure Supabase Auth Providers**

1. **Go to your Supabase Dashboard**
   - Navigate to: `https://supabase.com/dashboard`
   - Select your project

2. **Enable Google Provider**
   - Go to **Authentication** > **Providers**
   - Find **Google** and toggle it **ON**
   - Click **Configure**

3. **Add Google Credentials**
   - **Client ID**: Paste your Google OAuth Client ID
   - **Client Secret**: Paste your Google OAuth Client Secret
   - **Redirect URL**: Copy the provided Supabase redirect URL

### **Step 2: Update Google OAuth Configuration**

1. **Go back to Google Cloud Console**
   - Navigate to: **APIs & Services** > **Credentials**
   - Click on your OAuth 2.0 Client ID

2. **Add Supabase Redirect URI**
   - In **Authorized redirect URIs**, add:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   - Replace `your-project-ref` with your actual Supabase project reference

### **Step 3: Configure OAuth Consent Screen**

1. **Go to OAuth consent screen**
   - Navigate to: **APIs & Services** > **OAuth consent screen**

2. **Fill out required fields**:
   - **App name**: `Preset Platform`
   - **User support email**: `support@presetie.com`
   - **App domain**: `presetie.com`
   - **Developer contact**: Your email

3. **Add scopes**:
   ```
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

4. **Add test users** (for development):
   - Add your email address
   - Add any other test users

### **Step 4: Environment Variables**

Update your `.env` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (if needed for additional features)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### **Step 5: Test the Integration**

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test Google Sign-In**:
   - Go to `/auth/signin`
   - Click "Continue with Google"
   - Complete the OAuth flow
   - Verify user is created in Supabase

3. **Test Profile Creation**:
   - After Google sign-in, you should be redirected to `/auth/create-profile`
   - Verify form is pre-filled with Google profile data
   - Complete profile creation

---

## 🔧 Advanced Configuration

### **Custom Redirect URLs**

If you need custom redirect URLs, update your Supabase configuration:

```typescript
// In your auth context
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
})
```

### **User Metadata Handling**

Google OAuth provides rich user metadata:

```typescript
// Available in user.user_metadata for Google users:
{
  avatar_url: "https://lh3.googleusercontent.com/...",
  email: "user@gmail.com",
  email_verified: true,
  full_name: "John Doe",
  given_name: "John",
  family_name: "Doe",
  name: "John Doe",
  picture: "https://lh3.googleusercontent.com/...",
  provider_id: "123456789",
  sub: "123456789"
}
```

### **Profile Auto-Creation**

The profile creation page automatically pre-fills Google user data:

```typescript
// Auto-fill logic in create-profile page
if (isGoogleUser && metadata) {
  setFormData(prev => ({
    ...prev,
    firstName: metadata.given_name || '',
    lastName: metadata.family_name || '',
    displayName: metadata.full_name || '',
    handle: metadata.given_name?.toLowerCase() + metadata.family_name?.toLowerCase() || ''
  }))
}
```

---

## 🧪 Testing Checklist

### **✅ Basic OAuth Flow**
- [ ] Google Sign-In button appears on signin/signup pages
- [ ] Clicking button redirects to Google OAuth
- [ ] User can grant permissions
- [ ] User is redirected back to your app
- [ ] User session is created in Supabase

### **✅ Profile Creation**
- [ ] Google users are redirected to profile creation
- [ ] Form is pre-filled with Google data
- [ ] User can complete profile creation
- [ ] Profile is saved to database
- [ ] User is redirected to dashboard

### **✅ Email Integration**
- [ ] Welcome email is sent to Google users
- [ ] Email templates use correct branding
- [ ] Email service works with Google Workspace

---

## 🚨 Troubleshooting

### **Common Issues**

1. **"Invalid redirect URI"**
   - Check that Supabase redirect URI is added to Google OAuth
   - Verify the URI matches exactly (including https/http)

2. **"Access blocked"**
   - Ensure OAuth consent screen is configured
   - Add test users for development
   - Verify app domain is correct

3. **"User not created in Supabase"**
   - Check Supabase Auth logs
   - Verify Google provider is enabled
   - Check environment variables

4. **"Profile not pre-filled"**
   - Check user metadata in Supabase Auth
   - Verify Google scopes include profile information
   - Check browser console for errors

### **Debug Steps**

1. **Check Supabase Auth Logs**:
   - Go to Supabase Dashboard > Authentication > Logs
   - Look for OAuth-related errors

2. **Check Browser Console**:
   - Open Developer Tools
   - Look for JavaScript errors during OAuth flow

3. **Verify Environment Variables**:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Provider Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## 🎉 Success!

Once configured, your Preset platform will have:

- ✅ **Google Sign-In** on all auth pages
- ✅ **Automatic profile creation** with Google data
- ✅ **Seamless user experience** 
- ✅ **Email notifications** for new Google users
- ✅ **Database integration** with user profiles

**Your users can now sign in with Google and have their profiles automatically created! 🚀**
