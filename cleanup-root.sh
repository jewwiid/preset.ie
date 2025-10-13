#!/bin/bash

# Root Folder Cleanup Script
# Generated: October 13, 2025
# See ROOT_FOLDER_CLEANUP_PLAN.md for full details

set -e

echo "🧹 Starting root folder cleanup..."
echo ""
echo "⚠️  This will reorganize your root directory."
echo "    Make sure you have committed your changes!"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

# Phase 1: Delete temporary files
echo ""
echo "Phase 1: Deleting temporary files..."
rm -f dev-debug.log dev-output.log dev.log 2>/dev/null || true
rm -f james-murphy-profile-updated.png 2>/dev/null || true
rm -f supabase.tar.gz 2>/dev/null || true
rm -f marketplace-*.json 2>/dev/null || true
rm -f temp_*.sql 2>/dev/null || true
echo "✅ Temporary files deleted"

# Phase 2: Create directory structure
echo ""
echo "Phase 2: Creating directory structure..."
mkdir -p docs/features/{credits,enhancements,gigs,invitations,moodboards,presets,treatments,ui}
mkdir -p scripts/{email/{campaigns,import,testing},dev/env,deployment,migrations,admin,browser-tools}
mkdir -p migrations/{manual,patches}
mkdir -p sql-backups/{diagnostics,archive}
echo "✅ Directories created"

# Phase 3: Move Markdown files
echo ""
echo "Phase 3: Moving documentation files..."

# Helper function to move file if exists
move_file() {
    if [ -f "$1" ]; then
        mv "$1" "$2" 2>/dev/null && echo "  ✓ Moved: $(basename $1)" || echo "  ⚠ Could not move: $1"
    fi
}

# Admin & Dashboard
move_file "ADMIN_DASHBOARD_UPDATE_COMPLETE.md" "docs/admin/"
move_file "ADMIN_DASHBOARD_UPDATE_GUIDE.md" "docs/admin/"
move_file "API_FAILURE_ALERTS_SETUP.md" "docs/features/"
move_file "DAILY_ADMIN_SUMMARY_SETUP.md" "docs/features/"

# Credit System
move_file "CREDITS_ATTRIBUTION_SYSTEM.md" "docs/features/credits/"
move_file "CREDIT_FLOW_DIAGRAM.md" "docs/features/credits/"
move_file "CREDIT_SYSTEM_BUG_FIXES.md" "docs/features/credits/"
move_file "CREDIT_SYSTEM_FIXES_IMPLEMENTED.md" "docs/features/credits/"
move_file "PLATFORM_CREDITS_STATUS.md" "docs/features/credits/"
move_file "REFUND_EXECUTIVE_SUMMARY.md" "docs/features/credits/"
move_file "REFUND_IMPLEMENTATION_COMPLETE.md" "docs/features/credits/"
move_file "REFUND_LOGIC_ANALYSIS.md" "docs/features/credits/"
move_file "REFUND_SYSTEM_README.md" "docs/features/credits/"

# Database & Architecture
move_file "DATABASE_DRIVEN_COMPLETE.md" "docs/technical/"
move_file "DATABASE_DRIVEN_FORMS_GUIDE.md" "docs/technical/"
move_file "DATABASE_ROLES_AND_OPTIONS.md" "docs/technical/"
move_file "CLEANUP_UNUSED_TABLES.md" "docs/technical/"
move_file "COMPLETE_CLEANUP_SUMMARY.md" "docs/technical/"

# Email System
move_file "DAILY_EMAIL_SYSTEM_COMPLETE.md" "docs/email-marketing/"
move_file "PLUNK_EMAIL_SETUP.md" "docs/email-marketing/"
move_file "REFERRER_EMAIL_NOTIFICATIONS.md" "docs/email-marketing/"

# Enhancements
move_file "ENHANCEMENT_METADATA_COMPATIBILITY_FIX.md" "docs/features/enhancements/"
move_file "ENHANCEMENT_SOURCE_IMAGE_FIX.md" "docs/features/enhancements/"
move_file "IMAGE_METADATA_EDITING_COMPLETE.md" "docs/features/enhancements/"
move_file "IMAGE_METADATA_EDITING_IMPLEMENTATION.md" "docs/features/enhancements/"

# Homepage & Fixes
move_file "HOMEPAGE_BUGS_FIXED.md" "docs/fixes-and-bugs/"
move_file "HOMEPAGE_BUG_ANALYSIS.md" "docs/fixes-and-bugs/"
move_file "HOMEPAGE_IMAGE_OPTIMIZATION_FIX.md" "docs/fixes-and-bugs/"
move_file "HOMEPAGE_REFACTOR_COMPLETE.md" "docs/fixes-and-bugs/"

# Gigs
move_file "GIG_CREATION_FLOW_TEST_RESULTS.md" "docs/features/gigs/"
move_file "GIG_LOCATION_FIELDS_UPDATE.md" "docs/features/gigs/"

# Invitations
move_file "INVITE_SYSTEM_IMPLEMENTATION.md" "docs/features/invitations/"
move_file "INVITE_SYSTEM_QUICKSTART.md" "docs/features/invitations/"

# Moodboards
move_file "MOODBOARDS_SCHEMA_ANALYSIS.md" "docs/features/moodboards/"
move_file "MOODBOARD_ERROR_FIX.md" "docs/features/moodboards/"
move_file "MOODBOARD_IMPLEMENTATION_COMPLETE.md" "docs/features/moodboards/"
move_file "MOODBOARD_MIGRATION_SOLUTION.md" "docs/features/moodboards/"
move_file "MOODBOARD_SOURCE_IMAGE_TRACKING.md" "docs/features/moodboards/"
move_file "MOODBOARD_SYSTEM_ANALYSIS.md" "docs/features/moodboards/"

