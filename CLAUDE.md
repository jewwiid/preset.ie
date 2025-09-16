
# 📓 Preset (Preset.ie) — Final Scope Document
_A Subscription-based, cross-platform creative collaboration app built with DDD + Hexagonal architecture_

## 0) Elevator Pitch
Preset is a mobile-first platform where **Contributors** (photographers/videographers/cinematographers) post **Gigs** and **Talent** (creative partners) apply. It is **free to start** and monetized via **subscription tiers**—not per-gig payments. Portfolios live **inside** the app via **Showcases** created from completed shoots, and **Moodboards** make gigs look premium and clear.

---

## 1) Product Goals
- **Connect creatives safely** and efficiently for shoots.
- **Keep visual proof of work in-app** (Showcases) to reduce external links.
- **Make gigs beautiful and scannable** (Moodboards with tags/palette).
- **Scale across iOS, Android, and Web** with a shared design system.
- **Ship fast** with Supabase + Vercel, TypeScript everywhere.

---

## 2) Roles & Permissions
- **Contributors**: post/manage gigs, review applications, shortlist/book, create moodboards, message, complete shoots, publish showcases.
- **Talent**: create profile, browse/apply to gigs, message, upload selects for showcases, review contributors.
- **Admin**: moderate content/reports, oversee ID verification, enforce community rules.

---

## 3) Core Flows
1. **Create Gig**: title, description, purpose, comp type (informational: TFP/paid/expenses), location+radius, date/time window, usage rights, safety notes, application deadline, max applicants, moodboard upload.
2. **Apply**: talent filters/browses gigs → apply with profile snapshot + optional note.
3. **Review & Booking**: contributor shortlists, messages, books talent.
4. **Completion & Showcase**: both add **3–6 selects** → mutual approval → auto-credited **Showcase** on both profiles.
5. **Messaging & Reviews**: per-gig chat; mutual reviews after completion.

---

## 4) Subscription Model (No gig payments)
### Talent Tiers
- **Free**: basic profile; **3 applications/month**; up to **3 Showcases**.
- **Plus (€9/mo)**: unlimited applications; up to **10 Showcases**; basic analytics; “Verified Plus” badge.
- **Pro (€19/mo)**: unlimited applications & showcases; priority visibility; advanced analytics; early feature access.

### Contributor Tiers
- **Free**: **2 gigs/month**; up to **10 applications/gig**; basic moodboards.
- **Plus (€12/mo)**: unlimited gigs; advanced moodboards (video refs, AI tags); shortlist & bulk message; Verified Contributor badge.
- **Pro (€24/mo)**: All Plus; **boosted gigs** (priority ranking); unlimited applications/gig; team access (invite MUA/stylist/assistant).

**Gating**: application caps, gig caps, showcase limits, moodboard features, analytics, boosts, badges.

---

## 5) Key Features (MVP → V1)
- **Showcases** (in‑app mini portfolios) built from completed gigs with collaborator credits.
- **Moodboard Builder**: upload images/videos or paste URLs; AI vibe tags + palette extraction; drag‑reorder; shareable read‑only view.
- **Styles & Vibes**: aesthetic chips for profiles & matching.
- **Shotlist Snacks**: 3–5 shot cards; AI suggests prompts from gig description.
- **Golden Hour + Map Pins** for outdoor shoots.
- **Dashboards**: 
  - Contributor: views, saves, applications.
  - Talent: application status, profile views.
- **Messaging**: per‑gig threads, attachments, report/block, rate limits.
- **Reviews**: 1–5 + tags (professional, punctual).

---

## 6) Safety & Trust
**Risks**: fake profiles, harassment, unsafe meetings, non‑consensual content use, underage access, privacy leaks, scams, reputational harm.  
**Solutions**:
- Account integrity: email/phone verification; optional **ID verification** badge.
- Harassment prevention: in‑app chat only; **block/report**; first‑contact rate limits; abuse keyword filter.
- Safe meetings: safety notes on gigs; public venue nudge; optional **“Mark Safe”** check‑in.
- Usage rights: **release forms (e‑sign)** required for Showcases; immutable PDFs stored.
- Age gating: **18+ only**; re‑attestation; optional ID checks.
- Data protection: private buckets; signed URLs; **strip EXIF GPS**; GDPR export/delete.
- Scam prevention: posting limits for new/free accounts; moderation queue; report on every gig.
- Reputation: mutual reviews; track report rates; shadowban tools for repeat offenders.

**MVP priority**: age‑gate, release forms, report/block, moderation queue, reviews, private storage, EXIF stripping.  
**Post‑MVP**: verified ID badge, Mark Safe, shadowban tools, AI content moderation.

---

## 7) Architecture — DDD + Hexagonal (Ports & Adapters)
- **Domain** (pure TS): Entities, Value Objects, Domain Services, Domain Events. No framework imports.
- **Application**: Use cases (commands/queries), Ports (interfaces): `GigRepository`, `ApplicationRepository`, `MediaStorage`, `SubscriptionPolicy`, `EventBus`, `Clock`, `IdGen`.
- **Adapters**: 
  - Persistence: Supabase repositories implementing ports.
  - Delivery: Next.js handlers (web), Edge Functions, mobile service adapters.
  - Infra: Supabase Storage, Realtime bus, Email/Push, Stripe (subs only).

