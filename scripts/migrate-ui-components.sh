#!/bin/bash

# UI Component Consolidation - Automated Migration Script
# This script automatically migrates custom UI patterns to consolidated components

set -e

APPS_WEB_DIR="apps/web"
DRY_RUN=false
BACKUP=true

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --no-backup)
      BACKUP=false
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo "🚀 UI Component Migration Script"
echo "=================================="
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Running in DRY RUN mode - no files will be modified${NC}"
  echo ""
fi

cd "$APPS_WEB_DIR"

# Find all TSX files with spinner patterns
echo "📊 Scanning for migration candidates..."
SPINNER_FILES=$(grep -rl "animate-spin.*rounded-full.*border" --include="*.tsx" . | grep -v "node_modules" | grep -v ".backup" | grep -v ".bak" | wc -l | tr -d ' ')
echo "   Found $SPINNER_FILES files with custom spinners"

# Count total patterns
TOTAL_SPINNERS=$(grep -r "animate-spin.*rounded-full.*border" --include="*.tsx" . | grep -v "node_modules" | grep -v ".backup" | grep -v ".bak" | wc -l | tr -d ' ')
echo "   Found $TOTAL_SPINNERS total spinner instances"
echo ""

if [ "$DRY_RUN" = false ]; then
  read -p "Continue with migration? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
  fi
fi

echo ""
echo "🔄 Starting migration..."
echo ""

MIGRATED_FILES=0
MIGRATED_PATTERNS=0

# Function to migrate a file
migrate_file() {
  local file=$1
  local temp_file="${file}.tmp"

  # Skip if already has LoadingSpinner import
  if grep -q "from '@/components/ui/loading-spinner'" "$file" 2>/dev/null || \
     grep -q "from '.*loading-spinner'" "$file" 2>/dev/null; then
    return 0
  fi

  # Check if file has patterns to migrate
  if ! grep -q "animate-spin" "$file" 2>/dev/null; then
    return 0
  fi

  if [ "$BACKUP" = true ] && [ "$DRY_RUN" = false ]; then
    cp "$file" "${file}.migration-backup"
  fi

  if [ "$DRY_RUN" = false ]; then
    # Add LoadingSpinner import after other ui imports
    if grep -q "from '@/components/ui/" "$file"; then
      # Add after last ui import
      awk '/from .@\/components\/ui\// { last = NR }
           { lines[NR] = $0 }
           END {
             for (i = 1; i <= NR; i++) {
               print lines[i]
               if (i == last && !seen) {
                 print "import { LoadingSpinner } from '\''@/components/ui/loading-spinner'\''"
                 seen = 1
               }
             }
           }' "$file" > "$temp_file"
      mv "$temp_file" "$file"
    fi

    # Replace common spinner patterns
    sed -i.bak \
      -e 's/<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[^"]*"><\/div>/<LoadingSpinner size="sm" \/>/g' \
      -e 's/<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[^"]*"><\/div>/<LoadingSpinner size="md" \/>/g' \
      -e 's/<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[^"]*"><\/div>/<LoadingSpinner size="lg" \/>/g' \
      -e 's/<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[^"]*"><\/div>/<LoadingSpinner size="xl" \/>/g' \
      "$file"
    rm "${file}.bak" 2>/dev/null || true

    MIGRATED_FILES=$((MIGRATED_FILES + 1))
    echo -e "   ${GREEN}✓${NC} Migrated: $file"
  else
    echo -e "   ${YELLOW}→${NC} Would migrate: $file"
  fi
}

# Migrate high-priority directories first
PRIORITY_DIRS=(
  "components/playground"
  "components/dashboard"
  "components/marketplace"
  "components/gigs"
  "components/profile"
  "app/components"
  "app/auth"
  "app/dashboard"
)

for dir in "${PRIORITY_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "📁 Processing: $dir"
    while IFS= read -r file; do
      migrate_file "$file"
    done < <(grep -rl "animate-spin" "$dir" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".backup" | grep -v ".bak" || true)
  fi
done

echo ""
echo "=================================="
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo ""
echo "📊 Statistics:"
echo "   Files processed: $MIGRATED_FILES"
echo ""

if [ "$DRY_RUN" = false ]; then
  echo "💾 Backup files saved with .migration-backup extension"
  echo ""
  echo "🔍 Next steps:"
  echo "   1. Run: npm run lint -- --fix"
  echo "   2. Run: npm run build"
  echo "   3. Test the application"
  echo "   4. If issues: restore from .migration-backup files"
  echo ""
  echo "🗑️  To clean up backups after verification:"
  echo "   find . -name '*.migration-backup' -delete"
else
  echo "To run the actual migration, remove --dry-run flag"
fi

echo ""
