# Root Folder Cleanup & Organization Plan

**Generated:** October 13, 2025  
**Repository:** preset.ie

## Executive Summary

The root folder contains **299 files** that should be organized into proper directories. This cleanup will improve code maintainability, navigation, and project structure.

### Files to Organize

| Type | Count | Current Location | Target Location |
|------|-------|------------------|-----------------|
| Markdown Documentation | 49 | Root | `/docs/` subdirectories |
| SQL Migration Scripts | 216 | Root | `/migrations/` or `/sql-backups/` |
| Python Scripts | 19 | Root | `/scripts/email/` |
| Shell Scripts | 10 | Root | `/scripts/dev/` |
| JavaScript Scripts | 5 | Root | `/scripts/admin/` |
| TypeScript Files | 1 | Root | `/apps/web/app/api/admin/` |
| Other Files | Various | Root | Archive/Delete |

---

## 1. Markdown Documentation Files (49 files)

### Current State
All 49 Markdown files are in the root directory, making it cluttered and hard to navigate.

### Proposed Organization

#### A. Admin & Dashboard Documentation (4 files)
**Target:** `/docs/admin/`

```
✓ ADMIN_DASHBOARD_UPDATE_COMPLETE.md
✓ ADMIN_DASHBOARD_UPDATE_GUIDE.md
```

**Target:** `/docs/features/`

```
✓ API_FAILURE_ALERTS_SETUP.md
✓ DAILY_ADMIN_SUMMARY_SETUP.md
```

---

#### B. Credit System Documentation (7 files)
**Target:** `/docs/business/` or `/docs/features/credits/`

```
✓ CREDITS_ATTRIBUTION_SYSTEM.md
✓ CREDIT_FLOW_DIAGRAM.md
✓ CREDIT_SYSTEM_BUG_FIXES.md
✓ CREDIT_SYSTEM_FIXES_IMPLEMENTED.md
✓ PLATFORM_CREDITS_STATUS.md
✓ REFUND_EXECUTIVE_SUMMARY.md
✓ REFUND_IMPLEMENTATION_COMPLETE.md
✓ REFUND_LOGIC_ANALYSIS.md
✓ REFUND_SYSTEM_README.md
```

---

#### C. Database & Architecture (5 files)
**Target:** `/docs/architecture/` or `/docs/technical/`

```
✓ DATABASE_DRIVEN_COMPLETE.md
✓ DATABASE_DRIVEN_FORMS_GUIDE.md
✓ DATABASE_ROLES_AND_OPTIONS.md
✓ CLEANUP_UNUSED_TABLES.md
✓ COMPLETE_CLEANUP_SUMMARY.md
```

---

#### D. Email System Documentation (3 files)
**Target:** `/docs/email-marketing/`

```
✓ DAILY_EMAIL_SYSTEM_COMPLETE.md
✓ PLUNK_EMAIL_SETUP.md
✓ REFERRER_EMAIL_NOTIFICATIONS.md
```

---

#### E. Enhancement & Image Features (4 files)
**Target:** `/docs/features/enhancements/`

```
✓ ENHANCEMENT_METADATA_COMPATIBILITY_FIX.md
✓ ENHANCEMENT_SOURCE_IMAGE_FIX.md
✓ IMAGE_METADATA_EDITING_COMPLETE.md
✓ IMAGE_METADATA_EDITING_IMPLEMENTATION.md
```

---

#### F. Homepage & UI Fixes (4 files)
**Target:** `/docs/fixes-and-bugs/`

```
✓ HOMEPAGE_BUGS_FIXED.md
✓ HOMEPAGE_BUG_ANALYSIS.md
✓ HOMEPAGE_IMAGE_OPTIMIZATION_FIX.md
✓ HOMEPAGE_REFACTOR_COMPLETE.md
```

---

#### G. Gig System Documentation (2 files)
**Target:** `/docs/features/gigs/`

```
✓ GIG_CREATION_FLOW_TEST_RESULTS.md
✓ GIG_LOCATION_FIELDS_UPDATE.md
```

---

#### H. Invitation System (2 files)
**Target:** `/docs/features/invitations/`

```
✓ INVITE_SYSTEM_IMPLEMENTATION.md
✓ INVITE_SYSTEM_QUICKSTART.md
```

---

#### I. Moodboard System (6 files)
**Target:** `/docs/features/moodboards/`

