# Preset Rent & Sell Marketplace - Complete Implementation Plan

## 🎯 Project Overview

Transform Preset into a comprehensive creative platform by adding a peer-to-peer equipment marketplace where users can rent and sell photography/videography gear. This document outlines the complete implementation strategy leveraging existing infrastructure.

## 📊 Current Architecture Analysis

### ✅ Existing Infrastructure (Ready to Leverage)
- **Database**: Supabase with comprehensive schema (users, gigs, applications, media, etc.)
- **Authentication**: Supabase Auth with user profiles and verification system (`verified_id` field)
- **Payments**: Credits system + Stripe integration already implemented
- **Messaging**: Thread-based messaging system with real-time capabilities
- **Storage**: Supabase Storage with proper RLS policies
- **Frontend**: Next.js 14 with React 18.2.0, comprehensive component library
- **API Structure**: Well-organized API routes with proper authentication

### 🔧 What Needs to Be Built
1. **Marketplace Database Schema** - New tables for listings, orders, offers, reviews
2. **Marketplace API Endpoints** - CRUD operations for marketplace entities
3. **Frontend Components** - Listing creation, browsing, order management UI
4. **Payment Integration** - Extend existing Credits/Stripe for marketplace transactions
5. **Messaging Integration** - Connect marketplace to existing messaging system
6. **Navigation Integration** - Add marketplace to main app navigation

## 🗄️ Database Schema Design

### Core Marketplace Tables

```sql
-- LISTINGS TABLE
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,              -- e.g., camera, lens, lighting
  condition TEXT,             -- e.g., new, like_new, used
  mode TEXT CHECK (mode in ('rent','sale','both')) not null default 'rent',
  rent_day_cents int,         -- null if not for rent
  rent_week_cents int,        -- optional weekly price
  sale_price_cents int,       -- null if not for sale
  retainer_mode text check (retainer_mode in ('none','credit_hold','card_hold')) not null default 'none',
  retainer_cents int default 0,
  deposit_cents int default 0,
  borrow_ok boolean not null default false,
  quantity int not null default 1,
  location_city text,
  location_country text,
  latitude double precision,
  longitude double precision,
  verified_only boolean not null default false, -- only verified can book
  status text check (status in ('active','paused','archived')) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LISTING IMAGES TABLE
CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  path text not null,           -- storage path in bucket 'listings'
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- AVAILABILITY TABLE (blackouts or reservations)
CREATE TABLE listing_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_date date not null,
  end_date date not null,
  kind text check (kind in ('blackout','reserved')) not null,
  ref_order_id uuid,           -- link when reserved
  created_at timestamptz not null default now()
);

-- RENTAL ORDERS TABLE
CREATE TABLE rental_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  start_date date not null,
  end_date date not null,
  day_rate_cents int not null,
  calculated_total_cents int not null,
  retainer_mode text not null,
  retainer_cents int not null default 0,
  deposit_cents int not null default 0,
  currency text not null default 'EUR',
  status text check (status in (
    'requested','accepted','rejected','paid','in_progress','completed','cancelled','refunded','disputed'
  )) not null default 'requested',
  credits_tx_id uuid,          -- if using credits marketplace
  stripe_pi_id text,           -- PaymentIntent id for card hold/capture
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SALE ORDERS TABLE
CREATE TABLE sale_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  unit_price_cents int not null,
  quantity int not null default 1,
  total_cents int not null,
  currency text not null default 'EUR',
  status text check (status in ('placed','paid','shipped','delivered','cancelled','refunded','disputed')) not null default 'placed',
  credits_tx_id uuid,
  stripe_pi_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- OFFERS TABLE (for rent or sale)
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  from_user uuid not null references users_profile(id) on delete cascade,
  to_user uuid not null references users_profile(id) on delete cascade,
  context text check (context in ('rent','sale')) not null,
  payload jsonb not null,      -- {price_cents, start_date, end_date, quantity}
  status text check (status in ('open','countered','accepted','declined','expired')) not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MARKETPLACE REVIEWS TABLE
CREATE TABLE marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type text check (order_type in ('rent','sale')) not null,
  order_id uuid not null,
  author_id uuid not null references users_profile(id) on delete cascade,
  subject_user_id uuid not null references users_profile(id) on delete cascade,
  rating int check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz not null default now()
);
```

