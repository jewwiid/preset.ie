# Preset Development Instructions

## Code Style & Conventions

### TypeScript
- Use strict mode with `noImplicitAny`, `strictNullChecks`
- Prefer `interface` over `type` for object shapes
- Use `const assertions` for immutable data
- Always define return types for public methods

### Domain Layer Rules
```typescript
// ✅ Good - Pure domain logic, no framework imports
export class Gig extends AggregateRoot<GigProps> {
  publish(): void {
    if (this.props.status !== GigStatus.DRAFT) {
      throw new Error('Can only publish draft gigs');
    }
    this.addDomainEvent(new GigPublishedEvent(this.id.toString()));
  }
}

// ❌ Bad - Framework dependencies in domain
import { NextRequest } from 'next/server';
export class Gig {
  // Domain logic mixed with infrastructure
}
```

### Use Case Pattern
```typescript
// ✅ Dependency injection with ports
export class CreateGigUseCase {
  constructor(
    private gigRepository: GigRepository, // Port/interface
    private eventBus: EventBus // Port/interface  
  ) {}
  
  async execute(command: CreateGigCommand): Promise<Result> {
    // Validation
    // Business logic
    // Persistence via port
    // Event publishing
  }
}
```

### Error Handling
- Use custom domain exceptions for business rule violations
- Return `Result<T, Error>` types for use cases when appropriate
- Always validate input at boundaries (API, use cases)

## Architecture Patterns

### Repository Pattern
```typescript
// Port (interface)
export interface GigRepository {
  save(gig: Gig): Promise<void>;
  findById(id: EntityId): Promise<Gig | null>;
}

// Adapter (implementation)  
export class SupabaseGigRepository implements GigRepository {
  // Supabase-specific implementation
}
```

### Domain Events
```typescript
// 1. Raise events in domain
gig.addDomainEvent(new GigCreatedEvent(gig.id.toString()));

// 2. Publish after persistence
await this.gigRepository.save(gig);
await this.eventBus.publishMany(gig.getEvents());
gig.clearEvents();
```

## Security Requirements

### Data Privacy
- Strip EXIF GPS data from all uploaded images
- Use signed URLs for private media access
- Implement proper RLS policies for data access

### Content Safety
- Rate limit gig creation and applications
- Require age verification (18+)
- Implement report/block functionality
- Review queue for new accounts

### Subscription Enforcement
```typescript
// Always check limits in use cases
if (!user.canCreateGig(currentGigCount)) {
  throw new Error('Gig creation limit reached for current subscription tier');
}
```

## Testing Strategy

### Domain Layer Tests
```typescript
describe('Gig', () => {
  it('should publish draft gig', () => {
    const gig = Gig.create(/* props */);
    gig.publish();
    expect(gig.status).toBe(GigStatus.PUBLISHED);
    expect(gig.getEvents()).toContainEqual(
      expect.any(GigPublishedEvent)
    );
  });
});
```

### Use Case Tests
```typescript
describe('CreateGigUseCase', () => {
  let mockGigRepository: jest.Mocked<GigRepository>;
  let useCase: CreateGigUseCase;
  
  beforeEach(() => {
    mockGigRepository = createMockGigRepository();
    useCase = new CreateGigUseCase(mockGigRepository, mockEventBus);
  });
});
```

## Performance Guidelines

### Database
- Use database indexes on frequently queried columns
- Implement pagination for large lists
- Use RLS policies efficiently (avoid N+1 queries)

### Media Handling  
- Generate blurhash placeholders for images
- Use responsive image srcsets
- Implement lazy loading for image-heavy feeds

### Caching
- Cache static content (moodboards, public profiles)
- Use Supabase realtime for live updates
- Implement optimistic updates in UI

## Common Patterns

### Validation
```typescript
// Domain validation in value objects
export class Location {
  constructor(text: string, lat?: number, lng?: number) {
    if (!text?.trim()) {
      throw new Error('Location text is required');
    }
    // Additional validation...
  }
}
```

### Subscription Gating
```typescript
// In use cases, always check subscription limits
const user = await this.userRepository.findById(userId);
if (!user.canApply(currentApplicationCount)) {
  throw new SubscriptionLimitError('Application limit reached');
}
```

### Event Publishing
```typescript
// After successful persistence
const events = aggregate.getEvents();
await this.eventBus.publishMany(events);
aggregate.clearEvents();
```