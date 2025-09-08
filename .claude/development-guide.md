# Preset Development Guide

## Getting Started
```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build all packages
npm run build

# Run tests
npm run test
```

## Development Workflow

### 1. Domain-First Development
Always start with domain modeling:
1. Define entities and value objects in `packages/domain/`
2. Create use cases in `packages/application/`
3. Implement adapters in `packages/adapters/`
4. Build UI components and pages

### 2. Testing Strategy
- **Domain**: Unit tests for entities and value objects
- **Application**: Mock ports/adapters for use case tests
- **Integration**: Test actual Supabase integration
- **E2E**: Playwright tests for critical user flows

### 3. Database Migrations
```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations locally
npx supabase db reset

# Push to remote
npx supabase db push
```

## Code Patterns

### Use Case Implementation
```typescript
export class CreateGigUseCase {
  constructor(
    private gigRepository: GigRepository,
    private userRepository: UserRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: CreateGigCommand): Promise<Result> {
    // 1. Validate input
    // 2. Check business rules
    // 3. Create domain entity
    // 4. Persist via repository
    // 5. Publish domain events
  }
}
```

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

## Security Guidelines
- Always strip EXIF data from uploaded images
- Use RLS policies for data access control
- Validate all inputs at API boundaries
- Rate limit gig creation and applications
- Require 18+ age verification