### Storage Setup
- **Bucket**: `listings` (public read, authenticated write)
- **Folder Structure**: `listings/{listing_id}/{filename}.jpg`
- **RLS Policies**: Owner can write, public can read active listings

## 🚀 Implementation Phases

### Phase 1: Database Foundation (Week 1)
**Goal**: Set up marketplace database schema and storage

**Tasks**:
1. Create marketplace migration file (`supabase/migrations/083_marketplace_schema.sql`)
2. Set up `listings` storage bucket with proper policies
3. Implement RLS policies for all marketplace tables
4. Create database indexes for performance
5. Test schema with sample data

**Deliverables**:
- Complete marketplace database schema
- Storage bucket with proper access policies
- Database migration ready for deployment

### Phase 2: Backend API Development (Week 2)
**Goal**: Build comprehensive API endpoints for marketplace operations

**Tasks**:
1. Create marketplace API routes (`/api/marketplace/*`)
2. Implement listing CRUD operations
3. Build order management endpoints
4. Create offer system APIs
5. Integrate with existing Credits/Stripe system
6. Add marketplace context to messaging system

**API Endpoints**:
```
GET    /api/marketplace/listings          - Browse listings
POST   /api/marketplace/listings          - Create listing
GET    /api/marketplace/listings/[id]     - Get listing details
PUT    /api/marketplace/listings/[id]     - Update listing
DELETE /api/marketplace/listings/[id]     - Delete listing

POST   /api/marketplace/rental-orders    - Create rental order
GET    /api/marketplace/rental-orders    - Get user's rental orders
PUT    /api/marketplace/rental-orders/[id] - Update order status

POST   /api/marketplace/sale-orders      - Create sale order
GET    /api/marketplace/sale-orders      - Get user's sale orders

POST   /api/marketplace/offers           - Create offer
GET    /api/marketplace/offers           - Get user's offers
PUT    /api/marketplace/offers/[id]      - Respond to offer

POST   /api/marketplace/reviews          - Create review
GET    /api/marketplace/reviews          - Get reviews for user
```

**Deliverables**:
- Complete API endpoint suite
- Integration with existing payment systems
- Marketplace messaging context

### Phase 3: Frontend Components (Week 3)
**Goal**: Build comprehensive marketplace UI components

**Tasks**:
1. Create marketplace navigation integration
2. Build listing creation and management UI
3. Develop marketplace browsing and search
4. Implement order management interfaces
5. Create offer system UI
6. Build review and rating components

**Components**:
```
/components/marketplace/
├── ListingCard.tsx              - Individual listing display
├── ListingGrid.tsx              - Grid of listings
├── ListingFilters.tsx           - Search and filter controls
├── CreateListingModal.tsx       - Listing creation form
├── ListingDetails.tsx           - Detailed listing view
├── OrderManagement.tsx          - Order status management
├── OfferSystem.tsx              - Offer creation and management
├── ReviewSystem.tsx             - Review and rating UI
└── MarketplaceNavigation.tsx     - Marketplace-specific nav
```

**Pages**:
```
/app/marketplace/
├── page.tsx                     - Marketplace homepage
├── create/
│   └── page.tsx                 - Create listing page
├── [id]/
│   └── page.tsx                 - Listing details page
├── my-listings/
│   └── page.tsx                 - User's listings
├── orders/
│   └── page.tsx                 - Order management
└── offers/
    └── page.tsx                 - Offer management
```

**Deliverables**:
- Complete marketplace UI component library
- Responsive marketplace pages
- Integration with existing design system

### Phase 4: Integration & Polish (Week 4)
**Goal**: Connect all systems and add final features

**Tasks**:
1. Integrate marketplace with existing navigation
2. Add marketplace notifications
3. Implement safety features and verification badges
4. Add liability disclaimers
5. Create admin moderation tools
6. Performance optimization and testing

**Integration Points**:
- **Navigation**: Add "Marketplace" to main nav
- **Dashboard**: Add marketplace widgets
- **Messaging**: Extend threads for marketplace context
- **Notifications**: Add marketplace-specific notifications
- **Admin**: Add marketplace moderation tools

**Deliverables**:
- Fully integrated marketplace
- Complete notification system
- Safety and verification features
- Admin moderation tools

## 💰 Payment Integration Strategy

