# Architecture & Technical Stack - Preset Platform

## 🏗️ Architecture Overview

Preset is built using **Domain-Driven Design (DDD) + Hexagonal Architecture** (Ports & Adapters), ensuring clean separation of concerns, maintainability, and scalability. The architecture follows strict principles where the domain layer remains pure and framework-independent.

## 🎯 Architectural Principles

### **Domain-Driven Design (DDD)**
- **Rich Domain Models**: Business logic encapsulated in entities and value objects
- **Bounded Contexts**: Clear boundaries between different business domains
- **Domain Events**: Event-driven architecture for cross-context communication
- **Ubiquitous Language**: Consistent terminology across code and documentation

### **Hexagonal Architecture (Ports & Adapters)**
- **Domain Layer**: Pure business logic with no framework dependencies
- **Application Layer**: Use cases and ports (interfaces)
- **Infrastructure Layer**: Adapters implementing ports (Supabase, Stripe, etc.)
- **Delivery Layer**: Controllers, API routes, UI components

## 📦 Monorepo Structure

```
preset/
├── apps/
│   ├── web/           # Next.js (Vercel) - SEO public pages, app shell, API routes
│   ├── mobile/        # Expo (React Native) - iOS/Android apps
│   └── edge/          # Supabase Edge Functions + Vercel serverless handlers
├── packages/
│   ├── domain/        # Pure DDD domain for all contexts
│   ├── application/   # Use cases + ports (per context)
│   ├── adapters/      # Supabase repos, storage, auth, messaging, http handlers
│   ├── ui/            # Shared design system (Tamagui)
│   ├── tokens/        # Design tokens (colors, radii, spacing, type scale)
│   └── types/         # Zod schemas, DTOs, api clients
└── supabase/          # Database migrations, functions, policies
```

## 🗄️ Bounded Contexts

### **1. Identity & Access Context**
**Purpose**: User authentication, profiles, and subscription management

**Domain Entities**:
- `User` (aggregate root): id, email, role, verificationStatus, subscriptionTier
- `Profile`: userId, displayName, handle, avatarUrl, bio, city, styleTags

**Value Objects**:
- `Email` (validated email)
- `Handle` (unique username)
- `SubscriptionTier` (free | plus | pro)
- `VerificationStatus` (unverified | email_verified | id_verified)

**Use Cases**:
- `RegisterUser`, `VerifyEmail`, `UpdateProfile`, `UpgradeSubscription`

**Domain Events**:
- `UserRegistered`, `EmailVerified`, `SubscriptionUpgraded`, `ProfileUpdated`

### **2. Gigs Context**
**Purpose**: Gig creation, management, and discovery

**Domain Entities**:
- `Gig` (aggregate root): id, ownerId, title, description, compType, location, dateTimeWindow, status, boostLevel

**Value Objects**:
- `Location` (text, lat, lng, radius)
- `DateTimeWindow` (start, end)
- `GigStatus` (draft | published | closed | completed)
- `CompensationType` (tfp | paid | expenses)

**Use Cases**:
- `CreateGig`, `PublishGig`, `CloseGig`, `BoostGig`, `SearchGigs`

**Domain Events**:
- `GigCreated`, `GigPublished`, `GigBooked`, `GigClosed`, `MoodboardAttached`

### **3. Applications Context**
**Purpose**: Talent applications and booking management

**Domain Entities**:
- `Application` (aggregate root): id, gigId, applicantId, note, status, appliedAt

**Value Objects**:
- `ApplicationStatus` (pending | shortlisted | accepted | declined)
- `ApplicationNote` (max 500 chars)

**Use Cases**:
- `ApplyToGig`, `ReviewApplication`, `ShortlistApplicants`, `BookTalent`

**Domain Events**:
- `ApplicationSubmitted`, `ApplicantShortlisted`, `TalentBooked`, `ApplicationDeclined`

### **4. Collaboration & Messaging Context**
**Purpose**: Communication and collaboration tools

**Domain Entities**:
- `Conversation` (aggregate root): id, gigId, participants, messages, status
- `Message`: id, fromUserId, toUserId, body, attachments, sentAt, readAt

**Value Objects**:
- `MessageBody` (validated, max length)
- `Attachment` (url, type, size)
- `ConversationStatus` (active | blocked | archived)

**Use Cases**:
- `SendMessage`, `GetConversations`, `BlockUser`, `MarkAsRead`

**Domain Events**:
- `ConversationStarted`, `MessageSent`, `UserBlocked`, `MessageRead`

### **5. Showcases & Reviews Context**
**Purpose**: Portfolio building and reputation management