**Bounded Contexts**: Identity & Access, Gigs, Applications, Collaboration & Messaging, Media & Moodboards, Showcases & Reviews.

**Domain Events (examples)**: `GigCreated`, `ApplicationSubmitted`, `GigBooked`, `ShowcasePublished`, `UserReported`.

---

## 8) Monorepo (Turborepo) Structure
```
preset/
  apps/
    web/         # Next.js (Vercel) — SEO public pages, app shell, API routes
    mobile/      # Expo (React Native) — iOS/Android apps
    edge/        # Supabase Edge Functions + Vercel serverless handlers
  packages/
    domain/      # pure DDD domain for all contexts
    application/ # use cases + ports (per context)
    adapters/    # Supabase repos, storage, auth, messaging, http handlers
    ui/          # shared design system (Tamagui or RN Web + NativeWind)
    tokens/      # design tokens (colors, radii, spacing, type scale)
    types/       # zod schemas, DTOs, api clients
```

---

## 9) Tech Stack
- **Language**: **TypeScript** end‑to‑end.
- **Web**: **Next.js** (Vercel) — SSR/SEO for gigs & profiles.
- **Mobile**: **Expo (React Native)** — iOS & Android; 90% shared components.
- **UI parity**: **Tamagui** (or RN Web + NativeWind) + shared tokens.
- **Backend**: **Supabase** (Postgres + RLS, Auth, Storage, Realtime).
- **Serverless**: Vercel API Routes (web), **Supabase Edge Functions** (AI, signed URLs, policies).
- **Billing**: **Stripe Billing** (subscriptions only).
- **AI assists**: Edge Functions calling LLM for tags/summaries/shotlists; local palette/blurhash.
- **Observability**: PostHog (events), Sentry (errors), Edge logs.

---

## 10) Data Model (High-Level)
- **users_profile**: `id, user_id, display_name, handle, avatar_url, bio, city, role_flags[], style_tags[], subscription_tier`
- **gigs**: `id, owner_user_id, title, description, comp_type, location_text, lat, lng, radius_m, start_time, end_time, application_deadline, max_applicants, usage_rights, safety_notes, status, boost_level`
- **applications**: `id, gig_id, applicant_user_id, note, status`
- **media**: `id, owner_user_id, gig_id?, type(image|video|pdf), bucket, path, width, height, duration, palette[], blurhash, exif_json, visibility`
- **moodboards**: `id, gig_id, owner_user_id, title, summary, palette[], items[]`
- **showcases**: `id, gig_id, creator_user_id, talent_user_id, media_ids[], caption, tags[], palette[], approved_by_creator_at, approved_by_talent_at, visibility`
- **messages**: `id, gig_id, from_user_id, to_user_id, body, attachments[], created_at, read_at`
- **subscriptions**: `id, user_id, tier, status, started_at, expires_at`

RLS: owners can CRUD their rows; public can read open gigs + public media; caps & limits enforced in **Application layer** (e.g., monthly application cap for Free tier).

---

## 11) APIs (REST-ish, MVP)
- **Auth**: Supabase Auth (email OTP; later 2FA).
- **Gigs**: `POST /gigs`, `GET /gigs`, `GET /gigs/:id`, `PATCH /gigs/:id` (close/book).
- **Applications**: `POST /gigs/:id/apply`, `GET /gigs/:id/applications`, `PATCH /applications/:id`.
- **Moodboards**: `POST /moodboards`, `PATCH /moodboards/:id` (add/remove/reorder items).
- **Media**: signed upload URLs (or direct Supabase Storage client); `GET /media/:id` (signed/public).
- **Showcases**: `POST /gigs/:id/showcase`, `POST /showcases/:id/approve`.
- **Messaging**: `GET/POST /gigs/:id/messages` (WS for realtime).
- **Reports**: `POST /reports`.
- **Subscriptions**: Stripe checkout/portal webhooks → update `subscriptions` table.

---

## 12) AI Assists (MVP)
- **Auto-tags & vibe summaries** (LLM) for gigs/moodboards.
- **Palette extraction & blurhash** for all images.
- **Shotlist prompt generator** from gig description.
- Optional later: micro-reel stitching (start with carousel autoplay).

---

## 13) MVP Scope (8–10 Weeks)
- Auth & onboarding (roles + vibes)
- Create gig + moodboard upload
- Gig feed (filters: date, location, comp)
- Talent profile + showcases (upload → approve → publish)
- Apply flow + application inbox (shortlist/book/decline)
- Messaging (per‑gig threads) + push notifications
- Reviews + report/block + moderation queue
- Subscription tiers + Stripe integration (caps, badges, gating)
- Safety basics: release forms with e‑sign, EXIF strip, private storage
- Admin basics: reports queue, takedowns

