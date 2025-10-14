#!/usr/bin/env node

/**
 * UI Component Consolidation - Automated Migration Tool
 * Fast batch migration of custom UI patterns to consolidated components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const APPS_WEB_DIR = path.join(ROOT_DIR, 'apps', 'web');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const NO_BACKUP = process.argv.includes('--no-backup');

// Statistics
let stats = {
  filesScanned: 0,
  filesModified: 0,
  spinnersReplaced: 0,
  loader2Replaced: 0,
  importsAdded: 0,
};

// Colors
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

console.log(`🚀 UI Component Migration Tool`);
console.log(`${'='.repeat(50)}\n`);

if (DRY_RUN) {
  console.log(`${colors.yellow}⚠️  DRY RUN MODE - No files will be modified${colors.reset}\n`);
}

/**
 * Find all TSX files recursively
 */
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, backups
      if (!file.match(/node_modules|\.next|\.backup|\.bak|\.tmp/)) {
        findTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') && !file.includes('.backup') && !file.includes('.bak')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Check if file needs LoadingSpinner import
 */
function needsLoadingSpinnerImport(content) {
  const hasSpinnerPattern = /animate-spin|Loader2.*animate-spin/.test(content);
  const hasImport = /from ['"]@\/components\/ui\/loading-spinner['"]/.test(content) ||
                    /from ['"].*\/loading-spinner['"]/.test(content);
  return hasSpinnerPattern && !hasImport;
}

/**
 * Add LoadingSpinner import to file
 */
function addLoadingSpinnerImport(content) {
  // Find the last UI import
  const lines = content.split('\n');
  let lastUiImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("from '@/components/ui/") || lines[i].includes("from '../../components/ui/")) {
      lastUiImportIndex = i;
    }
  }

  if (lastUiImportIndex >= 0) {
    // Insert after last UI import
    lines.splice(lastUiImportIndex + 1, 0, "import { LoadingSpinner } from '@/components/ui/loading-spinner';");
    stats.importsAdded++;
    return lines.join('\n');
  }

  // If no UI imports found, add after first import block
  const firstImportIndex = lines.findIndex(line => line.startsWith('import '));
  if (firstImportIndex >= 0) {
    let lastImportIndex = firstImportIndex;
    for (let i = firstImportIndex; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].trim() === '') {
        lastImportIndex = i;
      } else {
        break;
      }
    }
    lines.splice(lastImportIndex + 1, 0, "import { LoadingSpinner } from '@/components/ui/loading-spinner';");
    stats.importsAdded++;
    return lines.join('\n');
  }

  return content;
}

/**
 * Replace spinner patterns
 */