```
✓ MOODBOARDS_SCHEMA_ANALYSIS.md
✓ MOODBOARD_ERROR_FIX.md
✓ MOODBOARD_IMPLEMENTATION_COMPLETE.md
✓ MOODBOARD_MIGRATION_SOLUTION.md
✓ MOODBOARD_SOURCE_IMAGE_TRACKING.md
✓ MOODBOARD_SYSTEM_ANALYSIS.md
```

---

#### J. Platform & Storage (2 files)
**Target:** `/docs/technical/`

```
✓ PLATFORM_IMAGES_FOLDER_STRUCTURE.md
✓ MISSING_MIGRATIONS_FIX.md
```

---

#### K. Preset & Design System (2 files)
**Target:** `/docs/features/presets/`

```
✓ PRESET_DESIGN_SYSTEM.md
✓ PUBLIC_TOGGLE_SHADCN_IMPROVEMENTS.md
```

---

#### L. Master Plans & Summaries (3 files)
**Target:** `/docs/session-summaries/` or `/docs/archive/`

```
✓ REFACTORING_MASTER_PLAN.md
✓ IMPLEMENTATION_SUMMARY.md
✓ FIXES_APPLIED.md
```

---

#### M. Treatment System (1 file)
**Target:** `/docs/features/treatments/`

```
✓ TREATMENT_ANALYTICS_COMPARISON.md
```

---

#### N. UI Improvements (1 file)
**Target:** `/docs/features/ui/`

```
✓ TEMPLATE_NAME_DESIGN_IMPROVEMENTS.md
```

---

#### O. Recently Created (Keep in Root Temporarily)
```
⏸ CONSOLE_LOGS_AUDIT.md (Just created, keep for now)
```

---

## 2. SQL Files (216 files)

### Current State
216 SQL files are in the root directory, many are:
- Migration scripts
- Quick fixes
- Test queries
- Diagnostic queries
- Cleanup scripts

### Proposed Organization

#### A. Migration Scripts
**Target:** `/migrations/manual/` or `/supabase/migrations/manual/`

**Patterns to move:**
- `add_*.sql` - Adding new features
- `create_*.sql` - Creating tables/functions
- `setup_*.sql` - Setting up systems
- `enable_*.sql` - Enabling features

**Examples:**
```sql
add_admin_verification_policy.sql
add_anti_spam_protections.sql
add_collaboration_privacy_column.sql
add_contact_sharing_system.sql
create_director_styles.sql
create_messaging_tables.sql
create_notification_preferences_table.sql
setup_marketplace_reviews.sql
enable_realtime_tables.sql
```

**Estimated:** ~80 files

---

#### B. Fix/Patch Scripts
**Target:** `/sql-backups/fixes/` or `/migrations/patches/`

**Patterns:**
- `fix_*.sql` - Bug fixes
- `cleanup_*.sql` - Data cleanup
- `remove_*.sql` - Removing duplicates/bad data
- `recalculate_*.sql` - Recalculating data

**Examples:**
```sql
fix_admin_user.sql
fix_auth_users_constraints.sql
fix_credit_allocation.sql
fix_gig_invitation_rls_policy.sql
fix_messages_data.sql
fix_oauth_*.sql
fix_rls_*.sql
fix_storage_*.sql
cleanup_duplicate_offers.sql
remove_non_rental_equipment.sql
```

**Estimated:** ~90 files

---

#### C. Diagnostic/Test Queries
**Target:** `/sql-backups/diagnostics/` or **DELETE** (if outdated)

**Patterns:**
- `check_*.sql` - Checking state
- `test_*.sql` - Testing features
- `debug_*.sql` - Debugging
- `diagnose_*.sql` - Diagnosing issues

**Examples:**
```sql
check_all_messages_constraints.sql
check_available_users.sql
check_gig_invitations_schema.sql
check_notifications_schema.sql
check_profile_columns.sql
check_rls_policies.sql
test_auto_application.sql
test_gig_invitation_db.sql
test_manual_user_creation.sql
debug_oauth_flow.sql
diagnose_oauth_flow.sql
```

**Estimated:** ~40 files

---

#### D. Temporary/Working Files
**Target:** **DELETE** or `/sql-backups/archive/`

**Patterns:**
- `temp_*.sql`
- `quick_*.sql`
- Files with very specific user/data references
- Old backup dumps

