#!/bin/bash

# Fix all Supabase imports to use the consistent SSR client
# This prevents session conflicts across the application

echo "Fixing Supabase imports across the application..."

# Find all TypeScript/TSX files importing from '../lib/supabase' or similar
find apps/web -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "from ['\"].*lib/supabase['\"]" {} \; | while read -r file; do
  echo "Processing: $file"

  # Replace the import statement
  # Pattern 1: import { supabase } from '../lib/supabase'
  # Pattern 2: import { supabase } from '../../lib/supabase'
  # Pattern 3: import { supabase } from '@/lib/supabase'

  # Create backup
  cp "$file" "$file.bak"

  # Replace import and add const declaration
  sed -i '' \
    -e "s|import { supabase } from ['\"].*lib/supabase['\"]|import { createClient } from './supabase/client'\n\nconst supabase = createClient()|g" \
    "$file"

  # Fix path depth for createClient import based on file location
  # Count ../ in the file path to determine correct relative path
  depth=$(echo "$file" | grep -o "/" | wc -l)

  # Adjust the import path based on depth
  if [ $depth -eq 3 ]; then
    # apps/web/app/*.tsx
    sed -i '' "s|from './supabase/client'|from '../lib/supabase/client'|g" "$file"
  elif [ $depth -eq 4 ]; then
    # apps/web/app/*/*.tsx or apps/web/lib/*.tsx or apps/web/components/*.tsx
    sed -i '' "s|from './supabase/client'|from '../../lib/supabase/client'|g" "$file"
  elif [ $depth -eq 5 ]; then
    # apps/web/app/*/*/*.tsx or apps/web/components/*/*.tsx
    sed -i '' "s|from './supabase/client'|from '../../../lib/supabase/client'|g" "$file"
  elif [ $depth -eq 6 ]; then
    # apps/web/app/*/*/*/*.tsx or apps/web/components/*/*/*.tsx
    sed -i '' "s|from './supabase/client'|from '../../../../lib/supabase/client'|g" "$file"
  elif [ $depth -eq 7 ]; then
    # apps/web/components/*/*/*/*.tsx
    sed -i '' "s|from './supabase/client'|from '../../../../../lib/supabase/client'|g" "$file"
  fi

  echo "✓ Fixed: $file"
done

echo ""
echo "Done! All files have been updated to use the SSR client."
echo "Backup files created with .bak extension"
echo ""
echo "To revert changes, run: find apps/web -name '*.bak' -exec bash -c 'mv \"\$0\" \"\${0%.bak}\"' {} \;"