function replaceSpinners(content) {
  let modified = content;
  let replacements = 0;

  // Pattern 1: Simple div spinner
  const simpleSpinnerPatterns = [
    {
      // h-4 w-4 (sm)
      regex: /<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[^"]*"><\/div>/g,
      replacement: '<LoadingSpinner size="sm" />',
    },
    {
      // h-6 w-6 (md)
      regex: /<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[^"]*"><\/div>/g,
      replacement: '<LoadingSpinner size="md" />',
    },
    {
      // h-8 w-8 (lg)
      regex: /<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[^"]*"><\/div>/g,
      replacement: '<LoadingSpinner size="lg" />',
    },
    {
      // h-12 w-12 (xl)
      regex: /<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[^"]*"><\/div>/g,
      replacement: '<LoadingSpinner size="xl" />',
    },
  ];

  simpleSpinnerPatterns.forEach(({ regex, replacement }) => {
    const matches = modified.match(regex);
    if (matches) {
      replacements += matches.length;
      modified = modified.replace(regex, replacement);
    }
  });

  // Pattern 2: Loader2 from lucide-react
  const loader2Pattern = /<Loader2 className="[^"]*h-(\d+)[^"]*animate-spin[^"]*"\s*\/>/g;
  const loader2Matches = modified.match(loader2Pattern);
  if (loader2Matches) {
    modified = modified.replace(loader2Pattern, (match, height) => {
      const size = height <= 4 ? 'sm' : height <= 6 ? 'md' : height <= 8 ? 'lg' : 'xl';
      replacements++;
      stats.loader2Replaced++;
      return `<LoadingSpinner size="${size}" />`;
    });
  }

  // Remove Loader2 import if no longer used
  if (stats.loader2Replaced > 0 && !modified.includes('Loader2')) {
    modified = modified.replace(/,?\s*Loader2\s*,?/g, ',')
                     .replace(/\{\s*,/g, '{')
                     .replace(/,\s*\}/g, '}')
                     .replace(/\{\s*\}/g, '');
  }

  stats.spinnersReplaced += replacements;
  return modified;
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
  stats.filesScanned++;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let hasChanges = false;

  // Add import if needed
  if (needsLoadingSpinnerImport(content)) {
    modified = addLoadingSpinnerImport(modified);
    hasChanges = true;
  }

  // Replace spinner patterns
  const beforeReplace = modified;
  modified = replaceSpinners(modified);
  if (modified !== beforeReplace) {
    hasChanges = true;
  }

  if (hasChanges) {
    stats.filesModified++;

    if (!DRY_RUN) {
      // Create backup
      if (!NO_BACKUP) {
        fs.writeFileSync(`${filePath}.migration-backup`, content, 'utf8');
      }
      // Write modified content
      fs.writeFileSync(filePath, modified, 'utf8');

      if (VERBOSE) {
        console.log(`${colors.green}✓${colors.reset} ${path.relative(APPS_WEB_DIR, filePath)}`);
      }
    } else {
      console.log(`${colors.yellow}→${colors.reset} Would modify: ${path.relative(APPS_WEB_DIR, filePath)}`);
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log(`📁 Scanning ${APPS_WEB_DIR}...\n`);

  const files = findTsxFiles(APPS_WEB_DIR);
  console.log(`Found ${files.length} TSX files\n`);

  if (!DRY_RUN && !NO_BACKUP) {
    console.log(`💾 Backups will be created with .migration-backup extension\n`);
  }

  console.log(`🔄 Processing files...\n`);

  // Process priority directories first
  const priorityDirs = [
    'components/playground',
    'components/dashboard',
    'components/marketplace',
    'app/components',
    'app/auth',
  ];

  const priorityFiles = [];
  const otherFiles = [];

  files.forEach(file => {
    const relativePath = path.relative(APPS_WEB_DIR, file);
    if (priorityDirs.some(dir => relativePath.startsWith(dir))) {
      priorityFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  });

  // Process priority files first
  priorityFiles.forEach(migrateFile);
  otherFiles.forEach(migrateFile);

  // Print summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${colors.green}✅ Migration Complete!${colors.reset}\n`);
  console.log(`📊 Statistics:`);
  console.log(`   Files scanned: ${stats.filesScanned}`);
  console.log(`   Files modified: ${stats.filesModified}`);
  console.log(`   Spinners replaced: ${stats.spinnersReplaced}`);
  console.log(`   Loader2 replaced: ${stats.loader2Replaced}`);
  console.log(`   Imports added: ${stats.importsAdded}`);
  console.log(``);

  if (!DRY_RUN) {
    console.log(`🔍 Next steps:`);
    console.log(`   1. Review changes: git diff`);
    console.log(`   2. Run linter: npm run lint -- --fix`);
    console.log(`   3. Test build: npm run build`);
    console.log(`   4. If issues, restore: find . -name '*.migration-backup' -exec bash -c 'mv "$0" "\${0%.migration-backup}"' {} \\;`);
    console.log(`   5. Clean backups: find . -name '*.migration-backup' -delete`);
  } else {
    console.log(`${colors.yellow}To run actual migration, remove --dry-run flag${colors.reset}`);
  }
  console.log(``);
}

// Run migration
migrate().catch(console.error);