**Examples:**
```sql
temp_migration.sql
quick_fix_*.sql
quick_messaging_fix.sql
remote_data.sql
remote_dump.sql
messages_rows.sql
offers_rows.sql
```

**Estimated:** ~6 files

---

### SQL Organization Summary

```
/migrations/
  /manual/          # ~80 migration scripts
  /patches/         # ~90 fix scripts

/sql-backups/
  /diagnostics/     # ~40 diagnostic queries
  /archive/         # Old/temp files to review
  
DELETE: Temporary/obsolete files (~6 files)
```

---

## 3. Python Scripts (19 files)

### Current State
All Python scripts are Plunk/email campaign related, scattered in root.

### Proposed Organization

**Target:** `/scripts/email/` or `/scripts/plunk/`

#### A. Campaign Creation Scripts (5 files)
```python
create_test_campaigns.py
test_create_plunk_campaigns.py
regenerate_all_campaigns_gdpr_compliant.py
send_gdpr_compliant_campaigns.py
test_complete_email_system.py
```

#### B. Campaign Sending Scripts (6 files)
```python
send_campaign.py
send_all_role_campaigns_to_plunk.py
send_complete_campaign_set_to_plunk.py
send_feature_campaigns_to_plunk.py
send_missing_campaigns_to_plunk.py
send_specialized_campaigns_to_plunk.py
```

#### C. Data Import Scripts (6 files)
```python
plunk_bulk_api_import.py
plunk_bulk_import.py
plunk_import_db_simple.py
plunk_import_from_api.py
plunk_import_from_db.py
plunk_import_with_env.py
```

#### D. Testing Scripts (2 files)
```python
test_plunk_import.py
verify_email_preferences_fix.py
```

### Organized Structure

```
/scripts/
  /email/
    /campaigns/
      - create_test_campaigns.py
      - regenerate_all_campaigns_gdpr_compliant.py
      - send_campaign.py
      - send_all_role_campaigns_to_plunk.py
      - send_complete_campaign_set_to_plunk.py
      - send_feature_campaigns_to_plunk.py
      - send_gdpr_compliant_campaigns.py
      - send_missing_campaigns_to_plunk.py
      - send_specialized_campaigns_to_plunk.py
      
    /import/
      - plunk_bulk_api_import.py
      - plunk_bulk_import.py
      - plunk_import_db_simple.py
      - plunk_import_from_api.py
      - plunk_import_from_db.py
      - plunk_import_with_env.py
      
    /testing/
      - test_complete_email_system.py
      - test_create_plunk_campaigns.py
      - test_plunk_import.py
      - verify_email_preferences_fix.py
```

---

## 4. Shell Scripts (10 files)

### Current State
Shell scripts for various dev/deployment tasks in root.

### Proposed Organization

**Target:** `/scripts/dev/` or `/scripts/deployment/`

#### A. Environment Setup (3 files)
```bash
add-env-vars.sh
check-env.sh
remove-secrets.sh
```
**Target:** `/scripts/dev/env/`

#### B. Deployment Scripts (1 file)
```bash
build-deploy.sh
```
**Target:** `/scripts/deployment/`

#### C. Development Tools (4 files)
```bash
monitor.sh
restart-dev-server.sh
switch-to-local.sh
switch-to-server.sh
```
**Target:** `/scripts/dev/`

#### D. Migration Scripts (2 files)
```bash
fix_supabase_imports.sh
run_moodboard_migration.sh
```
**Target:** `/scripts/migrations/`

### Organized Structure

```
/scripts/
  /dev/
    /env/
      - add-env-vars.sh
      - check-env.sh
      - remove-secrets.sh
    - monitor.sh
    - restart-dev-server.sh
    - switch-to-local.sh
    - switch-to-server.sh
    
  /deployment/
    - build-deploy.sh
    
  /migrations/
    - fix_supabase_imports.sh
    - run_moodboard_migration.sh
```

---

## 5. JavaScript Scripts (5 files)

### Current State
JavaScript files for admin/auth tasks in root.

### Proposed Organization

**Target:** `/scripts/admin/`

```javascript
apply_oauth_fix.js
create-admin-user.js
fix-admin-auth.js
fix-storage-policies.js
reset-admin-password.js
```

### Organized Structure

