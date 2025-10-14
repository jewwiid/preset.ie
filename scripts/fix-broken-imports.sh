#!/bin/bash

# Fix broken LoadingSpinner imports caused by migration script
# Pattern: import { \nimport { LoadingSpinner...

cd apps/web

echo "🔧 Fixing broken import statements..."

# Find and fix files where LoadingSpinner import was inserted inside another import
find . -name "*.tsx" -type f | while read file; do
  if grep -q "^import { $" "$file" 2>/dev/null; then
    if grep -A1 "^import { $" "$file" | grep -q "LoadingSpinner"; then
      echo "  Fixing: $file"
      # Use perl for multi-line replacement
      perl -0777 -pi -e 's/import \{ \nimport \{ LoadingSpinner \} from .@\/components\/ui\/loading-spinner.;\nimport { LoadingSpinner } from '\''@\/components\/ui\/loading-spinner'\'';\nimport {/g' "$file"
    fi
  fi
done

echo "✅ Done!"
