# 🆔 User ID Clarification - Which ID to Use?

## 🔍 Database Structure Analysis

### Your Database Has TWO Types of User IDs:

```
┌─────────────────────────────────┐
│   auth.users (Supabase Auth)    │
│   ├── id ← AUTH USER ID         │ ⭐ USE THIS FOR EMAIL PREFERENCES
│   ├── email                      │
│   ├── password (hashed)          │
│   └── created_at                 │
└─────────────┬───────────────────┘
              │ Referenced by user_id
              ↓
┌─────────────────────────────────┐
│   users_profile (App Data)      │
│   ├── id ← PROFILE ID           │
│   ├── user_id → auth.users.id   │ ⭐ This links to auth
│   ├── display_name               │
│   ├── handle                     │
│   └── ...                        │
└─────────────┬───────────────────┘
              │ Referenced by owner_user_id
              ↓
┌─────────────────────────────────┐
│   gigs, applications, etc       │
│   └── owner_user_id → users_profile.id │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   notification_preferences      │
│   └── user_id → auth.users.id   │ ⭐ Uses AUTH USER ID
└─────────────────────────────────┘
```

---

## ✅ CORRECT ID to Use: **Auth User ID**

### Why Auth User ID (`auth.users.id`)?

```sql
-- notification_preferences table
CREATE TABLE notification_preferences (
    user_id UUID NOT NULL REFERENCES auth.users(id),  ← Points to auth.users!
    ...
);
```

**✅ Use:** `auth.users.id` (Auth User ID)  
**❌ Don't use:** `users_profile.id` (Profile ID)

---

## 📊 ID Type Comparison

| ID Type | Table | Field | When to Use |
|---------|-------|-------|-------------|
| **Auth User ID** | `auth.users` | `id` | ✅ Email preferences, auth, sessions |
| **Profile ID** | `users_profile` | `id` | Gigs, applications, showcases |
| **Link Field** | `users_profile` | `user_id` | Links profile to auth user |

---

## 🎯 Correct Usage

### ✅ For Email Preferences:

```typescript
// CORRECT - Use auth user ID
const authUserId = user.id; // From auth context or session

const checker = getEmailPreferenceChecker();
await checker.shouldSendEmail(authUserId, 'gig');
//                            ↑ auth.users.id

await supabase
  .from('notification_preferences')
  .select('*')
  .eq('user_id', authUserId); // ✅ Correct
  //           ↑ auth.users.id
```

### ❌ Wrong - Don't Use Profile ID:

```typescript
// WRONG - Don't use profile ID for preferences
const profileId = profile.id; // From users_profile

await checker.shouldSendEmail(profileId, 'gig'); // ❌ Wrong table!
```

---

## 🔧 How to Get the Correct ID

### In API Routes (Server-Side):

```typescript
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  // Get auth user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const authUserId = user.id; // ✅ This is auth.users.id
    const email = user.email;    // ✅ Email from auth
    
    // Use for email preferences
    await checker.shouldSendEmail(authUserId, 'gig');
  }
}
```

### In Client Components:

```typescript
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user } = useAuth();
  
  if (user) {
    const authUserId = user.id; // ✅ This is auth.users.id
  }
}
```

### Get Both IDs:

```typescript
// If you need both auth ID and profile ID:
const { data: { user } } = await supabase.auth.getUser();
const authUserId = user.id; // auth.users.id

const { data: profile } = await supabase
  .from('users_profile')
  .select('*')
  .eq('user_id', authUserId) // Link via user_id
  .single();

const profileId = profile.id; // users_profile.id

// Use authUserId for email preferences
// Use profileId for business logic (gigs, applications)
```

---

## 📋 Correct Implementation

### EmailPreferenceChecker Service ✅

**Current implementation is CORRECT:**

```typescript
async shouldSendEmail(userId: string, category: EmailCategory) {
  // userId here should be auth.users.id ✅
  
  const { data: preferences } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId); // ✅ Correct - matches auth.users.id
}
```

---

### EmailEventsService Methods

**Need to use AUTH USER ID:**