```
/scripts/
  /admin/
    - apply_oauth_fix.js
    - create-admin-user.js
    - fix-admin-auth.js
    - fix-storage-policies.js
    - reset-admin-password.js
```

---

## 6. TypeScript Files (1 file)

### Current State
```typescript
NEW_ADMIN_CREDIT_STATS_API.ts
```

This appears to be a WIP/draft API route that should be integrated into the app.

### Recommendation

**Option 1 (Preferred):** Integrate into app
```
/apps/web/app/api/admin/credit-stats/route.ts
```

**Option 2:** Move to documentation
```
/docs/features/credits/api-draft.ts
```

**Option 3:** Move to examples
```
/examples/admin-apis/credit-stats.ts
```

---

## 7. Other Files to Review

### HTML Files (2 files)
```html
clear-auth-cache.html
clear-cache.html
```

**Recommendation:** Move to `/tools/` or `/scripts/browser-tools/`

### JSON Files (keep in root or organize)
```json
deno.json          # Keep in root (Deno config)
stagewise.json     # Keep in root (if used)
mcp-config.json    # Keep in root (MCP config)
package.json       # Keep in root (required)
package-lock.json  # Keep in root (required)
marketplace-*.json # Archive or delete (test results)
```

### CSV Files
```csv
sample_contacts.csv
```
**Recommendation:** Move to `/scripts/email/data/` or delete if obsolete

### Image/Media Files
```
brand-avatar.svg           # Keep in root or move to /public/
james-murphy-profile-updated.png  # Delete (temp test file)
```

### Log Files (DELETE)
```
dev-debug.log
dev-output.log
dev.log
```
**Action:** Delete and add to `.gitignore`

### Archive Files
```
supabase.tar.gz
```
**Action:** Delete (use git history for backups)

---

## Implementation Plan

### Phase 1: Quick Cleanup (Day 1)
**Priority:** 🔴 Critical

1. **Delete temporary/obsolete files**
   ```bash
   rm dev-debug.log dev-output.log dev.log
   rm james-murphy-profile-updated.png
   rm supabase.tar.gz
   rm marketplace-*.json
   ```

2. **Add to .gitignore**
   ```
   *.log
   *.tar.gz
   *-test-results.json
   temp_*.sql
   ```

**Time:** 30 minutes  
**Files removed:** ~10

---

### Phase 2: Organize Documentation (Day 1-2)
**Priority:** 🟡 High

1. **Create new docs subdirectories**
   ```bash
   mkdir -p docs/features/{credits,enhancements,gigs,invitations,moodboards,presets,treatments,ui}
   ```

2. **Move Markdown files** (49 files)
   - Use the mappings in Section 1
   - Update any internal links
   - Test documentation accessibility

**Time:** 2-3 hours  
**Files moved:** 49

---

### Phase 3: Organize Scripts (Day 2-3)
**Priority:** 🟡 High

1. **Create script subdirectories**
   ```bash
   mkdir -p scripts/{email/{campaigns,import,testing},dev/env,deployment,migrations,admin,browser-tools}
   ```

2. **Move Python scripts** (19 files)
3. **Move Shell scripts** (10 files)
4. **Move JavaScript scripts** (5 files)
5. **Move HTML tools** (2 files)
6. **Update any path references** in code

**Time:** 2-3 hours  
**Files moved:** 36

---

### Phase 4: Organize SQL Files (Day 3-5)
**Priority:** 🟠 Medium (Most complex)

1. **Review and categorize** all 216 SQL files
   - Migration scripts → `/migrations/manual/`
   - Fix scripts → `/migrations/patches/`
   - Diagnostic queries → `/sql-backups/diagnostics/`
   - Obsolete files → Delete or archive

2. **Create directory structure**
   ```bash
   mkdir -p migrations/{manual,patches}
   mkdir -p sql-backups/{diagnostics,archive}
   ```

3. **Move files systematically**
   - Start with clear categories (add_*, create_*)
   - Then fixes (fix_*)
   - Then diagnostics (check_*, test_*)
   - Finally review remaining files

4. **Document migration**
   - Create `/migrations/README.md`
   - List what each migration does
   - Note dependencies

**Time:** 4-6 hours  
**Files moved/deleted:** 216

---

### Phase 5: Integration & Testing (Day 5)
**Priority:** 🟢 Low

