# 🗂️ Storage Policies Setup Instructions

I've created separate policy documents for each bucket so you can apply them manually through the Supabase Dashboard.

## 📋 **Files Created:**

1. **`USER_MEDIA_POLICIES.sql`** - 4 policies for user-media bucket
2. **`MOODBOARD_IMAGES_POLICIES.sql`** - 4 policies for moodboard-images bucket  
3. **`PROFILE_IMAGES_ADDITIONAL_POLICIES.sql`** - Optional admin policy (your bucket is already complete)

## 🔧 **How to Apply Each Policy:**

### **Step 1: Navigate to Storage**
1. Open **Supabase Dashboard**
2. Go to **Storage** section
3. Select the bucket you want to configure

### **Step 2: Create New Policy**
1. Click **"New policy"** button
2. Fill in the form with details from the policy files
3. Copy the expressions exactly as written

### **Step 3: Policy Form Fields**
- **Policy Name**: Copy from the file (e.g., "Users can upload to user-media")
- **Policy Type**: INSERT, UPDATE, DELETE, or SELECT
- **Target Roles**: authenticated or public
- **USING Expression**: Copy the conditions
- **WITH CHECK Expression**: Copy if provided, otherwise leave empty

## 📊 **Required Policies by Bucket:**

### **🗂️ USER-MEDIA (Priority: HIGH)**
**Status**: ❌ No policies (needs all 4)
- Upload policy (INSERT)
- Update policy (UPDATE) 
- Delete policy (DELETE)
- Public read policy (SELECT)

### **🎨 MOODBOARD-IMAGES (Priority: HIGH)**
**Status**: ❌ No policies (needs all 4)  
- Upload policy (INSERT)
- Update policy (UPDATE)
- Delete policy (DELETE) 
- Public read policy (SELECT)

### **👤 PROFILE-IMAGES (Priority: LOW)**
**Status**: ✅ Already complete (4 policies exist)
- Optional: Admin management policy

## ⚠️ **Important Notes:**

- **Apply policies in order** (INSERT → UPDATE → DELETE → SELECT)
- **Double-check the bucket name** in each expression
- **Don't skip the public SELECT policies** - they're needed for image viewing
- **Test upload/view after applying** each bucket's policies

## 🧪 **Testing Your Policies:**

After applying policies for each bucket, test:

1. **Upload an image** via moodboard builder
2. **View the image** in a gig or moodboard  
3. **Delete an image** you uploaded
4. **Try accessing another user's image** (should fail for private operations)

Your policies will enable secure file uploads while allowing public viewing for shared content like moodboards and gig images.