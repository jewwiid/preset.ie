# Supabase Session Conflict Fix

## Problem
Avatar uploads were failing with RLS policy errors because the application had **two different Supabase clients** with different session storage:

1. **SSR Client** (`/lib/supabase/client.ts`) - Used by auth context, default storage
2. **Old Client** (`/lib/supabase.ts`) - Used by ~100 components, custom `'sb-auth-token'` storage key

This caused:
- Auth context had user session `c231dca2-2973-46f6-98ba-a20c51d71b69`
- Upload components had cached session `a7138172-d10e-417a-acbf-e346616ea70c`
- JWT token didn't match the upload path → RLS policy violation

## Root Cause
Per [Supabase Session Docs](https://supabase.com/docs/guides/auth/sessions):
> When you create multiple Supabase clients, they don't automatically share sessions. Each client instance maintains its own session state.

## Solution
Updated `/lib/supabase.ts` to be a **wrapper around the SSR client**:

```typescript
// OLD - Created separate client with different storage
export const supabase = createClient(url, key, {
  auth: { storageKey: 'sb-auth-token' } // Different storage!
})

// NEW - Wraps SSR client for consistency
export const supabase = typeof window !== 'undefined' ? createSSRClient() : null
```

## Benefits
✅ **All 100 files** using old import now use the same session
✅ **No code changes** needed in those 100 files
✅ **Session consistency** across entire app
✅ **RLS policies work** correctly

## Best Practices Going Forward

### ✅ DO:
- Import from `./lib/supabase/client` for new code
- Use `createClient()` from `@supabase/ssr`
- Share a single client instance across your app

### ❌ DON'T:
- Create multiple Supabase clients with different configs
- Use custom `storageKey` unless absolutely necessary
- Import from the deprecated `/lib/supabase.ts` in new code

## Files Changed
1. `/lib/supabase.ts` - Now wraps SSR client
2. `/components/profile/layout/ProfileHeaderEnhanced.tsx` - Uses SSR client
3. `/components/profile/context/ProfileContext.tsx` - Uses SSR client

## Testing
1. Clear browser storage (localStorage, sessionStorage)
2. Restart dev server
3. Sign in with one account
4. Upload avatar → Should work without RLS errors

## Migration Plan
- [x] Fix immediate session conflict
- [ ] Gradually migrate 100 files to import from `/lib/supabase/client` directly
- [ ] Eventually deprecate `/lib/supabase.ts` completely