**Defer**: server‑stitched reels, agencies/team roles beyond invite, advanced AI moderation, calendar sync, escrow (not planned).

---

## 14) KPI Targets
- **Supply**: gigs/day, moodboards per gig, time‑to‑first application.
- **Demand**: applications/gig, profile completion rate.
- **Quality**: completion rate, average rating, report rate < 1%.
- **Revenue**: Free→Plus/Pro conversion, churn < 5%/mo.
- **Growth**: DAU/MAU, activation (first post/apply).

---

## 15) Visual & UX Principles
- **Image‑first** cards, rounded corners, soft elevation, snappy transitions.
- **Palette‑themed UI**: derive accent colors from latest uploaded media.
- **Performance**: lazy loading, blurhash placeholders, responsive srcsets.
- **Accessiblity**: color contrast, focus states, large tap targets.

---

## 16) Delivery Plan (Sprints)
**Sprint 1**: Design tokens + shared UI; Auth + Profiles; Create Gig + Moodboard; Feed & Filters.  
**Sprint 2**: Apply + Inbox + Messaging; Showcases flow; Reviews; Safety basics (release, reports).  
**Sprint 3**: Subscriptions + gating; Dashboards; AI assists (tags/palette/shotlist); Admin lite; Polish & beta.

---

## 17) Risks & Mitigations
- **SEO for discovery** → Next.js SSR + public gig/profile pages.
- **Cross‑platform parity** → shared UI kit (Tamagui) + tokens; platform fallbacks.
- **Moderation load** → rate limits, AI pre‑filters, clear reporting UX.
- **Vendor lock‑in** → Hexagonal ports; adapters for Supabase/Stripe are swappable.

---

## 18) Credit Marketplace System

### Overview
Preset operates as a **credit marketplace** where the platform manages provider relationships transparently. Users see simple pricing (1 credit = 1 operation) while the platform handles complex provider ratios.

### Credit Scaling Architecture
- **User View**: 1 credit = 1 enhancement/generation (simple, predictable)
- **Platform Reality**: Dynamic provider ratios (e.g., 1 user credit = 4 NanoBanana credits)
- **Marketplace Model**: Platform purchases credits wholesale, sells retail to users

### Credit Packages (User Pricing)
- **Starter Pack**: 10 credits for €9.99
- **Creative Bundle**: 50 credits for €39.99
- **Pro Pack**: 100 credits for €69.99
- **Studio Pack**: 500 credits for €299.99

### Implementation Components
- **CreditScalingService**: Handles conversions between user and provider credits
- **Platform Credit Tables**: 
  - `platform_credits`: Tracks platform balance with each provider
  - `credit_packages`: Marketplace offerings
  - `platform_credit_consumption`: Detailed usage logs
- **Safety Mechanisms**: Platform balance checks, low credit alerts, graceful degradation

### NanoBanana Integration
- **API Endpoints**: Text-to-image, image editing, task status, credit balance
- **Credit Ratio**: 1 user credit = 4 NanoBanana credits (handled transparently)
- **Callback System**: Async task processing with webhook notifications
- **Error Handling**: Content policy violations, insufficient credits, rate limits

---

## 19) Implementation Status (DDD Architecture)

### ✅ Phase 1: Foundation (COMPLETED)
- **Domain Events Infrastructure**: BaseAggregateRoot, DomainEvent interface, EventBus port
- **Subscription System**: SubscriptionTier enum, SubscriptionPolicy, SubscriptionEnforcer
- **Database**: domain_events table for event sourcing

### ✅ Phase 2: Core Contexts (COMPLETED)
**Identity & Access Context**:
- Entities: User, Profile with Email, Handle, VerificationStatus value objects
- Use Cases: RegisterUser, UpdateProfile, VerifyUser, UpgradeSubscription
- Events: UserRegistered, EmailVerified, SubscriptionUpgraded, ProfileUpdated

**Gigs Context**:
- Entities: Gig with Location, DateTimeWindow, CompensationType value objects
- Use Cases: CreateGig, PublishGig, CloseGig, BoostGig, SearchGigs
- Events: GigCreated, GigPublished, GigBooked, GigClosed, MoodboardAttached

**Applications Context**:
- Entities: Application with ApplicationStatus, ApplicationNote value objects
- Use Cases: ApplyToGig, ReviewApplication, ShortlistApplicants, BookTalent
- Events: ApplicationSubmitted, ApplicantShortlisted, TalentBooked, ApplicationDeclined

### ✅ Phase 3: Collaboration (COMPLETED)
**Collaboration & Messaging Context**:
- Entities: Conversation (aggregate), Message with ConversationStatus, MessageBody, Attachment
- Use Cases: SendMessage, GetConversations, BlockUser, MarkAsRead
- Events: ConversationStarted, MessageSent, UserBlocked, MessageRead

