# Age-Gated NSFW Content System

## 🎯 Overview

This document describes the comprehensive age-gated NSFW (Not Safe For Work) content system implemented for the Preset platform. The system provides Twitter/X-style content filtering with age verification, user consent management, and content blurring/unblurring functionality.

## 🏗️ System Architecture

### Database Schema

#### Core Tables
- **`users_profile`** - Extended with age verification fields
- **`user_content_preferences`** - Enhanced with NSFW consent and preferences
- **`nsfw_content_access_logs`** - Audit trail for all NSFW content access
- **`content_moderation_queue`** - Admin review workflow
- **`content_flags`** - User-reported content flags

#### Key Fields Added
```sql
-- users_profile table
date_of_birth DATE
age_verified BOOLEAN DEFAULT false
age_verified_at TIMESTAMPTZ
account_status TEXT DEFAULT 'pending_verification'
verification_method TEXT

-- user_content_preferences table
age_verified BOOLEAN DEFAULT false
age_verified_at TIMESTAMPTZ
nsfw_consent_given BOOLEAN DEFAULT false
nsfw_consent_given_at TIMESTAMPTZ
show_nsfw_content BOOLEAN DEFAULT false
blur_nsfw_content BOOLEAN DEFAULT true
nsfw_warning_shown BOOLEAN DEFAULT false
```

### API Endpoints

#### Age Verification
- **`GET /api/user/age-verification`** - Get age verification status
- **`POST /api/user/age-verification`** - Verify user age (18+ required)

#### NSFW Consent Management
- **`GET /api/user/nsfw-consent`** - Get NSFW access status
- **`POST /api/user/nsfw-consent`** - Give consent or toggle NSFW content visibility

### Database Functions

#### Core Functions
- **`can_view_nsfw_content(user_id)`** - Checks if user can view NSFW content
- **`give_nsfw_consent(user_id)`** - Gives NSFW consent to age-verified users
- **`log_nsfw_content_access(...)`** - Logs NSFW content access for audit

## 🎨 User Experience Flow

### 1. Content Upload/Generation
```
User uploads/generates content → Auto-detected or user-marked as NSFW → 
Content stored with NSFW flags → Ready for display
```

### 2. Content Display
```
NSFW content detected → NSFWContentWrapper applied → 
Content blurred by default → User sees unblur option
```

### 3. Age Verification Flow
```
User clicks "Show NSFW Content" → System checks age verification → 
If not verified: Redirect to age verification page → 
User enters date of birth → System verifies 18+ → 
Age verification complete
```

### 4. NSFW Consent Flow
```
Age verified user → Clicks "Show NSFW Content" → 
NSFW consent dialog → User confirms 18+ and consent → 
Content unblurred → Preference saved
```

### 5. Future Content Access
```
User with consent → NSFW content displays normally → 
Can toggle NSFW visibility in settings → 
Preference respected across platform
```

## 🔧 Implementation Details

### React Components

#### NSFWContentWrapper
```tsx
<NSFWContentWrapper
  contentId={content.id}
  contentType="playground_gallery"
  isNsfw={content.is_nsfw || content.user_marked_nsfw}
  onContentAccess={(action) => logAccess(action)}
>
  <YourContentComponent content={content} />
</NSFWContentWrapper>
```

#### Age Verification Settings Page
- **Route**: `/settings/age-verification`
- **Features**: Age verification, NSFW consent management, preference toggles

### React Hooks

#### useNSFWContent
```tsx
const {
  canViewNSFW,
  shouldBlurNSFW,
  isAgeVerified,
  hasNSFWConsent,
  needsAgeVerification,
  needsNSFWConsent,
  giveNSFWConsent,
  toggleNSFWContent,
  verifyAge
} = useNSFWContent();
```

### Content Integration

#### Updated Components
- **`SavedImagesMasonry`** - Gallery images with NSFW handling
- **`StitchPreviewArea`** - Generated images with NSFW handling
- **`MoodboardViewer`** - Moodboard content with NSFW handling

