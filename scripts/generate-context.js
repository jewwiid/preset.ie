#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate comprehensive context for Claude Code
function generateContext() {
  const contextDir = '.claude';
  
  // Ensure .claude directory exists
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  // Generate project structure overview
  const structure = generateProjectStructure();
  fs.writeFileSync(path.join(contextDir, 'structure.md'), structure);

  // Generate domain model overview
  const domainModel = generateDomainModel();
  fs.writeFileSync(path.join(contextDir, 'domain-model.md'), domainModel);

  // Generate API reference
  const apiRef = generateAPIReference();
  fs.writeFileSync(path.join(contextDir, 'api-reference.md'), apiRef);

  // Generate development guide
  const devGuide = generateDevelopmentGuide();
  fs.writeFileSync(path.join(contextDir, 'development-guide.md'), devGuide);

  console.log('✅ Context files generated in .claude/');
}

function generateProjectStructure() {
  return `# Preset Project Structure

## Monorepo Overview
\`\`\`
preset/
├── apps/
│   ├── web/           # Next.js web application
│   ├── mobile/        # Expo React Native app  
│   └── edge/          # Supabase Edge Functions
├── packages/
│   ├── domain/        # ✅ DDD entities, value objects, events
│   ├── application/   # ✅ Use cases, ports (interfaces)
│   ├── adapters/      # ⏳ Repository implementations
│   ├── ui/            # ⏳ Shared Tamagui components
│   ├── tokens/        # ⏳ Design tokens
│   └── types/         # ⏳ Zod schemas, DTOs
├── supabase/
│   └── migrations/    # ✅ Database schema + RLS
├── .claude/           # Context and instructions
└── scripts/           # Build and utility scripts
\`\`\`

## Package Dependencies
- **Domain**: Pure TypeScript, no external dependencies
- **Application**: Depends on Domain package
- **Adapters**: Implements Application ports, uses Supabase
- **UI**: Cross-platform components with Tamagui
- **Web/Mobile**: Use Domain, Application, UI packages

## Key Files
- \`CLAUDE.md\` - Complete project specification
- \`PRODUCTION_ROADMAP.md\` - Implementation roadmap
- \`turbo.json\` - Monorepo build configuration
- \`supabase/migrations/\` - Database schema evolution
`;
}

function generateDomainModel() {
  return `# Preset Domain Model

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
\`\`\`typescript
// Free Talent: 3 applications/month, 3 showcases
// Plus Talent: Unlimited applications, 10 showcases  
// Pro Talent: Unlimited applications & showcases

if (!user.canApply(currentApplicationCount)) {
  throw new Error('Application limit reached');
}
\`\`\`

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
- \`GigCreated\`, \`GigPublished\`, \`GigBooked\`
- \`ApplicationSubmitted\`, \`ApplicationAccepted\`
- \`ShowcasePublished\`, \`UserReported\`
`;
}

function generateAPIReference() {
  return `# Preset API Reference

## Authentication
- Supabase Auth with email/password
- Role-based access control (RLS policies)
- JWT tokens for session management

## Core Endpoints

### Gigs
\`\`\`
POST   /api/gigs              # Create new gig
GET    /api/gigs              # List published gigs (with filters)
GET    /api/gigs/:id          # Get gig details
PATCH  /api/gigs/:id          # Update gig (owner only)
POST   /api/gigs/:id/publish  # Publish draft gig
\`\`\`

### Applications
\`\`\`
POST   /api/gigs/:id/apply         # Apply to gig
GET    /api/gigs/:id/applications  # List applications (owner)
PATCH  /api/applications/:id       # Update application status
\`\`\`

### Showcases
\`\`\`
POST   /api/gigs/:id/showcase    # Create showcase
PATCH  /api/showcases/:id/approve # Approve showcase
GET    /api/showcases            # List public showcases
\`\`\`

### Media
\`\`\`
POST   /api/media/upload      # Upload media (images/videos)
GET    /api/media/:id         # Get media (signed URLs)
\`\`\`

## Database Schema
- **users_profile** - User profiles and subscription info
- **gigs** - Gig details with location and compensation
- **applications** - Talent applications to gigs
- **showcases** - Collaborative portfolios
- **media** - Image/video storage with metadata
- **moodboards** - Gig visual references
- **messages** - Per-gig messaging threads
- **subscriptions** - Stripe subscription tracking
`;
}

function generateDevelopmentGuide() {
  return `# Preset Development Guide

## Getting Started
\`\`\`bash
# Install dependencies
npm install

# Start development
npm run dev

# Build all packages
npm run build

# Run tests
npm run test
\`\`\`

## Development Workflow

### 1. Domain-First Development
Always start with domain modeling:
1. Define entities and value objects in \`packages/domain/\`
2. Create use cases in \`packages/application/\`
3. Implement adapters in \`packages/adapters/\`
4. Build UI components and pages

### 2. Testing Strategy
- **Domain**: Unit tests for entities and value objects
- **Application**: Mock ports/adapters for use case tests
- **Integration**: Test actual Supabase integration
- **E2E**: Playwright tests for critical user flows

### 3. Database Migrations
\`\`\`bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations locally
npx supabase db reset

# Push to remote
npx supabase db push
\`\`\`

## Code Patterns

### Use Case Implementation
\`\`\`typescript
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
\`\`\`

### Repository Pattern
\`\`\`typescript
// Port (interface)
export interface GigRepository {
  save(gig: Gig): Promise<void>;
  findById(id: EntityId): Promise<Gig | null>;
}

// Adapter (implementation)
export class SupabaseGigRepository implements GigRepository {
  // Supabase-specific implementation
}
\`\`\`

## Security Guidelines
- Always strip EXIF data from uploaded images
- Use RLS policies for data access control
- Validate all inputs at API boundaries
- Rate limit gig creation and applications
- Require 18+ age verification
`;
}

// Run the script
generateContext();