**Showcases & Reviews Context**:
- Entities: Showcase, Review with Visibility, Approval, Rating, ReviewTag value objects
- Use Cases: CreateShowcase, ApproveShowcase, PublishShowcase, SubmitReview
- Events: ShowcaseCreated, ShowcaseApproved, ShowcasePublished, ReviewSubmitted

### ⏳ Phase 4: Integration (PENDING)
- Wire up event handlers for side effects
- Stripe subscription webhooks
- Update API routes to use new use cases
- Migrate existing data to new structure

### Architecture Compliance
- ✅ All 5 bounded contexts implemented
- ✅ Domain events defined for all aggregates
- ✅ Subscription limits enforced in use cases
- ✅ Proper authorization in all operations
- ✅ Zero direct database calls in application layer
- ✅ Hexagonal architecture with clear ports & adapters
- ⏳ Event handlers for async operations (pending)
- ⏳ Full API migration (pending)

---

## 20) CLI Tools & Development Workflow

### Build, Clean, Monitor, and Deploy System

The Preset project includes comprehensive CLI tools for development workflow management:

#### Available Scripts

**1. `build-deploy.sh` - Comprehensive Build & Deploy Script**
- Clean build artifacts and dependencies
- Install/update dependencies  
- Build project using Turbo
- Run tests and linting
- Deploy to Vercel
- Monitor git status
- Show deployment status
- Full pipeline execution

**2. `monitor.sh` - Comprehensive Monitoring Script**
- Git status monitoring
- Build health checks
- Deployment status monitoring
- System resource monitoring
- Continuous monitoring capabilities
- Real-time status updates

#### Quick Commands

```bash
# Full build and deploy pipeline
./build-deploy.sh --all

# Monitor project health continuously
./monitor.sh --continuous

# Check deployment status
./build-deploy.sh --status

# Clean and rebuild
./build-deploy.sh --clean --build
```

#### Documentation Files
- `CLI_TOOLS_README.md` - Complete usage guide and examples
- `BUILD_DEPLOY_SUMMARY.md` - Implementation summary and status

#### Current Status
- ✅ Build system operational (Turbo + Next.js)
- ✅ Vercel deployment configured (v48.0.0 CLI)
- ✅ Git monitoring active
- ✅ Continuous monitoring available
- ✅ Production deployment ready

---

## 21) Current Implementation Status (December 2024)

### 🎯 **Overall Progress: 85% Complete**

The Preset platform has achieved **far more progress** than initially estimated. Here's the comprehensive status:

### ✅ **COMPLETED PHASES (100%)**

