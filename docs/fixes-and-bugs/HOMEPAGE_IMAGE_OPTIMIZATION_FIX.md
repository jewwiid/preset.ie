# Homepage Image Optimization Fix

## Problem Summary

The homepage was experiencing two main issues:

1. **Image 400 Bad Request Errors**: Images were failing to load with 400 errors in the browser console
2. **Video Loading Failures**: Videos from CloudFront were failing to load silently

## Root Cause

The issue was caused by **double image optimization**:
- The `optimizeSupabaseImage()` function adds Supabase's imgproxy query parameters to image URLs
- These pre-parameterized URLs were then passed to Next.js `<Image>` component
- Next.js tried to optimize them again through its own image optimization API at `/_next/image`
- This resulted in double-encoded URLs causing 400 Bad Request errors

Example of the problematic flow:
```
Original URL: https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/.../image.jpg
↓ optimizeSupabaseImage() adds parameters
https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/.../image.jpg?width=600&height=600&quality=85&format=webp&resize=cover
↓ Next.js Image tries to optimize again
/_next/image?url=https%3A%2F%2F...%26width%3D600%26height%3D600%26quality%3D85... → 400 Error
```

## Solution

Removed the `optimizeSupabaseImage()` wrapper when using Next.js `<Image>` component. Next.js will handle all image optimization internally through its image API, which is the recommended approach.

### Changes Made

#### Files Modified:

1. **FeaturedWorkSection.tsx**
   - Removed `optimizeSupabaseImage` imports
   - Changed image sources from `optimizeSupabaseImage(url, size)` to just `url`
   - Added better video error handling to hide videos that fail to load

2. **HeroSection.tsx**
   - Removed `optimizeSupabaseImage` imports
   - Direct URL usage with Next.js Image component

3. **AboutSection.tsx**
   - Removed `optimizeSupabaseImage` imports
   - Direct URL usage with Next.js Image component

4. **TalentForHireSection.tsx**
   - Removed `optimizeSupabaseImage` imports
   - Fixed all three image usages (cover, talent avatars, category images)

5. **ContributorSection.tsx**
   - Removed `optimizeSupabaseImage` imports
   - Fixed all three image usages (cover, contributor avatars, category images)

6. **CreativeRolesSection.tsx**
   - Removed `optimizeSupabaseImage` imports
   - Fixed role card images

7. **WhatYouCanDoSection.tsx**
   - Removed `optimizeSupabaseImage` imports
   - Fixed both "For Contributors" and "For Talents" section images

### Technical Details

**Before:**
```tsx
<Image
  src={optimizeSupabaseImage(imageUrl, IMAGE_SIZES.thumbnail)}
  alt="..."
  fill
  quality={80}
/>
```

**After:**
```tsx
<Image
  src={imageUrl}
  alt="..."
  fill
  quality={80}
/>
```

The `quality`, `sizes`, and other optimization parameters are now handled entirely by Next.js's image optimization API, which:
- Automatically optimizes images based on device size
- Serves modern formats (WebP, AVIF) when supported
- Caches optimized images for better performance
- Respects the `remotePatterns` configuration in `next.config.js`

### Video Error Handling

Enhanced video error handling in `FeaturedWorkSection.tsx`:
```tsx
<video
  src={mediaUrl}
  onError={(e) => {
    console.error('Video failed to load:', mediaUrl);
    (e.target as HTMLVideoElement).style.display = 'none';
  }}
/>
```

Videos that fail to load are now hidden instead of showing a broken element.

## Benefits

1. ✅ **Fixed 400 errors**: No more double-encoded URLs
2. ✅ **Better performance**: Next.js optimization is automatic and efficient
3. ✅ **Simpler code**: Removed unnecessary wrapper function calls
4. ✅ **Better caching**: Next.js handles image caching with optimal TTL
5. ✅ **Responsive images**: Automatic format and size selection based on device
6. ✅ **Graceful degradation**: Failed videos now hide instead of showing errors

## Testing

To verify the fix:
1. Clear browser cache
2. Open homepage at `http://localhost:3000`
3. Check browser console - no 400 errors should appear
4. Verify all images load correctly
5. Check Network tab - images should load through `/_next/image` API successfully

## Best Practices Going Forward

**When using Next.js `<Image>` component:**
- ❌ Do NOT use `optimizeSupabaseImage()` wrapper
- ✅ Pass raw Supabase URLs directly to the `src` prop
- ✅ Let Next.js handle all optimization through its API

**When using regular `<img>` tags or non-Next.js contexts:**
- ✅ Can use `optimizeSupabaseImage()` for Supabase's imgproxy optimization
- ✅ Useful for server-side rendering or non-React contexts

## Related Configuration

The `next.config.js` already has the correct configuration for Supabase domains:
```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'zbsmgymyfhnwjdnmlelr.supabase.co',
      pathname: '/**',
    },
    // ... other patterns
  ]
}
```

## Date

Fixed: October 12, 2025