1. **Integrate TypeScript file**
   - Review `NEW_ADMIN_CREDIT_STATS_API.ts`
   - Either integrate or move to docs

2. **Update README files**
   - Root README
   - Scripts README
   - Migrations README
   - Docs README

3. **Test build & deployment**
   - Ensure no broken imports
   - Verify scripts still work with new paths
   - Test documentation links

**Time:** 2-3 hours

---

## Automated Cleanup Script

### Bash Script: `cleanup-root.sh`

```bash
#!/bin/bash

# Root Folder Cleanup Script
# Generated: October 13, 2025

set -e

echo "🧹 Starting root folder cleanup..."

# Phase 1: Delete temporary files
echo "Phase 1: Deleting temporary files..."
rm -f dev-debug.log dev-output.log dev.log
rm -f james-murphy-profile-updated.png
rm -f supabase.tar.gz
rm -f marketplace-*.json
rm -f temp_*.sql
echo "✅ Temporary files deleted"

# Phase 2: Create directory structure
echo "Phase 2: Creating directory structure..."
mkdir -p docs/features/{credits,enhancements,gigs,invitations,moodboards,presets,treatments,ui}
mkdir -p scripts/{email/{campaigns,import,testing},dev/env,deployment,migrations,admin,browser-tools}
mkdir -p migrations/{manual,patches}
mkdir -p sql-backups/{diagnostics,archive}
echo "✅ Directories created"

# Phase 3: Move Markdown files
echo "Phase 3: Moving documentation files..."

# Admin & Dashboard
mv ADMIN_DASHBOARD_UPDATE_COMPLETE.md docs/admin/
mv ADMIN_DASHBOARD_UPDATE_GUIDE.md docs/admin/
mv API_FAILURE_ALERTS_SETUP.md docs/features/
mv DAILY_ADMIN_SUMMARY_SETUP.md docs/features/

# Credit System
mv CREDITS_ATTRIBUTION_SYSTEM.md docs/features/credits/
mv CREDIT_FLOW_DIAGRAM.md docs/features/credits/
mv CREDIT_SYSTEM_BUG_FIXES.md docs/features/credits/
mv CREDIT_SYSTEM_FIXES_IMPLEMENTED.md docs/features/credits/
mv PLATFORM_CREDITS_STATUS.md docs/features/credits/
mv REFUND_EXECUTIVE_SUMMARY.md docs/features/credits/
mv REFUND_IMPLEMENTATION_COMPLETE.md docs/features/credits/
mv REFUND_LOGIC_ANALYSIS.md docs/features/credits/
mv REFUND_SYSTEM_README.md docs/features/credits/

# Database & Architecture
mv DATABASE_DRIVEN_COMPLETE.md docs/technical/
mv DATABASE_DRIVEN_FORMS_GUIDE.md docs/technical/
mv DATABASE_ROLES_AND_OPTIONS.md docs/technical/
mv CLEANUP_UNUSED_TABLES.md docs/technical/
mv COMPLETE_CLEANUP_SUMMARY.md docs/technical/

# Email System
mv DAILY_EMAIL_SYSTEM_COMPLETE.md docs/email-marketing/
mv PLUNK_EMAIL_SETUP.md docs/email-marketing/
mv REFERRER_EMAIL_NOTIFICATIONS.md docs/email-marketing/

# Enhancements
mv ENHANCEMENT_METADATA_COMPATIBILITY_FIX.md docs/features/enhancements/
mv ENHANCEMENT_SOURCE_IMAGE_FIX.md docs/features/enhancements/
mv IMAGE_METADATA_EDITING_COMPLETE.md docs/features/enhancements/
mv IMAGE_METADATA_EDITING_IMPLEMENTATION.md docs/features/enhancements/

# Homepage & Fixes
mv HOMEPAGE_BUGS_FIXED.md docs/fixes-and-bugs/
mv HOMEPAGE_BUG_ANALYSIS.md docs/fixes-and-bugs/
mv HOMEPAGE_IMAGE_OPTIMIZATION_FIX.md docs/fixes-and-bugs/
mv HOMEPAGE_REFACTOR_COMPLETE.md docs/fixes-and-bugs/

# Gigs
mv GIG_CREATION_FLOW_TEST_RESULTS.md docs/features/gigs/
mv GIG_LOCATION_FIELDS_UPDATE.md docs/features/gigs/

# Invitations
mv INVITE_SYSTEM_IMPLEMENTATION.md docs/features/invitations/
mv INVITE_SYSTEM_QUICKSTART.md docs/features/invitations/

# Moodboards
mv MOODBOARDS_SCHEMA_ANALYSIS.md docs/features/moodboards/
mv MOODBOARD_ERROR_FIX.md docs/features/moodboards/
mv MOODBOARD_IMPLEMENTATION_COMPLETE.md docs/features/moodboards/
mv MOODBOARD_MIGRATION_SOLUTION.md docs/features/moodboards/
mv MOODBOARD_SOURCE_IMAGE_TRACKING.md docs/features/moodboards/
mv MOODBOARD_SYSTEM_ANALYSIS.md docs/features/moodboards/

# Platform & Storage
mv PLATFORM_IMAGES_FOLDER_STRUCTURE.md docs/technical/
mv MISSING_MIGRATIONS_FIX.md docs/migrations/

# Presets
mv PRESET_DESIGN_SYSTEM.md docs/features/presets/
mv PUBLIC_TOGGLE_SHADCN_IMPROVEMENTS.md docs/features/presets/

# Master Plans
mv REFACTORING_MASTER_PLAN.md docs/session-summaries/
mv IMPLEMENTATION_SUMMARY.md docs/session-summaries/
mv FIXES_APPLIED.md docs/session-summaries/

# Treatments
mv TREATMENT_ANALYTICS_COMPARISON.md docs/features/treatments/

# UI
mv TEMPLATE_NAME_DESIGN_IMPROVEMENTS.md docs/features/ui/

echo "✅ Documentation files moved"

# Phase 4: Move Python scripts
echo "Phase 4: Moving Python scripts..."
mv create_test_campaigns.py scripts/email/campaigns/
mv regenerate_all_campaigns_gdpr_compliant.py scripts/email/campaigns/
mv send_*.py scripts/email/campaigns/
mv plunk_*.py scripts/email/import/
mv test_complete_email_system.py scripts/email/testing/
mv test_create_plunk_campaigns.py scripts/email/testing/
mv test_plunk_import.py scripts/email/testing/
mv verify_email_preferences_fix.py scripts/email/testing/
echo "✅ Python scripts moved"

# Phase 5: Move Shell scripts
echo "Phase 5: Moving Shell scripts..."
mv add-env-vars.sh scripts/dev/env/
mv check-env.sh scripts/dev/env/
mv remove-secrets.sh scripts/dev/env/
mv build-deploy.sh scripts/deployment/
mv monitor.sh scripts/dev/
mv restart-dev-server.sh scripts/dev/
mv switch-to-local.sh scripts/dev/
mv switch-to-server.sh scripts/dev/
mv fix_supabase_imports.sh scripts/migrations/
mv run_moodboard_migration.sh scripts/migrations/
echo "✅ Shell scripts moved"

# Phase 6: Move JavaScript scripts
echo "Phase 6: Moving JavaScript scripts..."
mv apply_oauth_fix.js scripts/admin/
mv create-admin-user.js scripts/admin/
mv fix-admin-auth.js scripts/admin/
mv fix-storage-policies.js scripts/admin/
mv reset-admin-password.js scripts/admin/
echo "✅ JavaScript scripts moved"

# Phase 7: Move HTML tools
echo "Phase 7: Moving browser tools..."
mv clear-auth-cache.html scripts/browser-tools/
mv clear-cache.html scripts/browser-tools/
echo "✅ Browser tools moved"

# Phase 8: Update .gitignore
echo "Phase 8: Updating .gitignore..."
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

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Review moved files to ensure correctness"
echo "2. Update any broken internal links in documentation"
echo "3. Test scripts with new paths"
echo "4. Commit changes to git"
echo ""
echo "Files organized:"
echo "  - 49 Markdown files → /docs/"
echo "  - 19 Python scripts → /scripts/email/"
echo "  - 10 Shell scripts → /scripts/dev/, /scripts/deployment/"
echo "  - 5 JavaScript files → /scripts/admin/"
echo "  - 2 HTML files → /scripts/browser-tools/"
echo ""
echo "Note: SQL files (216) need manual review and organization."
echo "Run 'bash organize-sql-files.sh' when ready."
```

