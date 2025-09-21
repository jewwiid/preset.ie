#!/usr/bin/env node

/**
 * Hardcoded Color Scanner & Fixer
 * 
 * This script automatically scans the codebase for hardcoded colors
 * and replaces them with theme-aware CSS variables.
 * 
 * Usage:
 *   node scripts/fix-hardcoded-colors.js [options]
 * 
 * Options:
 *   --scan-only    Only scan and report, don't fix
 *   --dry-run      Show what would be changed without making changes
 *   --verbose      Show detailed output
 *   --help         Show this help message
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Directories to scan
  scanDirs: [
    'apps/web/app',
    'apps/web/components',
    'apps/web/lib'
  ],
  
  // File extensions to process
  fileExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  
  // Color mappings (hardcoded -> theme-aware)
  colorMappings: {
    // Green colors
    'green-50': 'primary/10',
    'green-100': 'primary/10',
    'green-200': 'primary/20',
    'green-300': 'primary/30',
    'green-400': 'primary',
    'green-500': 'primary',
    'green-600': 'primary',
    'green-700': 'primary/90',
    'green-800': 'primary',
    'green-900': 'primary',
    
    // Emerald colors
    'emerald-50': 'primary/10',
    'emerald-100': 'primary/10',
    'emerald-200': 'primary/20',
    'emerald-300': 'primary/30',
    'emerald-400': 'primary',
    'emerald-500': 'primary',
    'emerald-600': 'primary',
    'emerald-700': 'primary/90',
    'emerald-800': 'primary',
    'emerald-900': 'primary',
    
    // Lime colors
    'lime-50': 'primary/10',
    'lime-100': 'primary/10',
    'lime-200': 'primary/20',
    'lime-300': 'primary/30',
    'lime-400': 'primary',
    'lime-500': 'primary',
    'lime-600': 'primary',
    'lime-700': 'primary/90',
    'lime-800': 'primary',
    'lime-900': 'primary',
    
    // Pink/Rose colors (fixing pink appearing instead of green)
    'pink-50': 'primary/10',
    'pink-100': 'primary/10',
    'pink-200': 'primary/20',
    'pink-300': 'primary/30',
    'pink-400': 'primary',
    'pink-500': 'primary',
    'pink-600': 'primary',
    'pink-700': 'primary/90',
    'pink-800': 'primary',
    'pink-900': 'primary',
    
    'rose-50': 'primary/10',
    'rose-100': 'primary/10',
    'rose-200': 'primary/20',
    'rose-300': 'primary/30',
    'rose-400': 'primary',
    'rose-500': 'primary',
    'rose-600': 'primary',
    'rose-700': 'primary/90',
    'rose-800': 'primary',
    'rose-900': 'primary',
    
    'fuchsia-50': 'primary/10',
    'fuchsia-100': 'primary/10',
    'fuchsia-200': 'primary/20',
    'fuchsia-300': 'primary/30',
    'fuchsia-400': 'primary',
    'fuchsia-500': 'primary',
    'fuchsia-600': 'primary',
    'fuchsia-700': 'primary/90',
    'fuchsia-800': 'primary',
    'fuchsia-900': 'primary',
    
    // Teal colors
    'teal-50': 'secondary/10',
    'teal-100': 'secondary/10',
    'teal-200': 'secondary/20',
    'teal-300': 'secondary/30',
    'teal-400': 'secondary',
    'teal-500': 'secondary',
    'teal-600': 'secondary',
    'teal-700': 'secondary/90',
    'teal-800': 'secondary',
    'teal-900': 'secondary'
  },
  
  // CSS property mappings
  cssPropertyMappings: {
    'bg-green': 'bg-primary',
    'text-green': 'text-primary',
    'border-green': 'border-primary',
    'bg-emerald': 'bg-primary',
    'text-emerald': 'text-primary',
    'border-emerald': 'border-primary',
    'bg-lime': 'bg-primary',
    'text-lime': 'text-primary',
    'border-lime': 'border-primary',
    'bg-pink': 'bg-primary',
    'text-pink': 'text-primary',
    'border-pink': 'border-primary',
    'bg-rose': 'bg-primary',
    'text-rose': 'text-primary',
    'border-rose': 'border-primary',
    'bg-fuchsia': 'bg-primary',
    'text-fuchsia': 'text-primary',
    'border-fuchsia': 'border-primary',
    'bg-teal': 'bg-secondary',
    'text-teal': 'text-secondary',
    'border-teal': 'border-secondary'
  },
  
  // Special cases that need custom handling
  specialCases: [
    {
      pattern: /text-green-600 dark:text-green-400/g,
      replacement: 'text-primary'
    },
    {
      pattern: /bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200/g,
      replacement: 'bg-primary/10 text-primary'
    },
    {
      pattern: /hover:text-green-500/g,
      replacement: 'hover:text-primary'
    },
    {
      pattern: /hover:text-emerald-500/g,
      replacement: 'hover:text-primary'
    },
    {
      pattern: /hover:text-emerald-600/g,
      replacement: 'hover:text-primary'
    },
    {
      pattern: /hover:text-emerald-700/g,
      replacement: 'hover:text-primary/80'
    },
    {
      pattern: /hover:bg-green-50/g,
      replacement: 'hover:bg-primary/10'
    },
    {
      pattern: /hover:bg-emerald-50/g,
      replacement: 'hover:bg-primary/10'
    },
    {
      pattern: /hover:bg-green-100/g,
      replacement: 'hover:bg-primary/20'
    },
    {
      pattern: /hover:bg-emerald-100/g,
      replacement: 'hover:bg-primary/20'
    },
    {
      pattern: /hover:bg-green-700/g,
      replacement: 'hover:bg-primary/90'
    },
    {
      pattern: /hover:bg-emerald-700/g,
      replacement: 'hover:bg-primary/90'
    },
    {
      pattern: /focus:ring-green-500/g,
      replacement: 'focus:ring-primary'
    },
    {
      pattern: /focus:ring-emerald-500/g,
      replacement: 'focus:ring-primary'
    },
    {
      pattern: /focus:border-green-500/g,
      replacement: 'focus:border-primary'
    },
    {
      pattern: /focus:border-emerald-500/g,
      replacement: 'focus:border-primary'
    },
    {
      pattern: /border-green-200/g,
      replacement: 'border-primary/20'
    },
    {
      pattern: /border-emerald-200/g,
      replacement: 'border-primary/20'
    },
    {
      pattern: /border-green-300/g,
      replacement: 'border-primary/30'
    },
    {
      pattern: /border-emerald-300/g,
      replacement: 'border-primary/30'
    },
    // Pink color special cases
    {
      pattern: /text-pink-600 dark:text-pink-400/g,
      replacement: 'text-primary'
    },
    {
      pattern: /bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200/g,
      replacement: 'bg-primary/10 text-primary'
    },
    {
      pattern: /hover:text-pink-500/g,
      replacement: 'hover:text-primary'
    },
    {
      pattern: /hover:text-pink-600/g,
      replacement: 'hover:text-primary'
    },
    {
      pattern: /hover:text-pink-700/g,
      replacement: 'hover:text-primary/80'
    },
    {
      pattern: /hover:bg-pink-50/g,
      replacement: 'hover:bg-primary/10'
    },
    {
      pattern: /hover:bg-pink-100/g,
      replacement: 'hover:bg-primary/20'
    },
    {
      pattern: /hover:bg-pink-700/g,
      replacement: 'hover:bg-primary/90'
    },
    {
      pattern: /focus:ring-pink-500/g,
      replacement: 'focus:ring-primary'
    },
    {
      pattern: /focus:border-pink-500/g,
      replacement: 'focus:border-primary'
    },
    {
      pattern: /border-pink-200/g,
      replacement: 'border-primary/20'
    },
    {
      pattern: /border-pink-300/g,
      replacement: 'border-primary/30'
    }
  ]
};

// Command line options
const options = {
  scanOnly: process.argv.includes('--scan-only'),
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  help: process.argv.includes('--help')
};

// Show help
if (options.help) {
  console.log(`
Hardcoded Color Scanner & Fixer

Usage: node scripts/fix-hardcoded-colors.js [options]

Options:
  --scan-only    Only scan and report, don't fix
  --dry-run      Show what would be changed without making changes
  --verbose      Show detailed output
  --help         Show this help message

Examples:
  node scripts/fix-hardcoded-colors.js --scan-only
  node scripts/fix-hardcoded-colors.js --dry-run --verbose
  node scripts/fix-hardcoded-colors.js
`);
  process.exit(0);
}

// Statistics
const stats = {
  filesScanned: 0,
  filesModified: 0,
  totalReplacements: 0,
  errors: []
};

// Color patterns to search for
const colorPatterns = [
  // Tailwind color classes
  /\b(green|emerald|lime|teal|pink|rose|fuchsia)-[0-9]{2,3}\b/g,
  // CSS property classes
  /\b(bg|text|border)-(green|emerald|lime|teal|pink|rose|fuchsia)-[0-9]{2,3}\b/g,
  // Special patterns
  /text-(green|emerald|pink|rose|fuchsia)-[0-9]{2,3}\s+dark:text-(green|emerald|pink|rose|fuchsia)-[0-9]{2,3}/g,
  /bg-(green|emerald|pink|rose|fuchsia)-[0-9]{2,3}\s+text-(green|emerald|pink|rose|fuchsia)-[0-9]{2,3}\s+dark:bg-(green|emerald|pink|rose|fuchsia)-[0-9]{2,3}\s+dark:text-(green|emerald|pink|rose|fuchsia)-[0-9]{2,3}/g
];

/**
 * Recursively find all files to process
 */
