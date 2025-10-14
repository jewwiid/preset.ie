# Comprehensive NSFW Moderation System

## Overview

This document describes the complete NSFW moderation system implemented across all content types in the Preset platform. The system provides multi-layered protection including auto-detection, user self-reporting, community flagging, and admin review workflows.

## System Architecture

### 1. Content Types Covered
- **Playground Gallery**: Generated images saved to user galleries
- **Media**: Promoted content and uploaded media
- **Enhancement Tasks**: AI-enhanced images and videos
- **User Custom Types**: User-created image type definitions
- **Suggested Types**: Community-suggested image types

### 2. Moderation Layers

#### Layer 1: Auto-Detection
- **NSFW Keyword Detection**: Scans prompts, descriptions, and titles for inappropriate content
- **Confidence Scoring**: Calculates confidence levels based on keyword frequency
- **Automatic Flagging**: Content with detected NSFW keywords is automatically flagged
- **Queue Population**: Flagged content is added to admin moderation queue

#### Layer 2: User Self-Reporting
- **Owner Controls**: Content owners can mark their own content as NSFW
- **Self-Marking**: Users can toggle NSFW status for their own content
- **Immediate Effect**: Self-marked content is immediately flagged for review

#### Layer 3: Community Flagging
- **User Flagging**: Any user can flag inappropriate content
- **Flag Types**: Multiple categories (NSFW, inappropriate, spam, copyright, violence, hate speech, other)
- **Detailed Reporting**: Users can provide reasons and descriptions
- **Queue Integration**: User flags are added to moderation queue

#### Layer 4: Admin Review
- **Moderation Queue**: Centralized queue for all flagged content
- **Admin Dashboard**: Comprehensive admin interface for reviewing content
- **Batch Operations**: Admins can process multiple items at once
- **Resolution Tracking**: Complete audit trail of all moderation actions

## Database Schema

### Core Moderation Tables

#### `content_moderation_queue`
```sql
CREATE TABLE content_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('playground_gallery', 'media', 'enhancement_tasks', 'user_type', 'suggested_type')),
    content_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content details
    content_title TEXT,
    content_description TEXT,
    content_url TEXT,
    
    -- Moderation details
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'escalated')),
    severity_score INTEGER DEFAULT 0 CHECK (severity_score >= 0 AND severity_score <= 100),
    detected_categories TEXT[] DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Admin review
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `content_flags`
```sql
CREATE TABLE content_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('playground_gallery', 'media', 'enhancement_tasks', 'user_type', 'suggested_type')),
    content_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Flag details
    flag_type TEXT NOT NULL CHECK (flag_type IN ('nsfw', 'inappropriate', 'spam', 'copyright', 'violence', 'hate_speech', 'other')),
    reason TEXT NOT NULL,
    description TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Content Table Extensions

All content tables now include NSFW moderation fields:

```sql
-- Added to playground_gallery, media, enhancement_tasks
ALTER TABLE [table_name] ADD COLUMN is_nsfw BOOLEAN DEFAULT false;
ALTER TABLE [table_name] ADD COLUMN is_flagged BOOLEAN DEFAULT false;
ALTER TABLE [table_name] ADD COLUMN moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));
ALTER TABLE [table_name] ADD COLUMN moderation_reason TEXT;
ALTER TABLE [table_name] ADD COLUMN moderated_by UUID REFERENCES auth.users(id);
ALTER TABLE [table_name] ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE [table_name] ADD COLUMN user_marked_nsfw BOOLEAN DEFAULT false;
ALTER TABLE [table_name] ADD COLUMN nsfw_confidence_score DECIMAL(3,2) DEFAULT 0.0;
```

## API Endpoints

### Content Flagging
- **POST** `/api/content/flag` - Flag content for moderation
- **POST** `/api/content/mark-nsfw` - Mark content as NSFW (owner only)
- **GET** `/api/content/moderation-info` - Get moderation information

### Admin Moderation
- **GET** `/api/admin/moderation/queue` - Get moderation queue
- **POST** `/api/admin/moderation/[id]/resolve` - Resolve individual items
- **PATCH** `/api/admin/moderation/queue` - Batch resolve items
- **GET** `/api/admin/moderation/stats` - Get moderation statistics

### User Preferences
- **GET** `/api/user/content-preferences` - Get user content preferences
- **POST** `/api/user/content-preferences` - Update user content preferences

## UI Components

### ContentFlagging Component
```typescript
<ContentFlagging
  contentId="uuid"
  contentType="playground_gallery"
  isOwner={true}
  isNsfw={false}
  isFlagged={false}
  moderationStatus="pending"
  onNsfwToggle={(isNsfw) => handleNsfwToggle(isNsfw)}
/>
```

**Features:**
- Status badges (NSFW, Flagged, Approved, Rejected)
- Owner controls for NSFW marking
- Community flagging with detailed forms
- Info dialog with moderation details
- Real-time status updates

### NSFW Warning Components
- **NSFWWarning**: Modal warning for NSFW content
- **NSFWBadge**: Status badge for NSFW content
- **NSFWOverlay**: Overlay for hidden NSFW content

## User Experience

