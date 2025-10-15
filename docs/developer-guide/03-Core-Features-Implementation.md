# Core Features & Implementation - Preset Platform

## 🎯 Feature Overview

Preset's core features are designed around the creative collaboration workflow, from gig creation to showcase publication. Each feature is implemented using Domain-Driven Design principles with clean separation between business logic and infrastructure concerns.

## 🎬 Gig Management System

### **Gig Creation Flow**

#### **Multi-Step Gig Creation Form**
```typescript
// Domain Entity
class Gig {
  constructor(
    public id: string,
    public ownerId: string,
    public title: string,
    public description: string,
    public compType: CompensationType,
    public location: Location,
    public dateTimeWindow: DateTimeWindow,
    public applicationDeadline: Date,
    public maxApplicants: number,
    public usageRights: string,
    public safetyNotes: string,
    public status: GigStatus = GigStatus.DRAFT
  ) {}

  publish(): void {
    if (this.status !== GigStatus.DRAFT) {
      throw new Error('Only draft gigs can be published');
    }
    this.status = GigStatus.PUBLISHED;
    this.addDomainEvent(new GigPublished(this.id, this.ownerId));
  }
}
```

#### **Location Picker with Map Integration**
- **MapLibre Integration**: Interactive map for location selection
- **Radius Selection**: Configurable search radius (1-50km)
- **Address Autocomplete**: Google Places API integration
- **GPS Coordinates**: Precise lat/lng storage for matching

#### **Moodboard Upload and Organization**
- **Multi-Image Upload**: Drag-and-drop interface for multiple images
- **Image Labeling**: Categorize images (character, location, style, etc.)
- **Drag-to-Reorder**: Visual arrangement of moodboard items
- **AI Enhancement**: Optional AI-powered image enhancement
- **Storage**: Secure Supabase Storage with EXIF stripping

### **Gig Discovery & Search**

#### **Advanced Filtering System**
```typescript
interface GigFilters {
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  compType?: CompensationType[];
  lookingFor?: string[];
  maxApplicants?: number;
  status?: GigStatus[];
}

// Use Case
class SearchGigsUseCase {
  async execute(filters: GigFilters): Promise<Gig[]> {
    const gigs = await this.gigRepository.findPublished(filters);
    return gigs.filter(gig => this.subscriptionPolicy.canViewGig(gig));
  }
}
```

#### **Infinite Scroll Implementation**
- **Pagination**: Efficient data loading with cursor-based pagination
- **Virtual Scrolling**: Performance optimization for large datasets
- **Real-time Updates**: Live updates when new gigs are published
- **Caching**: Client-side caching for improved performance

### **Gig Detail Pages**
- **Comprehensive Information**: All gig details in organized layout
- **Moodboard Gallery**: Interactive moodboard viewer
- **Application Status**: Real-time application status for talent
- **Safety Information**: Prominent safety notes and guidelines
- **Creator Profile**: Contributor information and previous work

## 📝 Application System

### **Application Flow**

#### **Profile Snapshot System**
```typescript
class Application {
  constructor(
    public id: string,
    public gigId: string,
    public applicantId: string,
    public note: string,
    public status: ApplicationStatus = ApplicationStatus.PENDING,
    public appliedAt: Date = new Date(),
    public profileSnapshot: ProfileSnapshot
  ) {}

  shortlist(): void {
    if (this.status !== ApplicationStatus.PENDING) {
      throw new Error('Only pending applications can be shortlisted');
    }
    this.status = ApplicationStatus.SHORTLISTED;
    this.addDomainEvent(new ApplicantShortlisted(this.id, this.gigId));
  }
}
```

#### **Subscription-Gated Applications**
- **Free Tier**: 3 applications per month
- **Plus Tier**: Unlimited applications
- **Pro Tier**: Unlimited applications + priority visibility
- **Real-time Validation**: Immediate feedback on application limits

### **Application Management**

#### **Contributor Inbox**
- **Application Dashboard**: Centralized view of all applications
- **Filtering Options**: Sort by date, compatibility, experience
- **Bulk Actions**: Shortlist multiple applicants at once
- **Profile Comparison**: Side-by-side profile comparison tool

#### **Shortlisting & Booking**
- **Shortlist Management**: Organize applicants into shortlists
- **Bulk Messaging**: Send messages to multiple shortlisted applicants
- **Booking Confirmation**: Formal booking process with confirmation
- **Calendar Integration**: Optional calendar sync for shoot scheduling

## 🎨 Showcase System

### **Collaborative Portfolio Creation**