### Leveraging Existing Systems
1. **Credits System**: Use existing `user_credits` table for marketplace transactions
2. **Stripe Integration**: Extend existing Stripe setup for retainer holds
3. **Payment Flows**: Reuse existing payment processing patterns

### New Payment Features
1. **Retainer Holds**: Credit holds or Stripe PaymentIntent holds
2. **Deposit Management**: Refundable deposits for equipment
3. **Escrow System**: Hold payments until transaction completion
4. **Refund Processing**: Automated refunds for completed transactions

## 🔒 Safety & Verification Features

### User Verification
- Leverage existing `verified_id` field in `users_profile`
- Display verification badges in marketplace UI
- Allow listings to require verified users only

### Safety Measures
1. **Liability Disclaimers**: Clear platform liability limitations
2. **Transaction Records**: Complete audit trail for all transactions
3. **Dispute System**: Basic dispute tracking (non-arbitration)
4. **Content Moderation**: Extend existing reporting system

## 📱 Mobile Integration

### Leveraging Existing Mobile App
- Extend existing Expo mobile app
- Reuse existing navigation patterns
- Integrate with existing camera functionality for listing photos

### Mobile-Specific Features
- Camera integration for listing photos
- Location services for pickup/delivery
- Push notifications for marketplace events

## 🧪 Testing Strategy

### Database Testing
- Test all CRUD operations
- Verify RLS policies
- Test payment integration
- Validate data integrity

### API Testing
- Test all endpoints with various scenarios
- Verify authentication and authorization
- Test payment flows
- Validate error handling

### Frontend Testing
- Test all UI components
- Verify responsive design
- Test user flows
- Validate form submissions

### Integration Testing
- Test end-to-end user flows
- Verify payment processing
- Test notification delivery
- Validate data consistency

## 📈 Success Metrics

### User Engagement
- Number of active listings
- Transaction volume
- User retention in marketplace
- Time spent in marketplace

### Business Metrics
- Revenue from marketplace transactions
- Credit consumption for marketplace features
- User conversion from gigs to marketplace
- Platform growth metrics

## 🚀 Deployment Strategy

### Development Environment
1. Set up marketplace schema in dev database
2. Test all functionality in development
3. Verify integration with existing systems

### Staging Environment
1. Deploy marketplace to staging
2. Test with production-like data
3. Verify payment processing
4. Test mobile app integration

### Production Deployment
1. Deploy database migration
2. Deploy API endpoints
3. Deploy frontend components
4. Monitor system performance
5. Gather user feedback

## 🔄 Post-Launch Optimization

### Performance Monitoring
- Monitor database performance
- Track API response times
- Monitor payment processing
- Track user engagement

### Feature Iterations
- Gather user feedback
- Identify pain points
- Prioritize improvements
- Implement enhancements

### Scaling Considerations
- Database optimization
- API rate limiting
- CDN for images
- Caching strategies

## 📋 Implementation Checklist

### Phase 1: Database Foundation
- [ ] Create marketplace schema migration
- [ ] Set up listings storage bucket
- [ ] Implement RLS policies
- [ ] Create database indexes
- [ ] Test schema with sample data

### Phase 2: Backend API
- [ ] Create marketplace API routes
- [ ] Implement listing CRUD operations
- [ ] Build order management endpoints
- [ ] Create offer system APIs
- [ ] Integrate with Credits/Stripe
- [ ] Add marketplace messaging context

### Phase 3: Frontend Components
- [ ] Create marketplace navigation
- [ ] Build listing creation UI
- [ ] Develop marketplace browsing
- [ ] Implement order management
- [ ] Create offer system UI
- [ ] Build review components

### Phase 4: Integration & Polish
- [ ] Integrate with main navigation
- [ ] Add marketplace notifications
- [ ] Implement safety features
- [ ] Add liability disclaimers
- [ ] Create admin tools
- [ ] Performance optimization

## 🎯 Success Criteria

### Technical Success
- All marketplace features functional
- Seamless integration with existing systems
- Robust payment processing
- Comprehensive safety measures

### Business Success
- Active user engagement in marketplace
- Successful transactions
- Positive user feedback
- Platform growth

### User Experience Success
- Intuitive marketplace interface
- Smooth transaction flows
- Clear communication tools
- Trust and safety features

---

**Next Steps**: Begin with Phase 1 (Database Foundation) by creating the marketplace schema migration and setting up the storage bucket. This will provide the foundation for all subsequent development phases.