function findFiles(dir, files = []) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          findFiles(fullPath, files);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (CONFIG.fileExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    stats.errors.push(`Error reading directory ${dir}: ${error.message}`);
  }
  
  return files;
}

/**
 * Check if a file contains hardcoded colors
 */
function hasHardcodedColors(content) {
  return colorPatterns.some(pattern => pattern.test(content));
}

/**
 * Replace hardcoded colors with theme-aware alternatives
 */
function replaceHardcodedColors(content) {
  let newContent = content;
  let replacements = 0;
  
  // Apply special cases first
  for (const specialCase of CONFIG.specialCases) {
    const matches = newContent.match(specialCase.pattern);
    if (matches) {
      newContent = newContent.replace(specialCase.pattern, specialCase.replacement);
      replacements += matches.length;
    }
  }
  
  // Apply CSS property mappings
  for (const [oldProp, newProp] of Object.entries(CONFIG.cssPropertyMappings)) {
    const pattern = new RegExp(`\\b${oldProp}-[0-9]{2,3}\\b`, 'g');
    const matches = newContent.match(pattern);
    if (matches) {
      newContent = newContent.replace(pattern, (match) => {
        const colorValue = match.replace(`${oldProp}-`, '');
        const mappedValue = CONFIG.colorMappings[colorValue] || colorValue;
        return `${newProp}${mappedValue !== colorValue ? `-${mappedValue}` : `-${colorValue}`}`;
      });
      replacements += matches.length;
    }
  }
  
  // Apply color mappings for standalone color classes
  for (const [oldColor, newColor] of Object.entries(CONFIG.colorMappings)) {
    const pattern = new RegExp(`\\b(green|emerald|lime|teal)-${oldColor.replace(/^(green|emerald|lime|teal)-/, '')}\\b`, 'g');
    const matches = newContent.match(pattern);
    if (matches) {
      newContent = newContent.replace(pattern, (match) => {
        const colorType = match.split('-')[0];
        if (colorType === 'teal') {
          return `secondary-${newColor}`;
        } else {
          return `primary-${newColor}`;
        }
      });
      replacements += matches.length;
    }
  }
  
  return { content: newContent, replacements };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    stats.filesScanned++;
    
    if (!hasHardcodedColors(content)) {
      return { modified: false, replacements: 0 };
    }
    
    const { content: newContent, replacements } = replaceHardcodedColors(content);
    
    if (replacements > 0) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would modify ${filePath}: ${replacements} replacements`);
        if (options.verbose) {
          console.log(`  Original: ${content.match(/\b(green|emerald|lime|teal)-[0-9]{2,3}\b/g)?.join(', ') || 'N/A'}`);
          console.log(`  New: ${newContent.match(/\b(primary|secondary)-[0-9]{2,3}\b/g)?.join(', ') || 'N/A'}`);
        }
      } else if (!options.scanOnly) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Modified ${filePath}: ${replacements} replacements`);
        stats.filesModified++;
      } else {
        console.log(`🔍 Found ${filePath}: ${replacements} hardcoded colors`);
      }
      
      stats.totalReplacements += replacements;
      return { modified: true, replacements };
    }
    
    return { modified: false, replacements: 0 };
  } catch (error) {
    stats.errors.push(`Error processing ${filePath}: ${error.message}`);
    return { modified: false, replacements: 0 };
  }
}

