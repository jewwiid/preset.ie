# Preset Project Structure

## Monorepo Overview
```
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
```

## Package Dependencies
- **Domain**: Pure TypeScript, no external dependencies
- **Application**: Depends on Domain package
- **Adapters**: Implements Application ports, uses Supabase
- **UI**: Cross-platform components with Tamagui
- **Web/Mobile**: Use Domain, Application, UI packages

## Key Files
- `CLAUDE.md` - Complete project specification
- `PRODUCTION_ROADMAP.md` - Implementation roadmap
- `turbo.json` - Monorepo build configuration
- `supabase/migrations/` - Database schema evolution