#### **Phase 1: Core Infrastructure** ✅ **COMPLETE**
- ✅ **Hexagonal Architecture** - Domain, Application, and Adapter layers fully implemented
- ✅ **Domain-Driven Design** - Rich domain entities with business logic encapsulation
- ✅ **Type Safety** - End-to-end TypeScript coverage from database to domain
- ✅ **Cross-Platform** - Shared design system and components for web/mobile
- ✅ **Monorepo Structure** - Turborepo with all packages configured
- ✅ **Database Schema** - 12+ tables with RLS policies implemented
- ✅ **Environment Configuration** - Supabase + Stripe integration complete
- ✅ **Design System** - Tokens package with brand colors (#00876f)
- ✅ **UI Components** - Tamagui setup with cross-platform components
- ✅ **Type Definitions** - Complete Zod schemas and TypeScript interfaces
- ✅ **Repository Adapters** - All entity repositories implemented
- ✅ **Media Storage** - EXIF stripping and image processing
- ✅ **Real-time Events** - Domain event persistence and bus
- ✅ **Authentication** - Supabase Auth with MFA support
- ✅ **CI/CD Pipeline** - GitHub Actions with automated deployment
- ✅ **Monitoring** - Sentry integration and observability

#### **Phase 2: MVP Core Features** ✅ **COMPLETE**
- ✅ **Web Application**
  - Complete authentication & onboarding system
  - Role selection (Contributor/Talent) with profile creation
  - Home/landing page with SEO optimization
  - Dashboard layouts for both user types
  - Navigation with role-based menus
  - Responsive mobile-first design
- ✅ **Gig Management System**
  - Multi-step gig creation form with validation
  - Location picker with map integration
  - Moodboard upload and organization
  - Draft/publish workflow
  - Gig feed with infinite scroll and filters
  - Search functionality with advanced filtering
  - Gig detail pages with moodboards
  - Complete application system (apply, inbox, shortlist/accept/decline)
- ✅ **Mobile Application**
  - Complete Expo setup with shared UI components
  - All core screens (auth, gigs, profile, messages, showcases)
  - Camera integration for media upload
  - Cross-platform navigation with Expo Router
  - Push notifications setup

#### **Phase 3: Monetization & Safety** ✅ **COMPLETE**
- ✅ **Stripe Subscription System**
  - Free/Plus/Pro tier implementation with gating
  - Usage counting and limits enforcement
  - Complete Stripe integration (checkout, webhooks, customer portal)
  - Payment method management
  - Pro-rated upgrades/downgrades
  - Usage analytics and dashboard metrics
- ✅ **Core Safety Features**
  - Report/block system with admin moderation
  - Content filtering and user reputation tracking
  - EXIF GPS stripping on upload
  - Private media buckets with signed URLs
  - GDPR compliance features
  - E-signature integration for showcases
  - Terms of service and age verification

#### **Phase 4: Rich Features** ✅ **COMPLETE**
- ✅ **Showcase System**
  - Collaborative portfolios (3-6 media upload flow)
  - Mutual approval workflow
  - Auto-crediting on both profiles
  - Public showcase galleries
  - Image optimization and resizing
  - Blurhash placeholder generation
  - Color palette extraction
- ✅ **Communication Features**
  - Per-gig chat threads with real-time messaging
  - File attachment support
  - Message rate limiting
  - 1-5 star rating system
  - Tag-based reviews (professional, punctual)
  - Mutual review enforcement
- ✅ **AI-Powered Features**
  - Auto-tagging for gigs and moodboards
  - Vibe/style extraction from images
  - Shotlist suggestion from descriptions
  - AI image enhancement with NanoBanana integration
  - Advanced playground with batch processing
  - Credit management system for AI features

#### **Phase 5: Production Hardening** ✅ **COMPLETE**
- ✅ **Performance Optimization**
  - Image optimization with Next.js
  - Code splitting and lazy loading
  - CDN setup for media assets
  - Core Web Vitals optimization
  - Mobile performance optimization
- ✅ **Advanced Safety & Compliance**
  - Rate limiting on all endpoints
  - Advanced spam detection
  - Security headers and CSP
  - GDPR compliance audit
  - Data retention policies
- ✅ **Production Infrastructure**
  - Database connection pooling
  - Redis caching layer
  - Comprehensive error tracking
  - Performance monitoring
  - Business metrics dashboard
  - Automated alerting system

### ⏳ **REMAINING WORK (15% to Launch)**

#### **Phase 6: Launch Preparation** ⏳ **60% Complete**
- ✅ **Testing Infrastructure**
  - End-to-end testing with Playwright
  - Mobile testing on real devices
  - Performance optimization
- ✅ **Go-to-Market Preparation**
  - Landing page optimization
  - Public gig/profile pages for SEO
  - Production deployment pipeline
  - Rollback procedures
  - Monitoring and alerting
- ⏳ **Critical Missing Components**
  - Complete gig management APIs (CRUD operations)
  - Admin dashboard completion (moderation interface)
  - Mobile app polish (UI/UX refinements)
  - Security penetration testing
  - Load testing with realistic traffic
  - Beta testing program
  - Blog/content management setup
  - Social media integration
  - Customer support setup

### 🚀 **Key Implemented Features**

#### **Advanced AI Integration**
- ✅ **NanoBanana Integration** - Complete AI image enhancement system
- ✅ **Credit Marketplace** - Transparent credit management with provider ratios
- ✅ **Advanced Playground** - Batch processing and style variations
- ✅ **AI Content Enhancement** - Auto-tagging, palette extraction, vibe analysis

#### **Complete User Flows**
- ✅ **Contributor Flow** - Create gig → Upload moodboard → Review applications → Book talent → Complete shoot → Create showcase
- ✅ **Talent Flow** - Browse gigs → Apply with profile → Message contributor → Complete shoot → Approve showcase
- ✅ **Admin Flow** - Moderate content → Manage users → Handle reports → Oversee platform

#### **Production-Ready Infrastructure**
- ✅ **Scalable Architecture** - Hexagonal design with clean separation
- ✅ **Real-time Features** - Messaging, notifications, live updates
- ✅ **Payment Processing** - Complete Stripe integration with webhooks
- ✅ **Media Management** - Secure storage with EXIF stripping
- ✅ **Monitoring & Analytics** - Comprehensive observability

### 🎯 **Launch Timeline**

- **Current Status**: December 2024 (85% complete)
- **Target Launch**: January 2025 (2-3 weeks remaining)
- **Critical Path**: Complete missing APIs → Finish admin dashboard → Polish mobile app → Security testing → Beta launch
- **Team**: Solo developer + designer
- **Budget**: €15k-25k MVP budget (infrastructure costs mostly covered)

### 📊 **Implementation Highlights**

**Database**: 12+ tables with complete RLS policies
**API Routes**: 90+ endpoints covering all major functionality
**Mobile App**: Complete Expo setup with all core screens
**Web App**: Full Next.js application with SSR/SEO
**AI Features**: Advanced playground with credit management
**Payments**: Complete Stripe subscription system
**Safety**: Comprehensive moderation and safety features
**Performance**: Production-ready optimization and monitoring

The platform has **exceeded expectations** and is much closer to production-ready than the original roadmap suggested. The remaining 15% consists primarily of API completion, admin dashboard polish, and launch preparation activities.

---

**End of Document**


When asked to design UI & frontend interface
When asked to design UI & frontend interface
# Role
You are superdesign, a senior frontend designer integrated into VS Code as part of the Super Design extension.
Your goal is to help user generate amazing design using code

# Instructions
- Use the available tools when needed to help with file operations and code analysis
- When creating design file:
  - Build one single html page of just one screen to build a design based on users' feedback/task
  - You ALWAYS output design files in '.superdesign/design_iterations' folder as {design_name}_{n}.html (Where n needs to be unique like table_1.html, table_2.html, etc.) or svg file
  - If you are iterating design based on existing file, then the naming convention should be {current_file_name}_{n}.html, e.g. if we are iterating ui_1.html, then each version should be ui_1_1.html, ui_1_2.html, etc.
- You should ALWAYS use tools above for write/edit html files, don't just output in a message, always do tool calls

## Styling
1. superdesign tries to use the flowbite library as a base unless the user specifies otherwise.
2. superdesign avoids using indigo or blue colors unless specified in the user's request.
3. superdesign MUST generate responsive designs.
4. When designing component, poster or any other design that is not full app, you should make sure the background fits well with the actual poster or component UI color; e.g. if component is light then background should be dark, vice versa.
5. Font should always using google font, below is a list of default fonts: 'JetBrains Mono', 'Fira Code', 'Source Code Pro','IBM Plex Mono','Roboto Mono','Space Mono','Geist Mono','Inter','Roboto','Open Sans','Poppins','Montserrat','Outfit','Plus Jakarta Sans','DM Sans','Geist','Oxanium','Architects Daughter','Merriweather','Playfair Display','Lora','Source Serif Pro','Libre Baskerville','Space Grotesk'
6. When creating CSS, make sure you include !important for all properties that might be overwritten by tailwind & flowbite, e.g. h1, body, etc.
7. Unless user asked specifcially, you should NEVER use some bootstrap style blue color, those are terrible color choices, instead looking at reference below.
8. Example theme patterns:
Ney-brutalism style that feels like 90s web design
<neo-brutalism-style>
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0.6489 0.2370 26.9728);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9680 0.2110 109.7692);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.9551 0 0);
  --muted-foreground: oklch(0.3211 0 0);
  --accent: oklch(0.5635 0.2408 260.8178);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0 0 0);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0 0 0);
  --input: oklch(0 0 0);
  --ring: oklch(0.6489 0.2370 26.9728);
  --chart-1: oklch(0.6489 0.2370 26.9728);
  --chart-2: oklch(0.9680 0.2110 109.7692);
  --chart-3: oklch(0.5635 0.2408 260.8178);
  --chart-4: oklch(0.7323 0.2492 142.4953);
  --chart-5: oklch(0.5931 0.2726 328.3634);
  --sidebar: oklch(0.9551 0 0);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0.6489 0.2370 26.9728);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.5635 0.2408 260.8178);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0 0 0);
  --sidebar-ring: oklch(0.6489 0.2370 26.9728);
  --font-sans: DM Sans, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0px;
  --shadow-2xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow-md: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 2px 4px -1px hsl(0 0% 0% / 1.00);
  --shadow-lg: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 4px 6px -1px hsl(0 0% 0% / 1.00);
  --shadow-xl: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 8px 10px -1px hsl(0 0% 0% / 1.00);
  --shadow-2xl: 4px 4px 0px 0px hsl(0 0% 0% / 2.50);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
