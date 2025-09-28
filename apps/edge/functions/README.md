# Supabase Edge Functions

This directory contains Supabase Edge Functions that run in Deno runtime.

## Setup

1. **Deno Configuration**: Each function has its own `deno.json` file
2. **Type Definitions**: Custom types are defined in `types.d.ts`
3. **VS Code**: Configured with Deno extension support

## Functions

### generate-moodboard

Generates moodboards for gigs using:
- Pexels API for stock images
- User uploads
- AI enhancements via NanoBanana API

## Development

Edge Functions are deployed to Supabase and run in Deno runtime. The TypeScript errors you see in your IDE are expected - these functions are designed to run in Supabase's Edge Runtime environment, not in Node.js.

## Deployment

Deploy using Supabase CLI:
```bash
supabase functions deploy generate-moodboard
```
