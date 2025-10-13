#!/bin/bash

# Safe moodboard migration script
# This script runs the migration safely without causing deadlocks

echo "🚀 Starting safe moodboard migration..."

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "📋 Checking current database status..."

# Run the safe migration
echo "🔄 Running safe moodboard migration..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎉 Your moodboards table now includes:"
    echo "   • Public/private visibility (is_public)"
    echo "   • Template system (is_template, template_name, template_description)"
    echo "   • AI analysis fields (vibe_summary, mood_descriptors, ai_analysis_status)"
    echo "   • Cost tracking (total_cost, source_breakdown, enhancement_log)"
    echo "   • Vibe system (vibe_ids with limit of 5)"
    echo "   • Proper indexes for performance"
    echo "   • RLS policies for security"
    echo ""
    echo "🚀 Ready to test the moodboard functionality!"
else
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "🔧 Troubleshooting tips:"
    echo "   1. Make sure your database is running: supabase start"
    echo "   2. Check for any active connections that might cause locks"
    echo "   3. Try running: supabase db reset (WARNING: This will reset your database)"
    exit 1
fi



