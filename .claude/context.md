# Preset Project Context

## Architecture Overview
Preset follows **Domain-Driven Design (DDD)** with **Hexagonal Architecture** (Ports & Adapters pattern).

### Layer Structure
```
┌─────────────────────────────────────────────────────────┐
│                    Delivery Layer                       │
│  (Next.js Web App, Expo Mobile, API Routes, Edge)      │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                     │
│         (Use Cases, Ports/Interfaces)                  │
├─────────────────────────────────────────────────────────┤
│                     Domain Layer                        │
│    (Entities, Value Objects, Domain Events)            │
├─────────────────────────────────────────────────────────┤
│                   Adapter Layer                         │
│  (Supabase Repos, Storage, Auth, Stripe, etc.)        │
└─────────────────────────────────────────────────────────┘
```

## Bounded Contexts
1. **Identity & Access** - Users, profiles, authentication, authorization
2. **Gigs** - Gig creation, management, publishing, booking
3. **Applications** - Talent applications to gigs, shortlisting
4. **Collaboration & Messaging** - Per-gig messaging, communications
5. **Media & Moodboards** - Image/video upload, moodboard creation
6. **Showcases & Reviews** - Portfolio creation, mutual approval, ratings

## Key Domain Rules
- Contributors post gigs, Talent applies
- Subscription tiers gate features (applications/month, gig limits)
- Showcases require mutual approval from both parties
- All media must have EXIF stripped for privacy
- Age verification required (18+)
- Usage rights must be agreed upon before showcase publication

## Current Implementation Status
✅ Domain entities, value objects, and events
✅ Application layer use cases and ports  
✅ Database schema with RLS policies
⏳ Adapter implementations
⏳ UI component library
⏳ Next.js web application
⏳ Expo mobile application

## Development Guidelines
1. **Domain-First**: Always model domain concepts before implementation
2. **Type Safety**: Use TypeScript strict mode throughout
3. **Security**: Apply RLS policies, input validation, rate limiting
4. **Testing**: Mock ports/adapters for domain/application layer tests
5. **Performance**: Optimize for mobile-first, lazy loading, caching