---

## SQL Files Organization Script

### Bash Script: `organize-sql-files.sh`

```bash
#!/bin/bash

# SQL Files Organization Script
# This requires manual review, so use with caution

set -e

echo "🗄️ Organizing SQL files..."
echo "⚠️  This script will categorize 216 SQL files"
echo ""

# Create directories
mkdir -p migrations/manual
mkdir -p migrations/patches  
mkdir -p sql-backups/diagnostics
mkdir -p sql-backups/archive

# Function to move file if it exists
move_if_exists() {
  if [ -f "$1" ]; then
    mv "$1" "$2"
    echo "  ✓ Moved: $1"
  fi
}

# Migration scripts (add_*, create_*, setup_*, enable_*)
echo "Moving migration scripts..."
for file in add_*.sql create_*.sql setup_*.sql enable_*.sql; do
  if [ -f "$file" ]; then
    move_if_exists "$file" "migrations/manual/"
  fi
done

# Fix/patch scripts (fix_*, cleanup_*, remove_*, recalculate_*)
echo "Moving fix/patch scripts..."
for file in fix_*.sql cleanup_*.sql remove_*.sql recalculate_*.sql; do
  if [ -f "$file" ]; then
    move_if_exists "$file" "migrations/patches/"
  fi
done

# Diagnostic scripts (check_*, test_*, debug_*, diagnose_*)
echo "Moving diagnostic scripts..."
for file in check_*.sql test_*.sql debug_*.sql diagnose_*.sql; do
  if [ -f "$file" ]; then
    move_if_exists "$file" "sql-backups/diagnostics/"
  fi
done

# Temporary/working files (temp_*, quick_*, *_rows.sql, remote_*.sql)
echo "Moving temporary files..."
for file in temp_*.sql quick_*.sql *_rows.sql remote_*.sql; do
  if [ -f "$file" ]; then
    move_if_exists "$file" "sql-backups/archive/"
  fi
done

# List any remaining SQL files
remaining=$(find . -maxdepth 1 -name "*.sql" -type f | wc -l)
if [ "$remaining" -gt 0 ]; then
  echo ""
  echo "⚠️  $remaining SQL files remain in root:"
  find . -maxdepth 1 -name "*.sql" -type f
  echo ""
  echo "Please review and categorize these manually."
fi

echo ""
echo "✅ SQL organization complete!"
echo ""
echo "Summary:"
echo "  - Migration scripts → migrations/manual/"
echo "  - Fix/patch scripts → migrations/patches/"
echo "  - Diagnostic queries → sql-backups/diagnostics/"
echo "  - Archive/temp files → sql-backups/archive/"
```