# Platform & Storage
move_file "PLATFORM_IMAGES_FOLDER_STRUCTURE.md" "docs/technical/"
move_file "MISSING_MIGRATIONS_FIX.md" "docs/migrations/"

# Presets
move_file "PRESET_DESIGN_SYSTEM.md" "docs/features/presets/"
move_file "PUBLIC_TOGGLE_SHADCN_IMPROVEMENTS.md" "docs/features/presets/"

# Master Plans
move_file "REFACTORING_MASTER_PLAN.md" "docs/session-summaries/"
move_file "IMPLEMENTATION_SUMMARY.md" "docs/session-summaries/"
move_file "FIXES_APPLIED.md" "docs/session-summaries/"

# Treatments
move_file "TREATMENT_ANALYTICS_COMPARISON.md" "docs/features/treatments/"

# UI
move_file "TEMPLATE_NAME_DESIGN_IMPROVEMENTS.md" "docs/features/ui/"

echo "✅ Documentation files moved"

# Phase 4: Move Python scripts
echo ""
echo "Phase 4: Moving Python scripts..."
move_file "create_test_campaigns.py" "scripts/email/campaigns/"
move_file "regenerate_all_campaigns_gdpr_compliant.py" "scripts/email/campaigns/"
move_file "send_campaign.py" "scripts/email/campaigns/"
move_file "send_all_role_campaigns_to_plunk.py" "scripts/email/campaigns/"
move_file "send_complete_campaign_set_to_plunk.py" "scripts/email/campaigns/"
move_file "send_feature_campaigns_to_plunk.py" "scripts/email/campaigns/"
move_file "send_gdpr_compliant_campaigns.py" "scripts/email/campaigns/"
move_file "send_missing_campaigns_to_plunk.py" "scripts/email/campaigns/"
move_file "send_specialized_campaigns_to_plunk.py" "scripts/email/campaigns/"
move_file "plunk_bulk_api_import.py" "scripts/email/import/"
move_file "plunk_bulk_import.py" "scripts/email/import/"
move_file "plunk_import_db_simple.py" "scripts/email/import/"
move_file "plunk_import_from_api.py" "scripts/email/import/"
move_file "plunk_import_from_db.py" "scripts/email/import/"
move_file "plunk_import_with_env.py" "scripts/email/import/"
move_file "test_complete_email_system.py" "scripts/email/testing/"
move_file "test_create_plunk_campaigns.py" "scripts/email/testing/"
move_file "test_plunk_import.py" "scripts/email/testing/"
move_file "verify_email_preferences_fix.py" "scripts/email/testing/"
echo "✅ Python scripts moved"

# Phase 5: Move Shell scripts
echo ""
echo "Phase 5: Moving Shell scripts..."
move_file "add-env-vars.sh" "scripts/dev/env/"
move_file "check-env.sh" "scripts/dev/env/"
move_file "remove-secrets.sh" "scripts/dev/env/"
move_file "build-deploy.sh" "scripts/deployment/"
move_file "monitor.sh" "scripts/dev/"
move_file "restart-dev-server.sh" "scripts/dev/"
move_file "switch-to-local.sh" "scripts/dev/"
move_file "switch-to-server.sh" "scripts/dev/"
move_file "fix_supabase_imports.sh" "scripts/migrations/"
move_file "run_moodboard_migration.sh" "scripts/migrations/"
echo "✅ Shell scripts moved"

# Phase 6: Move JavaScript scripts
echo ""
echo "Phase 6: Moving JavaScript scripts..."
move_file "apply_oauth_fix.js" "scripts/admin/"
move_file "create-admin-user.js" "scripts/admin/"
move_file "fix-admin-auth.js" "scripts/admin/"
move_file "fix-storage-policies.js" "scripts/admin/"
move_file "reset-admin-password.js" "scripts/admin/"
echo "✅ JavaScript scripts moved"

# Phase 7: Move HTML tools
echo ""
echo "Phase 7: Moving browser tools..."
move_file "clear-auth-cache.html" "scripts/browser-tools/"
move_file "clear-cache.html" "scripts/browser-tools/"
echo "✅ Browser tools moved"

# Phase 8: Move other files
echo ""
echo "Phase 8: Moving other files..."
move_file "sample_contacts.csv" "scripts/email/import/"
move_file "NEW_ADMIN_CREDIT_STATS_API.ts" "docs/features/credits/"
echo "✅ Other files moved"

# Phase 9: Update .gitignore
echo ""
echo "Phase 9: Updating .gitignore..."
if ! grep -q "# Development logs" .gitignore 2>/dev/null; then
    cat >> .gitignore << 'EOF'

# Development logs
*.log
dev-debug.log
dev-output.log
dev.log

# Temporary files
temp_*.sql
temp_*.js
temp_*.ts
*-test-results.json

# Archives
*.tar.gz
*.zip

# Test images
*-profile-updated.png
EOF
    echo "✅ .gitignore updated"
else
    echo "✅ .gitignore already has cleanup rules"
fi

echo ""
echo "🎉 Phase 1-3 cleanup complete!"
echo ""
echo "Summary:"
echo "  ✅ Temporary files deleted"
echo "  ✅ Directory structure created"
echo "  ✅ ~49 Markdown files organized"
echo "  ✅ ~19 Python scripts organized"
echo "  ✅ ~10 Shell scripts organized"
echo "  ✅ ~5 JavaScript files organized"
echo "  ✅ Other files moved"
echo ""
echo "⚠️  SQL files (216) still need organization"
echo "    Run './organize-sql-files.sh' to organize them"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Test documentation links"
echo "  3. Run organize-sql-files.sh"
echo "  4. Commit changes: git add . && git commit"