#### **Mutual Approval Workflow**
```typescript
class Showcase {
  constructor(
    public id: string,
    public gigId: string,
    public creatorId: string,
    public talentId: string,
    public mediaIds: string[],
    public caption: string,
    public tags: string[],
    public palette: string[],
    public approvals: Approval[] = [],
    public visibility: Visibility = Visibility.PRIVATE
  ) {}

  approve(userId: string): void {
    if (!this.approvals.find(a => a.userId === userId)) {
      this.approvals.push(new Approval(userId, new Date()));
    }
    
    if (this.approvals.length === 2) {
      this.publish();
    }
  }

  private publish(): void {
    this.visibility = Visibility.PUBLIC;
    this.addDomainEvent(new ShowcasePublished(this.id, this.gigId));
  }
}
```

#### **Media Upload & Management**
- **3-6 Selects**: Enforced media count for quality control
- **Image Optimization**: Automatic resizing and compression
- **Blurhash Generation**: Placeholder images for fast loading
- **Color Palette Extraction**: Automatic color analysis
- **EXIF Stripping**: Privacy protection for all uploads

### **Portfolio Features**
- **Public Galleries**: Discoverable showcase collections
- **Auto-Crediting**: Automatic attribution on both profiles
- **Tag System**: Categorization and searchability
- **Social Sharing**: Easy sharing to external platforms
- **Download Options**: High-resolution downloads for clients

## 💬 Communication System

### **Per-Gig Messaging**

#### **Conversation Management**
```typescript
class Conversation {
  constructor(
    public id: string,
    public gigId: string,
    public participants: string[],
    public messages: Message[] = [],
    public status: ConversationStatus = ConversationStatus.ACTIVE
  ) {}

  sendMessage(fromUserId: string, body: string, attachments?: Attachment[]): Message {
    if (!this.participants.includes(fromUserId)) {
      throw new Error('User not in conversation');
    }
    
    const message = new Message(
      generateId(),
      fromUserId,
      this.getOtherParticipant(fromUserId),
      body,
      attachments,
      new Date()
    );
    
    this.messages.push(message);
    this.addDomainEvent(new MessageSent(message.id, this.id));
    
    return message;
  }
}
```

#### **Real-time Messaging**
- **WebSocket Integration**: Supabase Realtime for instant messaging
- **Message Status**: Read receipts and delivery confirmation
- **File Attachments**: Image and document sharing
- **Message History**: Complete conversation history
- **Push Notifications**: Mobile notifications for new messages

### **Safety Features**
- **Rate Limiting**: Prevent spam and harassment
- **Block/Report**: User safety tools with admin review
- **Content Filtering**: Automatic detection of inappropriate content
- **Moderation Queue**: Admin review system for reported content

## ⭐ Review & Rating System

### **Mutual Review System**

#### **Review Implementation**
```typescript
class Review {
  constructor(
    public id: string,
    public gigId: string,
    public reviewerId: string,
    public revieweeId: string,
    public rating: Rating,
    public tags: ReviewTag[],
    public comment: string,
    public createdAt: Date = new Date()
  ) {}

  static create(
    gigId: string,
    reviewerId: string,
    revieweeId: string,
    rating: number,
    tags: string[],
    comment: string
  ): Review {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    return new Review(
      generateId(),
      gigId,
      reviewerId,
      revieweeId,
      new Rating(rating),
      tags.map(tag => new ReviewTag(tag)),
      comment
    );
  }
}
```

#### **Review Features**
- **1-5 Star Ratings**: Standardized rating system
- **Tag-based Reviews**: Professional, punctual, creative, etc.
- **Mutual Enforcement**: Both parties must review before completion
- **Reputation Building**: Aggregate ratings and review counts
- **Review Moderation**: Admin review for inappropriate content

## 🤖 AI-Powered Features

### **Image Enhancement System**

#### **NanoBanana Integration**
```typescript
class AIService {
  constructor(
    private nanoBananaClient: NanoBananaClient,
    private creditService: CreditService
  ) {}

  async enhanceImage(
    userId: string,
    imageUrl: string,
    prompt: string
  ): Promise<EnhancementResult> {
    // Check user credits
    const hasCredits = await this.creditService.hasCredits(userId, 1);
    if (!hasCredits) {
      throw new InsufficientCreditsError();
    }

    // Check platform credits
    const hasPlatformCredits = await this.creditService.hasPlatformCredits(4);
    if (!hasPlatformCredits) {
      throw new ServiceUnavailableError();
    }

    // Perform enhancement
    const result = await this.nanoBananaClient.enhanceImage(imageUrl, prompt);
    
    // Deduct credits
    await this.creditService.deductUserCredits(userId, 1);
    await this.creditService.deductPlatformCredits(4);
    
    return result;
  }
}
```

#### **Credit Marketplace System**
- **Transparent Pricing**: 1 user credit = 1 enhancement
- **Platform Management**: 1 user credit = 4 NanoBanana credits
- **Real-time Balance**: Live credit balance tracking
- **Usage Analytics**: Detailed usage reports and insights