---

## Expected Results

### Before Cleanup
```
/preset/
  ├── 49 Markdown files
  ├── 216 SQL files
  ├── 19 Python scripts
  ├── 10 Shell scripts
  ├── 5 JavaScript files
  ├── 1 TypeScript file
  ├── Various other files
  └── Apps, packages, docs (organized)
```

### After Cleanup
```
/preset/
  ├── Essential root files only:
  │   ├── package.json
  │   ├── package-lock.json
  │   ├── README.md
  │   ├── LICENSE
  │   ├── .gitignore
  │   ├── deno.json
  │   ├── mcp-config.json
  │   └── stagewise.json
  │
  ├── /docs/  (Well organized)
  │   ├── /admin/
  │   ├── /features/
  │   │   ├── /credits/ (9 files)
  │   │   ├── /enhancements/ (4 files)
  │   │   ├── /gigs/ (2 files)
  │   │   ├── /invitations/ (2 files)
  │   │   ├── /moodboards/ (6 files)
  │   │   ├── /presets/ (2 files)
  │   │   ├── /treatments/ (1 file)
  │   │   └── /ui/ (1 file)
  │   ├── /technical/ (5 files)
  │   ├── /email-marketing/ (3+ files)
  │   └── /session-summaries/ (3 files)
  │
  ├── /scripts/  (Organized by purpose)
  │   ├── /email/
  │   │   ├── /campaigns/ (9 files)
  │   │   ├── /import/ (6 files)
  │   │   └── /testing/ (4 files)
  │   ├── /dev/
  │   │   ├── /env/ (3 files)
  │   │   └── (4 files)
  │   ├── /deployment/ (1 file)
  │   ├── /migrations/ (2 files)
  │   ├── /admin/ (5 files)
  │   └── /browser-tools/ (2 files)
  │
  ├── /migrations/  (SQL migrations)
  │   ├── /manual/ (~80 files)
  │   └── /patches/ (~90 files)
  │
  └── /sql-backups/  (Reference queries)
      ├── /diagnostics/ (~40 files)
      └── /archive/ (~6 files)
```