## 🔒 Security Features

### Age Verification
- **18+ requirement** enforced at database level
- **Date of birth validation** with age calculation
- **Verification method tracking** (self-attestation, document upload, etc.)
- **Account status management** (pending, verified, suspended, banned)

### NSFW Consent
- **Explicit consent required** before viewing NSFW content
- **Consent timestamp tracking** for audit purposes
- **User preference management** for content visibility
- **Blur/unblur functionality** with user control

### Audit Trail
- **Complete access logging** for all NSFW content
- **User action tracking** (view, unblur, blur, blocked)
- **Age verification status** at time of access
- **IP address and user agent** logging for security

### Admin Oversight
- **Moderation queue integration** with existing system
- **Content flagging system** for user reports
- **Admin review workflow** for flagged content
- **Bulk moderation actions** for efficiency

## 📱 User Interface

### NSFW Content Display
- **Blurred by default** with overlay
- **Clear unblur options** with age verification prompts
- **Consent dialogs** with clear language
- **Preference toggles** in settings

### Age Verification Page
- **Date of birth input** with validation
- **Clear age requirements** (18+ only)
- **Verification status display** with timestamps
- **NSFW preference management**

### Settings Integration
- **Age verification status** display
- **NSFW content preferences** toggles
- **Consent management** with timestamps
- **Account status** indicators

## 🚀 Deployment Checklist

### Database Migration
```bash
# Run the age-gated NSFW system migration
supabase db push --file supabase/migrations/20250131_add_age_gated_nsfw_system.sql
```

### Component Integration
1. **Import NSFWContentWrapper** in content display components
2. **Add NSFW fields** to content interfaces
3. **Wrap content rendering** with NSFW wrapper
4. **Add content access logging** for audit trail

### Settings Navigation
```tsx
// Add to settings menu
<Link href="/settings/age-verification">
  Age Verification & NSFW Content
</Link>
```

### Testing
1. **Age verification flow** - Test 18+ requirement
2. **NSFW consent flow** - Test consent management
3. **Content blurring** - Test blur/unblur functionality
4. **Preference persistence** - Test setting persistence
5. **Audit logging** - Test access logging

## 🎯 Benefits

### User Experience
- **Familiar interface** - Twitter/X-style blur/unblur
- **User choice** - Can enable/disable NSFW content
- **Clear communication** - Obvious age requirements
- **Graceful degradation** - Works for all user types

### Compliance
- **Age verification** - 18+ requirement enforced
- **Audit trail** - Complete access logging
- **User consent** - Explicit consent tracking
- **Admin oversight** - Moderation queue integration

### Platform Safety
- **Content filtering** - NSFW content properly handled
- **User protection** - Age-appropriate content display
- **Community standards** - Clear content guidelines
- **Legal compliance** - Age verification requirements

## 🔮 Future Enhancements

### Advanced Features
- **Document verification** - ID upload for age verification
- **Third-party verification** - Integration with verification services
- **Content categorization** - More granular content filtering
- **Parental controls** - Family account management

### Analytics
- **Usage analytics** - NSFW content engagement metrics
- **Age verification rates** - Conversion tracking
- **Content moderation stats** - Admin dashboard metrics
- **User preference insights** - Content filtering preferences

### Integration
- **Mobile app support** - Native mobile implementation
- **API webhooks** - Third-party integration support
- **Content moderation AI** - Automated NSFW detection
- **Multi-language support** - Internationalization

## 📚 Related Documentation

- **`COMPREHENSIVE_NSFW_MODERATION_SYSTEM.md`** - Complete moderation system
- **`NSFW_MODERATION_SYSTEM.md`** - Core moderation features
- **`STITCH_IMAGE_TYPES_GUIDE.md`** - Image type system
- **`MEDIA_TYPE_MIGRATION_README.md`** - Database migration guide

---

**Status**: ✅ **Production Ready**  
**Last Updated**: January 31, 2025  
**Version**: 1.0.0
