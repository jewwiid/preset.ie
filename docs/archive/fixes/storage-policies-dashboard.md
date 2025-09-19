# Storage Bucket RLS Policies Setup Guide

## ⚠️ Permission Issue
The error "42501: must be owner of table objects" occurs because you don't have direct SQL access to modify the `storage.objects` table. This is normal in Supabase's managed service.

## 🎯 Solution: Use Supabase Dashboard

### Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: `https://supabase.com/dashboard/project/[your-project-id]`

2. **Access Storage Settings**
   - Go to **Storage** → **Policies**
   - Or go to **Authentication** → **Policies** → **Storage**

3. **Create Policies for Each Bucket**

#### For `moodboard-uploads` bucket:

**Policy 1: Upload Access**
- **Policy Name**: `Users can upload to moodboard-uploads`
- **Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'moodboard-uploads'`
- **WITH CHECK expression**: `auth.uid()::text = (storage.foldername(name))[1]`

**Policy 2: View Access**
- **Policy Name**: `Users can view moodboard-uploads`
- **Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'moodboard-uploads' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 3: Update Access**
- **Policy Name**: `Users can update moodboard-uploads`
- **Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'moodboard-uploads' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 4: Delete Access**
- **Policy Name**: `Users can delete moodboard-uploads`
- **Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'moodboard-uploads' AND auth.uid()::text = (storage.foldername(name))[1]`

#### For `playground-gallery` bucket:

**Policy 5: Upload Access**
- **Policy Name**: `Users can upload to playground-gallery`
- **Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'playground-gallery'`
- **WITH CHECK expression**: `auth.uid()::text = (storage.foldername(name))[1]`

**Policy 6: View Access**
- **Policy Name**: `Users can view playground-gallery`
- **Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'playground-gallery' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 7: Update Access**
- **Policy Name**: `Users can update playground-gallery`
- **Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'playground-gallery' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 8: Delete Access**
- **Policy Name**: `Users can delete playground-gallery`
- **Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'playground-gallery' AND auth.uid()::text = (storage.foldername(name))[1]`

### Method 2: Alternative SQL Approach

If you have a service role key, you can try this approach:

```sql
-- Enable RLS (this might work)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies using service role
-- Note: You'll need to run this with your service role key
```

### Method 3: Contact Supabase Support

If neither method works, you can:
1. Contact Supabase support
2. Ask them to enable RLS policies on your storage buckets
3. Provide them with the policy requirements

## 🔍 Verification

After setting up policies, you can verify they're working by:

1. **Check in Dashboard**: Go to Storage → Policies and see your policies listed
2. **Test Upload**: Try uploading a file through your app
3. **Test Access**: Try accessing files from different user accounts

## 📝 Important Notes

- **Folder Structure**: Policies assume files are stored as `{user_id}/filename.ext`
- **Authentication**: All policies require `authenticated` role
- **Public Access**: The `playground-gallery` bucket is public, so some policies might not be needed
- **Showcase Access**: You may need additional policies for public showcase viewing

## 🚀 Quick Test

Once policies are set up, test with:

```javascript
// Test upload
const { data, error } = await supabase.storage
  .from('playground-gallery')
  .upload(`${user.id}/test-image.jpg`, file)

// Test download
const { data } = await supabase.storage
  .from('playground-gallery')
  .download(`${user.id}/test-image.jpg`)
```

## 📞 Need Help?

If you're still having issues:
1. Check your Supabase project permissions
2. Verify you're using the correct project
3. Contact Supabase support with your project details