### **AI Content Analysis**
- **Auto-tagging**: Automatic tag generation for gigs and moodboards
- **Vibe Extraction**: Style and mood analysis from images
- **Shotlist Suggestions**: AI-generated shot suggestions from descriptions
- **Content Moderation**: NSFW detection and content filtering

## 🎨 Moodboard Builder

### **Visual Inspiration System**

#### **Multi-Source Import**
```typescript
class MoodboardBuilder {
  async importFromSource(
    source: ImportSource,
    images: ImageInput[]
  ): Promise<MoodboardItem[]> {
    const items: MoodboardItem[] = [];
    
    for (const image of images) {
      switch (source) {
        case ImportSource.FILE:
          items.push(await this.importFromFile(image));
          break;
        case ImportSource.URL:
          items.push(await this.importFromUrl(image));
          break;
        case ImportSource.PEXELS:
          items.push(await this.importFromPexels(image));
          break;
        case ImportSource.GALLERY:
          items.push(await this.importFromGallery(image));
          break;
      }
    }
    
    return items;
  }
}
```

#### **Moodboard Features**
- **Drag-to-Reorder**: Visual arrangement of moodboard items
- **Image Labeling**: Categorize images by type and purpose
- **AI Enhancement**: Optional AI-powered image enhancement
- **Shareable Views**: Read-only sharing for collaboration
- **Export Options**: Download moodboards for external use

## 📊 Analytics & Insights

### **User Analytics**

#### **Dashboard Metrics**
```typescript
interface UserAnalytics {
  profileViews: number;
  applicationSuccessRate: number;
  showcaseViews: number;
  averageRating: number;
  completedGigs: number;
  responseTime: number;
  profileCompletion: number;
}

class AnalyticsService {
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const [
      profileViews,
      applications,
      showcases,
      reviews,
      gigs
    ] = await Promise.all([
      this.getProfileViews(userId),
      this.getApplicationStats(userId),
      this.getShowcaseStats(userId),
      this.getReviewStats(userId),
      this.getGigStats(userId)
    ]);

    return {
      profileViews: profileViews.count,
      applicationSuccessRate: applications.successRate,
      showcaseViews: showcases.totalViews,
      averageRating: reviews.averageRating,
      completedGigs: gigs.completed,
      responseTime: applications.averageResponseTime,
      profileCompletion: this.calculateProfileCompletion(userId)
    };
  }
}
```

#### **Smart Suggestions System**
- **Profile Completion**: Guidance for profile improvement
- **Gig Matching**: AI-powered gig recommendations
- **Match Quality**: Insights on compatibility improvements
- **Deadline Alerts**: Urgent gig application reminders
- **Nearby Opportunities**: Location-based gig discovery

## 🔒 Safety & Trust Features

### **Content Moderation**

#### **NSFW Detection System**
```typescript
class ContentModerationService {
  async moderateContent(content: string): Promise<ModerationResult> {
    const nsfwKeywords = await this.loadNSFWKeywords();
    const detectedKeywords = this.detectKeywords(content, nsfwKeywords);
    
    if (detectedKeywords.length > 0) {
      return {
        isNSFW: true,
        confidence: this.calculateConfidence(detectedKeywords),
        detectedCategories: this.categorizeKeywords(detectedKeywords),
        suggestedAction: 'flag_for_review'
      };
    }
    
    return { isNSFW: false, confidence: 0 };
  }
}
```

#### **User Safety Tools**
- **Report System**: Easy reporting of inappropriate content
- **Block Functionality**: User blocking with admin oversight
- **Content Filtering**: Automatic hiding of flagged content
- **Safety Guidelines**: Clear community guidelines and expectations

### **Verification System**
- **Email Verification**: Required for all accounts
- **Phone Verification**: Optional enhanced verification
- **ID Verification**: Optional premium verification badge
- **Profile Completeness**: Encouraged complete profiles for better matching

## 🚀 Performance Optimizations

### **Frontend Performance**
- **Code Splitting**: Lazy loading of components and routes
- **Image Optimization**: Next.js Image component with CDN
- **Virtual Scrolling**: Efficient rendering of large lists
- **Caching**: Client-side caching for frequently accessed data

### **Backend Performance**
- **Database Indexing**: Strategic indexes on frequently queried columns
- **Query Optimization**: Efficient queries with proper joins
- **Connection Pooling**: Supabase connection pooling
- **Rate Limiting**: API rate limiting to prevent abuse

### **Real-time Features**
- **WebSocket Optimization**: Efficient real-time communication
- **Event Batching**: Batch multiple events for better performance
- **Connection Management**: Smart connection handling
- **Fallback Mechanisms**: Graceful degradation when real-time fails

---

This comprehensive feature implementation provides a robust foundation for creative collaboration while maintaining high performance, security, and user experience standards. Each feature is designed with scalability and maintainability in mind, following Domain-Driven Design principles throughout.