---

## Benefits

### 1. Improved Navigation
- Clear folder structure
- Easy to find documentation
- Logical grouping of scripts

### 2. Better Maintainability
- Easier to update documentation
- Scripts grouped by purpose
- Clear separation of concerns

### 3. Cleaner Root Directory
- Only essential config files
- Professional project structure
- Better first impression for contributors

### 4. Reduced Confusion
- No mixing of SQL fixes and migrations
- Clear distinction between dev and production scripts
- Documentation organized by feature

### 5. Version Control Benefits
- Smaller diffs
- Easier to review changes
- Better commit history

---

## Risks & Mitigation

### Risk 1: Broken Internal Links
**Impact:** Medium  
**Mitigation:** 
- Use find/replace to update links
- Test all documentation after moving
- Create redirect mapping document

### Risk 2: Script Path Dependencies
**Impact:** High  
**Mitigation:**
- Review all scripts for hardcoded paths
- Update import statements
- Test scripts after moving
- Use absolute paths where possible

### Risk 3: Accidental Deletion
**Impact:** Critical  
**Mitigation:**
- Commit current state before cleanup
- Review files before deleting
- Keep backups of .tar.gz before removing
- Use `git mv` instead of `rm` where possible

### Risk 4: Lost Documentation
**Impact:** Medium  
**Mitigation:**
- Document all moves in this plan
- Create INDEX.md files in each folder
- Update root README with new structure

---

## Post-Cleanup Tasks

### 1. Update Root README
Add section explaining new structure:
```markdown
## Project Structure

- `/apps/` - Application code
- `/docs/` - All documentation
  - `/features/` - Feature-specific docs
  - `/technical/` - Technical guides
  - `/admin/` - Admin documentation
- `/scripts/` - Utility scripts
  - `/email/` - Email/campaign scripts
  - `/dev/` - Development tools
  - `/admin/` - Admin utilities
- `/migrations/` - Database migrations
- `/sql-backups/` - SQL reference files
```

### 2. Create INDEX Files
Create `INDEX.md` in each major folder:
- `/docs/INDEX.md`
- `/docs/features/INDEX.md`
- `/scripts/INDEX.md`
- `/migrations/INDEX.md`

### 3. Update Package.json Scripts
Update any npm scripts that reference moved files:
```json
{
  "scripts": {
    "migrate": "bash scripts/migrations/run_moodboard_migration.sh",
    "dev:monitor": "bash scripts/dev/monitor.sh",
    "admin:create": "node scripts/admin/create-admin-user.js"
  }
}
```

### 4. Git Commit Strategy
```bash
# Commit in logical chunks
git add docs/features/credits/
git commit -m "docs: organize credit system documentation"

git add docs/features/moodboards/
git commit -m "docs: organize moodboard documentation"

git add scripts/email/
git commit -m "scripts: organize email/campaign scripts"

# And so on...
```

---

## Timeline

| Phase | Duration | Files Affected | Priority |
|-------|----------|----------------|----------|
| Phase 1: Quick Cleanup | 30 min | ~10 files | 🔴 Critical |
| Phase 2: Organize Docs | 2-3 hours | 49 files | 🟡 High |
| Phase 3: Organize Scripts | 2-3 hours | 36 files | 🟡 High |
| Phase 4: Organize SQL | 4-6 hours | 216 files | 🟠 Medium |
| Phase 5: Integration | 2-3 hours | All | 🟢 Low |
| **TOTAL** | **1-2 days** | **~311 files** | - |

---

## Conclusion

This cleanup will:
- ✅ Organize **299+ files** into logical directories
- ✅ Remove **~15 temporary/obsolete files**
- ✅ Create clear structure for **scripts**, **docs**, and **SQL files**
- ✅ Improve project maintainability and navigation
- ✅ Establish better practices for future development

### Immediate Actions:
1. Review this plan
2. Backup current state (git commit)
3. Run Phase 1 cleanup script
4. Systematically execute remaining phases
5. Test and verify all changes
6. Update documentation

**End of Report**