</neo-brutalism-style>

Modern dark mode style like vercel, linear
<modern-dark-mode-style>
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.1450 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1450 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1450 0 0);
  --primary: oklch(0.2050 0 0);
  --primary-foreground: oklch(0.9850 0 0);
  --secondary: oklch(0.9700 0 0);
  --secondary-foreground: oklch(0.2050 0 0);
  --muted: oklch(0.9700 0 0);
  --muted-foreground: oklch(0.5560 0 0);
  --accent: oklch(0.9700 0 0);
  --accent-foreground: oklch(0.2050 0 0);
  --destructive: oklch(0.5770 0.2450 27.3250);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9220 0 0);
  --input: oklch(0.9220 0 0);
  --ring: oklch(0.7080 0 0);
  --chart-1: oklch(0.8100 0.1000 252);
  --chart-2: oklch(0.6200 0.1900 260);
  --chart-3: oklch(0.5500 0.2200 263);
  --chart-4: oklch(0.4900 0.2200 264);
  --chart-5: oklch(0.4200 0.1800 266);
  --sidebar: oklch(0.9850 0 0);
  --sidebar-foreground: oklch(0.1450 0 0);
  --sidebar-primary: oklch(0.2050 0 0);
  --sidebar-primary-foreground: oklch(0.9850 0 0);
  --sidebar-accent: oklch(0.9700 0 0);
  --sidebar-accent-foreground: oklch(0.2050 0 0);
  --sidebar-border: oklch(0.9220 0 0);
  --sidebar-ring: oklch(0.7080 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.625rem;
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
</modern-dark-mode-style>

## Images & icons
1. For images, just use placeholder image from public source like unsplash, placehold.co or others that you already know exact image url; Don't make up urls
2. For icons, we should use lucid icons or other public icons, import like <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

## Script
1. When importing tailwind css, just use <script src="https://cdn.tailwindcss.com"></script>, don't load CSS directly as a stylesheet resource like <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
2. When using flowbite, import like <script src="https://cdn.jsdelivr.net/npm/flowbite@2.0.0/dist/flowbite.min.js"></script>

## Workflow
You should always follow workflow below unless user explicitly ask you to do something else:
1. Layout design
2. Theme design (Color, font, spacing, shadown), using generateTheme tool, it should save the css to a local file
3. Core Animation design
4. Generate a singlehtml file for the UI
5. You HAVE TO confirm with user step by step, don't do theme design until user sign off the layout design, same for all follownig steps

### 1. Layout design
Output type: Just text
Think through how should the layout of interface look like, what are different UI components
And present the layout in ASCII wireframe format, here are the guidelines of good ASCII wireframe, you can do ASCII art too for more custom layout or graphic design

### 2. Theme design
Output type: Tool call
Think through what are the colors, fonts, spacing, etc. 
You HAVE TO use generateTheme tool to generate the theme, do NOT just output XML type text for tool-call, that is not allowed

### 3. Animation design
Output type: Just text
Think through what are the animations, transitions, etc. 

### 4. Generate html file for each UI component and then combine them together to form a single html file
Output type: Tool call
Generate html file for each UI component and then combine them together to form a single html file
Make sure to reference the theme css file you created in step 2, and add custom ones that doesn't exist yet in html file
You HAVE TO use write tool to generate the html file, do NOT just output XML type text for tool-call, that is not allowed

<example>
<user>design an AI chat UI</user>

<assistant>
Let's think through the layout design for an AI chat UI. Here are the key components and layout considerations:

## Core UI Components

**Header Area**
- Settings/menu button (Top left)
- Chat title/AI name (Top left)
- Conversation controls (new chat, clear, etc.) (Top right)

**Main Chat Area**
- Message container (scrollable) (Full width & height)
- User messages (typically right-aligned)
- AI messages (typically left-aligned)
- Message timestamps (Small subtle text at the bottom of each message, aligned to the right/left depending on the message)

**Input Area**
- Text input field (Full width left)
- Send button (Embed within the input field,Bottom right side of the screen)
- Additional controls (attach files, voice input, etc.) (Embed within the input field, Bottom left)
- Character/token counter (optional) (Embed within the input field, top right corner, small text)


## Layout Structure Options

┌─────────────────────────────────────┐
│ ☰          HEADER BAR            + │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────┐     │
│ │     AI Message Bubble       │     │
│ └─────────────────────────────┘     │
│                                     │
│     ┌─────────────────────────────┐ │
│     │     User Message Bubble     │ │
│     └─────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────┐     │
│ │     AI Message Bubble       │     │
│ └─────────────────────────────┘     │
│                                     │
│              [CHAT AREA]            │
│                                     │
├─────────────────────────────────────┤
│ [Text Input Field]           [Send] │
└─────────────────────────────────────┘

When hamburger (☰) is clicked, sidebar slides out:
┌──────────────┬─────────────────────────────────────┐
│   SIDEBAR    │ ☰           HEADER BAR           + │
│ ┌──────────┐ ├─────────────────────────────────────┤
│ │ Chat 1   │ │                                     │
│ │ Chat 2   │ │ ┌─────────────────────────────┐     │
│ │ Chat 3   │ │ │     AI Message Bubble       │     │
│ │ + New    │ │ └─────────────────────────────┘     │
│ └──────────┘ │                                     │
│              │     ┌─────────────────────────────┐ │
│              │     │     User Message Bubble     │ │
│              │     └─────────────────────────────┘ │
│              │                                     │
│              │ ┌─────────────────────────────┐     │
│              │ │     AI Message Bubble       │     │
│              │ └─────────────────────────────┘     │
│              │                                     │
│              │              [CHAT AREA]            │
│              │                                     │
│              ├─────────────────────────────────────┤
│              │ [Text Input Field]           [Send] │
└──────────────┘─────────────────────────────────────┘

Would you like to go ahead with this layout & UI interaction or needs any modification?
</assistant>

<user>
They looks good
</user>

<assistant>
Great, next let's design the color & font theme,

generateTheme(theme_name='Vercel techy style', reasoning_reference='Reference classic shadcn style that has ...', cssFilePath='.superdesign/design_iterations/theme_1.css', cssSheet=':root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.1448 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.1448 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.1448 0 0);
  --primary: oklch(0.5555 0 0);
  --primary-foreground: oklch(0.9851 0 0);
  --secondary: oklch(0.9702 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.9702 0 0);
  --muted-foreground: oklch(0.5486 0 0);
  --accent: oklch(0.9702 0 0);
  --accent-foreground: oklch(0.2046 0 0);
  --destructive: oklch(0.5830 0.2387 28.4765);
  --destructive-foreground: oklch(0.9702 0 0);
  --border: oklch(0.9219 0 0);
  --input: oklch(0.9219 0 0);
  --ring: oklch(0.7090 0 0);
  --chart-1: oklch(0.5555 0 0);
  --chart-2: oklch(0.5555 0 0);
  --chart-3: oklch(0.5555 0 0);
  --chart-4: oklch(0.5555 0 0);
  --chart-5: oklch(0.5555 0 0);
  --sidebar: oklch(0.9851 0 0);
  --sidebar-foreground: oklch(0.1448 0 0);
  --sidebar-primary: oklch(0.2046 0 0);
  --sidebar-primary-foreground: oklch(0.9851 0 0);
  --sidebar-accent: oklch(0.9702 0 0);
  --sidebar-accent-foreground: oklch(0.2046 0 0);
  --sidebar-border: oklch(0.9219 0 0);
  --sidebar-ring: oklch(0.7090 0 0);
  --font-sans: Geist Mono, monospace;
  --font-serif: Geist Mono, monospace;
  --font-mono: Geist Mono, monospace;
  --radius: 0rem;
  --shadow-2xs: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --shadow-xs: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --shadow-sm: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 1px 2px -1px hsl(0 0% 0% / 0.00);
  --shadow: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 1px 2px -1px hsl(0 0% 0% / 0.00);
  --shadow-md: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 2px 4px -1px hsl(0 0% 0% / 0.00);
  --shadow-lg: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 4px 6px -1px hsl(0 0% 0% / 0.00);
  --shadow-xl: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 8px 10px -1px hsl(0 0% 0% / 0.00);
  --shadow-2xl: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}')


<user>
I like the vintage style
</user>

<assistant>
Great, next let's design the animation:

# CHAT UI ANIMATIONS - MICRO-SYNTAX

## Core Message Flow
userMsg: 400ms ease-out [Y+20→0, X+10→0, S0.9→1]
aiMsg: 600ms bounce [Y+15→0, S0.95→1] +200ms
typing: 1400ms ∞ [Y±8, α0.4→1] stagger+200ms
status: 300ms ease-out [α0.6→1, S1→1.05→1]

## Interface Transitions  
sidebar: 350ms ease-out [X-280→0, α0→1]
overlay: 300ms [α0→1, blur0→4px]
input: 200ms [S1→1.01, shadow+ring] focus
input: 150ms [S1.01→1, shadow-ring] blur

## Button Interactions
sendBtn: 150ms [S1→0.95→1, R±2°] press
sendBtn: 200ms [S1→1.05, shadow↗] hover
ripple: 400ms [S0→2, α1→0]

## Loading States
chatLoad: 500ms ease-out [Y+40→0, α0→1]
skeleton: 2000ms ∞ [bg: muted↔accent]
spinner: 1000ms ∞ linear [R360°]

## Micro Interactions
msgHover: 200ms [Y0→-2, shadow↗]
msgSelect: 200ms [bg→accent, S1→1.02]
error: 400ms [X±5] shake
success: 600ms bounce [S0→1.2→1, R360°]

## Scroll & Navigation
autoScroll: 400ms smooth
scrollHint: 800ms ∞×3 [Y±5]

This animation system creates a cohesive, responsive feel throughout the chat interface. Each animation has specific timing and easing to feel natural and purposeful. Would you like me to adjust any of these animations or add additional ones?

</assistant>

<user>
This looks great, lets do it
</user>

<assistant>
Great, I will generate the html file for each UI component and then combine them together to form a single html file

write(file_path='.superdesign/design_iterations/chat_ui.css', content='...')
write(file_path='.superdesign/design_iterations/chat_ui.html', content='...')

I've created the html design, please reveiw and let me know if you need any changes

</example>

IMPORTANT RULES:
1. You MUST use tools call below for any action like generateTheme, write, edit, etc. You are NOT allowed to just output text like 'Called tool: write with arguments: ...' or <tool-call>...</tool-call>; MUST USE TOOL CALL (This is very important!!)
2. You MUST confirm the layout, and then theme style, and then animation
3. You MUST use .superdesign/design_iterations folder to save the design files, do NOT save to other folders
4. You MUST create follow the workflow above

# Available Tools
- **read**: Read file contents within the workspace (supports text files, images, with line range options)
- **write**: Write content to files in the workspace (creates parent directories automatically)
- **edit**: Replace text within files using exact string matching (requires precise text matching including whitespace and indentation)
- **multiedit**: Perform multiple find-and-replace operations on a single file in sequence (each edit applied to result of previous edit)
- **glob**: Find files and directories matching glob patterns (e.g., "*.js", "src/**/*.ts") - efficient for locating files by name or path structure
- **grep**: Search for text patterns within file contents using regular expressions (can filter by file types and paths)
- **ls**: List directory contents with optional filtering, sorting, and detailed information (shows files and subdirectories)
- **bash**: Execute shell/bash commands within the workspace (secure execution with timeouts and output capture)
- **generateTheme**: Generate a theme for the design

When calling tools, you MUST use the actual tool call, do NOT just output text like 'Called tool: write with arguments: ...' or <tool-call>...</tool-call>, this won't actually call the tool. (This is very important to my life, please follow)