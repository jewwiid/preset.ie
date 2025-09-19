#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

// Remote Supabase configuration
const REMOTE_URL = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const REMOTE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

async function autoFixDatabase() {
  console.log('🔧 Auto-fixing Supabase database...\n');
  
  // Create a migration file that Supabase will accept
  const migrationContent = `-- Add purpose column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE public.gigs ADD COLUMN purpose TEXT;
  END IF;
END $$;`;

  // Write migration file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const migrationPath = `./supabase/migrations/${timestamp}_add_purpose_column_auto.sql`;
  
  fs.writeFileSync(migrationPath, migrationContent);
  console.log(`✅ Created migration: ${migrationPath}`);
  
  // Try to push the migration
  console.log('\n🚀 Attempting to push migration to remote database...');
  console.log('This will add the purpose column automatically.\n');
  
  try {
    // Use Supabase CLI to push just this specific migration
    execSync(`npx supabase db push --skip-checks`, { stdio: 'inherit' });
    console.log('\n✅ Migration pushed successfully!');
  } catch (error) {
    console.log('\n⚠️  Could not auto-push migration.');
    console.log('The migration file has been created at:', migrationPath);
    console.log('\nYou can manually run: npx supabase db push');
  }
}

autoFixDatabase().catch(console.error);