**Domain Entities**:
- `Showcase` (aggregate root): id, gigId, creatorId, talentId, mediaIds, caption, tags, palette, approvals, visibility
- `Review`: id, gigId, reviewerId, revieweeId, rating, tags, comment, createdAt

**Value Objects**:
- `Approval` (userId, approvedAt)
- `Visibility` (private | public)
- `ReviewTag` (professional | punctual | creative | etc.)
- `Rating` (1-5 validated)

**Use Cases**:
- `CreateShowcase`, `ApproveShowcase`, `PublishShowcase`, `SubmitReview`

**Domain Events**:
- `ShowcaseCreated`, `ShowcaseApproved`, `ShowcasePublished`, `ReviewSubmitted`

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: Tamagui (cross-platform components)
- **State Management**: Zustand
- **Styling**: Design tokens + CSS-in-JS
- **Mobile**: Expo (React Native) with 90% shared components

### **Backend**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email OTP, MFA support)
- **Storage**: Supabase Storage (images, documents)
- **Real-time**: Supabase Realtime (messaging, notifications)
- **Serverless**: Vercel API Routes + Supabase Edge Functions

### **AI & External Services**
- **Image Enhancement**: NanoBanana API
- **Credit Management**: Custom marketplace system
- **Payments**: Stripe Billing (subscriptions only)
- **Email**: Plunk (transactional emails)
- **Monitoring**: Sentry (errors), PostHog (analytics)

### **Development Tools**
- **Monorepo**: Turborepo
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Testing**: Jest + Playwright
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (web), Expo (mobile)

## 🗄️ Database Design

### **Core Tables**
```sql
-- User management
users (id, email, role, verification_status, subscription_tier, created_at)
profiles (id, user_id, display_name, handle, avatar_url, bio, city, style_tags)

-- Gig management
gigs (id, owner_user_id, title, description, comp_type, location_text, lat, lng, 
      radius_m, start_time, end_time, application_deadline, max_applicants, 
      usage_rights, safety_notes, status, boost_level)

-- Applications
applications (id, gig_id, applicant_user_id, note, status, applied_at)

-- Media and showcases
media (id, owner_user_id, gig_id, type, bucket, path, width, height, 
       duration, palette, blurhash, exif_json, visibility)
showcases (id, gig_id, creator_user_id, talent_user_id, media_ids, 
           caption, tags, palette, approved_by_creator_at, approved_by_talent_at)

-- Communication
messages (id, gig_id, from_user_id, to_user_id, body, attachments, created_at, read_at)
conversations (id, gig_id, participants, status, created_at)

-- Reviews and reputation
reviews (id, gig_id, reviewer_id, reviewee_id, rating, tags, comment, created_at)

-- Subscriptions and payments
subscriptions (id, user_id, tier, status, started_at, expires_at)
platform_credits (id, provider, current_balance, low_balance_threshold)
user_credits (id, user_id, current_balance, total_purchased, total_used)
```

### **Row Level Security (RLS)**
- **User Isolation**: Users can only access their own data
- **Public Read**: Open gigs and public media are readable by all
- **Admin Access**: Admins can access all data for moderation
- **Subscription Gating**: Limits enforced at application layer

## 🔄 Domain Events System

### **Event Infrastructure**
```typescript
// Base event interface
interface DomainEvent {
  aggregateId: string;
  eventType: string;
  occurredAt: Date;
  payload: any;
}

// Event bus port
interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
}
```

### **Key Domain Events**
- **Identity**: `UserRegistered`, `EmailVerified`, `SubscriptionUpgraded`
- **Gigs**: `GigCreated`, `GigPublished`, `GigBooked`, `GigClosed`
- **Applications**: `ApplicationSubmitted`, `ApplicantShortlisted`, `TalentBooked`
- **Collaboration**: `MessageSent`, `ConversationStarted`, `UserBlocked`
- **Showcases**: `ShowcaseCreated`, `ShowcaseApproved`, `ShowcasePublished`

### **Event Handlers**
- **Email Notifications**: Send welcome emails, application notifications
- **Analytics**: Track user behavior, conversion metrics
- **Subscription Enforcement**: Check limits, upgrade prompts
- **Real-time Updates**: Push notifications, live updates

## 💳 Subscription & Gating System