```typescript
// ✅ CORRECT
async sendWelcomeEmail(
  authUserId: string,  // auth.users.id
  email: string,
  name: string,
  role: string
) {
  // Check preferences with auth ID
  const checker = getEmailPreferenceChecker();
  const { shouldSend } = await checker.shouldSendEmail(authUserId, 'system');
  
  if (!shouldSend) return;
  
  // Send email
  await this.plunk.sendTransactionalEmail({
    to: email,
    subject: 'Welcome to Preset',
    body: templates.getWelcomeEmailTemplate(name, role, email, authUserId),
  });
}
```

---

## 🔄 Variable Naming Convention

### Recommended Naming:

```typescript
// ✅ Clear and explicit
const authUserId = user.id;        // From auth.users
const profileId = profile.id;      // From users_profile
const userAuthId = user.id;        // Alternative
const userProfileId = profile.id;  // Alternative

// ⚠️ Ambiguous (avoid)
const userId = ???; // Which user ID?

// ❌ Wrong
const id = user.id; // Too generic
```

---

## 📊 Summary Table

| What You're Doing | Which ID | Field Name | Table |
|-------------------|----------|------------|-------|
| **Check email preferences** | Auth User ID | `user.id` | `auth.users` |
| **Send email** | Auth User ID | `user.id` | `auth.users` |
| **Unsubscribe** | Auth User ID | `user.id` | `auth.users` |
| **Get user email** | Auth User ID | `user.email` | `auth.users` |
| **Create gig** | Profile ID | `profile.id` | `users_profile` |
| **Apply to gig** | Profile ID | `profile.id` | `users_profile` |
| **Business logic** | Profile ID | `profile.id` | `users_profile` |

---

## ✅ Correct Parameter Name

### Use `authUserId` for Clarity:

```typescript
// ✅ RECOMMENDED - Crystal clear
async sendGigPublished(
  authUserId: string,  // auth.users.id
  email: string,
  gigDetails: GigDetails
) {
  await checker.shouldSendEmail(authUserId, 'gig');
}

// ✅ Also acceptable
async sendGigPublished(
  userAuthId: string,  // auth.users.id
  email: string,
  gigDetails: GigDetails
) {
  await checker.shouldSendEmail(userAuthId, 'gig');
}

// ⚠️ Less clear but OK if documented
async sendGigPublished(
  userId: string,  // ⚠️ Document that this is auth.users.id
  email: string,
  gigDetails: GigDetails
) {
  await checker.shouldSendEmail(userId, 'gig');
}
```

---

## 🚀 Action Items

### Update Services with Correct Naming:

1. **EmailPreferenceChecker** ✅ Already uses `userId` correctly (it's auth ID)

2. **EmailEventsService** 🔄 Needs update:
   ```typescript
   // Add authUserId parameter to all methods
   async sendWelcomeEmail(
     authUserId: string,  // ← Add this (auth.users.id)
     email: string,
     name: string,
     role: string
   ) { ... }
   ```

3. **Templates** 🔄 Update signatures:
   ```typescript
   export function getWelcomeEmailTemplate(
     name: string,
     role: string,
     roleDescription: string,
     email?: string,
     authUserId?: string  // ← For unsubscribe link
   ): string { ... }
   ```

---

## 💡 Best Practice

### Always be explicit about which ID:

```typescript
// ✅ BEST - Explicit names
interface EmailParams {
  authUserId: string;      // auth.users.id
  profileId?: string;      // users_profile.id (if needed)
  email: string;
  // ...
}

// Document in comments
/**
 * @param authUserId - The auth.users.id (from session/auth context)
 * @param email - User's email address
 */
async sendEmail(authUserId: string, email: string) {
  // ...
}
```

---

## ✅ Conclusion

**Question:** "Is userId the correct one to use?"

**Answer:** **YES, but clarify which one!**

- ✅ **For email preferences:** Use `auth.users.id` (from auth context)
- ✅ **Naming:** Call it `authUserId` for clarity
- ✅ **notification_preferences.user_id** expects `auth.users.id`
- ✅ **Current implementation** is using the correct ID

**Recommendation:** 
- Rename `userId` → `authUserId` in email methods for clarity
- Document that it's the auth ID, not profile ID
- Keep using `user.id` from auth context ✅

---

**Your instinct was right to double-check! Auth User ID is correct!** ✅

