/**
 * @preset/adapters
 * 
 * Supabase adapters implementing hexagonal architecture ports
 * for the Preset creative collaboration platform.
 * 
 * This package provides the infrastructure layer that implements
 * the ports defined in @preset/application, connecting the domain
 * logic to Supabase services (database, auth, storage).
 */

// Supabase client and configuration
export * from './clients/supabase.client';

// Repository adapters (to be implemented after schema application)
// export * from './repositories/gig.repository';
// export * from './repositories/user-profile.repository';
// export * from './repositories/application.repository';
// export * from './repositories/showcase.repository';
// export * from './repositories/media.repository';

// Service adapters
export * from './services/featured-image.service';
export * from './services/stock-photo-downloader.service';
export * from './services/pexels.service';
export * from './services/unsplash.service';
export * from './services/pixabay.service';
// export * from './services/moodboard.service';
// export * from './services/enhanced-moodboard.service';
export * from './services/nanobana.service';

// Configuration and types
export * from './types/database.types';
export * from './types/stock-photo.types';

/**
 * Current Status:
 * ✅ Supabase connection verified and working
 * ✅ Environment configuration complete
 * ✅ Test and verification tools ready
 * ⏳ Database schema needs to be applied via Supabase Dashboard
 * 🚧 Repository and service adapters pending schema application
 * 
 * Next Steps:
 * 1. Apply database schema: supabase/migrations/001_initial_schema.sql
 * 2. Apply RLS policies: supabase/migrations/002_rls_policies.sql
 * 3. Run verification: npm run verify-setup
 * 4. Implement repository adapters
 * 5. Add authentication and storage services
 * 
 * Documentation:
 * - Setup Instructions: ./SETUP_INSTRUCTIONS.md
 * - Status Report: ./SUPABASE_STATUS_REPORT.md
 * - Verification: npm run verify or node src/verify-setup.js
 */

export const adapterStatus = {
  connection: 'READY',
  schema: 'PENDING_APPLICATION', 
  repositories: 'PENDING_SCHEMA',
  services: 'PENDING_SCHEMA'
} as const;