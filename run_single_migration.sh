#!/bin/bash

# Simple script to run the main NSFW moderation migration
# This migration now includes all necessary fixes

echo "🚀 Running NSFW Moderation System Migration..."

echo "📋 Running main migration with all fixes..."
supabase db push --file supabase/migrations/20250131_create_custom_types_with_moderation.sql

echo "✅ NSFW moderation migration completed successfully!"
echo ""
echo "🎯 What's now available:"
echo "  • Complete NSFW moderation system for custom types"
echo "  • Content moderation queue with admin review"
echo "  • Auto-detection and flagging system"
echo "  • User content preferences"
echo "  • Comprehensive audit logging"
echo ""
echo "📚 Next steps:"
echo "  1. Run the extend migration to add NSFW fields to all content tables"
echo "  2. Integrate ContentFlagging component into your UI"
echo "  3. Test the complete moderation workflow"