### Content Owners
1. **Self-Marking**: Can mark their own content as NSFW
2. **Immediate Effect**: Self-marked content is flagged for review
3. **Status Tracking**: Can see moderation status of their content
4. **Appeal Process**: Can request review of rejected content

### Community Users
1. **Flagging Interface**: Easy-to-use flagging system
2. **Multiple Categories**: Comprehensive flag types
3. **Detailed Reporting**: Can provide context and descriptions
4. **Anonymous Reporting**: Can flag without revealing identity

### Admins
1. **Centralized Queue**: All flagged content in one place
2. **Batch Operations**: Process multiple items efficiently
3. **Detailed Context**: Full content and flag information
4. **Audit Trail**: Complete history of moderation actions

## Content Filtering

### User Preferences
```typescript
interface UserContentPreferences {
  allow_nsfw_content: boolean;
  show_nsfw_warnings: boolean;
  auto_hide_nsfw: boolean;
  content_filter_level: 'strict' | 'moderate' | 'lenient';
  blocked_categories: string[];
}
```

### Filtering Logic
1. **NSFW Detection**: Content marked as NSFW is filtered based on user preferences
2. **Warning System**: Users can choose to see warnings for NSFW content
3. **Auto-Hide**: Option to automatically hide NSFW content
4. **Category Blocking**: Users can block specific content categories

## Integration Points

### Generation APIs
All content generation APIs now include NSFW detection:
- **Save to Gallery**: Auto-detects NSFW in prompts and descriptions
- **Media Upload**: Scans uploaded content metadata
- **Enhancement Tasks**: Monitors enhancement prompts and results

### Content Display
- **Gallery Views**: Filter NSFW content based on user preferences
- **Search Results**: Hide or warn about NSFW content
- **Showcase Feeds**: Apply content filtering
- **User Profiles**: Respect NSFW preferences

## Security & Privacy

### Row Level Security (RLS)
- **User Data**: Users can only see their own content and flags
- **Admin Access**: Admins can access all moderation data
- **System Access**: System can insert moderation queue items
- **Public Content**: Non-NSFW content visible to all users

### Data Protection
- **Audit Logging**: All moderation actions are logged
- **User Privacy**: Flagging can be anonymous
- **Content Encryption**: Sensitive content is encrypted
- **Access Controls**: Strict permission system

## Monitoring & Analytics

### Moderation Metrics
- **Flag Volume**: Track number of flags per day/week/month
- **Resolution Time**: Average time to resolve flags
- **False Positive Rate**: Accuracy of auto-detection
- **User Engagement**: Flagging participation rates

### Content Analytics
- **NSFW Content Rate**: Percentage of content marked as NSFW
- **Category Distribution**: Breakdown of flag types
- **User Behavior**: Self-reporting vs. community flagging
- **Admin Efficiency**: Resolution rates and batch processing

## Future Enhancements

### AI-Powered Detection
- **Image Analysis**: Computer vision for NSFW image detection
- **Video Analysis**: Content analysis for video content
- **Context Understanding**: Better understanding of content context
- **Learning System**: Improve detection accuracy over time

### Advanced Features
- **Appeal System**: Allow users to appeal moderation decisions
- **Community Moderation**: Trusted user moderation program
- **Content Warnings**: Granular warning system
- **Age Verification**: Age-gated content system

## Implementation Status

### ✅ Completed
- [x] Database schema for all content types
- [x] Auto-detection system
- [x] User self-reporting
- [x] Community flagging
- [x] Admin moderation queue
- [x] API endpoints
- [x] UI components
- [x] Content filtering
- [x] User preferences
- [x] RLS policies
- [x] Audit logging

### 🔄 In Progress
- [ ] Integration with all generation APIs
- [ ] Content display filtering
- [ ] Admin dashboard UI
- [ ] Analytics dashboard

### 📋 Planned
- [ ] AI-powered image analysis
- [ ] Video content analysis
- [ ] Appeal system
- [ ] Community moderation
- [ ] Advanced analytics

## Usage Examples

### Flagging Content
```typescript
const { flagContent } = useContentModerationExtended();

await flagContent(
  'playground_gallery',
  'content-uuid',
  'nsfw',
  'Contains explicit sexual content',
  'The image shows explicit sexual acts that violate community guidelines'
);
```

### Marking Content as NSFW
```typescript
const { markContentNsfw } = useContentModerationExtended();

await markContentNsfw(
  'playground_gallery',
  'content-uuid',
  true // Mark as NSFW
);
```

### Getting Moderation Info
```typescript
const { getModerationInfo } = useContentModerationExtended();

const info = await getModerationInfo(
  'playground_gallery',
  'content-uuid'
);

console.log(info.flag_count); // Number of flags
console.log(info.is_nsfw); // NSFW status
console.log(info.recent_flags); // Recent flag history
```

## Conclusion

The comprehensive NSFW moderation system provides robust protection for the Preset platform while maintaining a positive user experience. The multi-layered approach ensures that inappropriate content is caught through multiple channels, while the admin review system provides human oversight and context-aware decisions.

The system is designed to scale with the platform and can be enhanced with AI-powered detection and advanced features as the platform grows.