### **Subscription Tiers**
```typescript
enum SubscriptionTier {
  FREE = 'free',
  PLUS = 'plus', 
  PRO = 'pro'
}

const SubscriptionLimits = {
  free: {
    gigsPerMonth: 2,
    applicationsPerMonth: 3,
    showcasesTotal: 3,
    applicantsPerGig: 10,
    aiEnhancements: false,
    boostGigs: false
  },
  plus: {
    gigsPerMonth: Infinity,
    applicationsPerMonth: Infinity,
    showcasesTotal: 10,
    applicantsPerGig: 50,
    aiEnhancements: true,
    boostGigs: false
  },
  pro: {
    gigsPerMonth: Infinity,
    applicationsPerMonth: Infinity,
    showcasesTotal: Infinity,
    applicantsPerGig: Infinity,
    aiEnhancements: true,
    boostGigs: true
  }
}
```

### **Gating Implementation**
- **Use Case Level**: All operations check subscription limits
- **Repository Level**: Query limits enforced in data access
- **UI Level**: Features hidden/disabled based on tier
- **API Level**: Rate limiting and quota enforcement

## 🔧 Ports & Adapters Implementation

### **Repository Ports**
```typescript
// Domain port
interface GigRepository {
  findById(id: string): Promise<Gig>;
  findByOwnerId(ownerId: string): Promise<Gig[]>;
  findPublished(filters: GigFilters): Promise<Gig[]>;
  save(gig: Gig): Promise<void>;
}

// Infrastructure adapter
class SupabaseGigRepository implements GigRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async findById(id: string): Promise<Gig> {
    // Supabase implementation
  }
  
  async save(gig: Gig): Promise<void> {
    // Supabase implementation
  }
}
```

### **External Service Ports**
```typescript
// Payment service port
interface PaymentService {
  createCheckoutSession(userId: string, tier: SubscriptionTier): Promise<string>;
  handleWebhook(event: Stripe.Event): Promise<void>;
}

// AI service port
interface AIService {
  enhanceImage(imageUrl: string, prompt: string): Promise<string>;
  extractPalette(imageUrl: string): Promise<string[]>;
}
```

## 🚀 Performance & Scalability

### **Database Optimization**
- **Indexing**: Strategic indexes on frequently queried columns
- **Connection Pooling**: Supabase connection pooling
- **Query Optimization**: Efficient queries with proper joins
- **Caching**: Redis caching for frequently accessed data

### **Frontend Performance**
- **Code Splitting**: Lazy loading of components and routes
- **Image Optimization**: Next.js Image component with CDN
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Caching**: Service worker for offline functionality

### **API Performance**
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Response Caching**: Cache frequently requested data
- **Async Processing**: Background jobs for heavy operations
- **CDN**: Global content delivery for static assets

## 🔒 Security Architecture

### **Authentication & Authorization**
- **Supabase Auth**: Secure authentication with MFA support
- **JWT Tokens**: Stateless authentication tokens
- **Role-Based Access**: Different permissions for different user types
- **Session Management**: Secure session handling

### **Data Protection**
- **Row Level Security**: Database-level access control
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

### **Privacy & Compliance**
- **GDPR Compliance**: Data export and deletion rights
- **EXIF Stripping**: Automatic removal of GPS data
- **Private Storage**: User-specific storage buckets
- **Audit Trails**: Complete logs of all operations

## 📊 Monitoring & Observability

### **Error Tracking**
- **Sentry Integration**: Real-time error monitoring
- **Error Boundaries**: Graceful error handling in React
- **Log Aggregation**: Centralized logging system
- **Alert System**: Automated alerts for critical issues

### **Performance Monitoring**
- **Core Web Vitals**: Performance metrics tracking
- **API Response Times**: Endpoint performance monitoring
- **Database Performance**: Query performance analysis
- **User Analytics**: PostHog integration for user behavior

### **Business Metrics**
- **Subscription Metrics**: MRR, churn rate, conversion rates
- **User Engagement**: DAU/MAU, feature adoption
- **Platform Health**: System uptime, error rates
- **Financial Metrics**: Revenue tracking, cost analysis

## 🔮 Future Architecture Considerations

### **Microservices Migration**
- **Service Decomposition**: Split into focused services
- **API Gateway**: Centralized API management
- **Event-Driven**: Async communication between services
- **Container Orchestration**: Kubernetes deployment

### **Advanced AI Integration**
- **ML Pipeline**: Custom machine learning models
- **Real-time Processing**: Stream processing for AI features
- **Model Versioning**: A/B testing for AI improvements
- **Edge Computing**: AI processing closer to users

### **Global Scale**
- **Multi-Region**: Deploy across multiple regions
- **CDN Optimization**: Global content delivery
- **Database Sharding**: Horizontal scaling strategies
- **Load Balancing**: Distribute traffic efficiently

---

This architecture provides a solid foundation for Preset's growth while maintaining code quality, performance, and scalability. The DDD + Hexagonal approach ensures that business logic remains clean and testable, while the modern tech stack enables rapid development and deployment.
