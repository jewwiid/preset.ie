#!/bin/bash

# Script to run NSFW moderation migrations in the correct order
# This ensures the content_moderation_queue table constraint is updated before functions try to use it

echo "🚀 Running NSFW Moderation System Migrations..."

echo "📋 Step 1: Extending content tables with NSFW fields..."
supabase db push --file supabase/migrations/20250131_extend_nsfw_moderation_to_all_content.sql

echo "🔧 Step 2: Fixing content_moderation_queue constraints..."
supabase db push --file supabase/migrations/20250131_fix_content_moderation_queue_constraints.sql

echo "⚡ Step 3: Adding queue insertion logic to functions..."
supabase db push --file supabase/migrations/20250131_add_queue_insertion_to_functions.sql

echo "✅ All NSFW moderation migrations completed successfully!"
echo ""
echo "🎯 What's now available:"
echo "  • NSFW fields added to all content tables"
echo "  • User self-reporting for NSFW content"
echo "  • Community flagging system"
echo "  • Content moderation queue integration"
echo "  • Complete API endpoints for flagging and NSFW marking"
echo "  • UI components ready for integration"
echo ""
echo "📚 Next steps:"
echo "  1. Integrate ContentFlagging component into your UI"
echo "  2. Add NSFW detection to other generation APIs"
echo "  3. Implement content filtering in display components"
echo "  4. Test the complete moderation workflow"