/**
 * Generate a detailed report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('HARDCODED COLOR SCAN REPORT');
  console.log('='.repeat(60));
  console.log(`Files scanned: ${stats.filesScanned}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Total replacements: ${stats.totalReplacements}`);
  
  if (stats.errors.length > 0) {
    console.log(`\nErrors encountered: ${stats.errors.length}`);
    stats.errors.forEach(error => console.log(`  ❌ ${error}`));
  }
  
  if (options.scanOnly) {
    console.log('\n🔍 Scan completed. Use without --scan-only to fix issues.');
  } else if (options.dryRun) {
    console.log('\n🔍 Dry run completed. Use without --dry-run to apply changes.');
  } else {
    console.log('\n✅ All hardcoded colors have been replaced with theme-aware alternatives!');
  }
  
  console.log('\nColor mappings applied:');
  console.log('  Green/Emerald/Lime → Primary');
  console.log('  Pink/Rose/Fuchsia → Primary (fixing pink appearing instead of green)');
  console.log('  Teal → Secondary');
  console.log('  All variants (50-900) → Theme-aware equivalents');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for hardcoded colors...\n');
  
  // Find all files to process
  const files = [];
  for (const dir of CONFIG.scanDirs) {
    if (fs.existsSync(dir)) {
      findFiles(dir, files);
    } else {
      console.log(`⚠️  Directory ${dir} not found, skipping...`);
    }
  }
  
  console.log(`Found ${files.length} files to scan\n`);
  
  // Process each file
  for (const file of files) {
    processFile(file);
  }
  
  // Generate report
  generateReport();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  findFiles,
  hasHardcodedColors,
  replaceHardcodedColors,
  processFile,
  CONFIG
};