# Preset Domain Model

## Bounded Contexts

### 1. Identity & Access
- **UserProfile** - User profiles with roles and subscription tiers
- **Subscription** - Subscription management with tier-based limits
- **UserRoles** - Multi-role support (Contributor/Talent/Admin)

### 2. Gigs
- **Gig** - Core aggregate for creative opportunities
- **Location** - Geographic location with radius
- **Compensation** - TFP/Paid/Expenses classification
- **GigStatus** - Draft → Published → Booked → Completed

### 3. Applications
- **Application** - Talent applications to gigs
- **ApplicationStatus** - Pending → Shortlisted → Accepted/Declined

### 4. Showcases & Reviews
- **Showcase** - Collaborative portfolios (3-6 media items)
- **ShowcaseVisibility** - Draft → Public (requires mutual approval)

## Key Domain Rules

### Subscription Limits
```typescript
// Free Talent: 3 applications/month, 3 showcases
// Plus Talent: Unlimited applications, 10 showcases  
// Pro Talent: Unlimited applications & showcases

if (!user.canApply(currentApplicationCount)) {
  throw new Error('Application limit reached');
}
```

### Gig Lifecycle
1. **Draft** → **Published** (contributor publishes)
2. **Published** → **Applications Closed** (deadline or manual)
3. **Applications Closed** → **Booked** (talent selected)
4. **Booked** → **Completed** (work finished)

### Showcase Workflow
1. Both parties upload 3-6 media items
2. Both must approve before public visibility
3. Auto-credited on both profiles when published

## Domain Events
- `GigCreated`, `GigPublished`, `GigBooked`
- `ApplicationSubmitted`, `ApplicationAccepted`
- `ShowcasePublished`, `UserReported`
