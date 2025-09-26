#!/usr/bin/env node

/**
 * Comprehensive Hardcoded Color Fixer
 * 
 * This script automatically scans the codebase for ALL hardcoded colors
 * and replaces them with theme-aware CSS variables according to the design system.
 * 
 * Usage:
 *   node scripts/fix-all-hardcoded-colors.js [options]
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
  
  // Comprehensive color mappings (hardcoded -> theme-aware)
  colorMappings: {
    // Primary colors (blue, purple, indigo, green, emerald, lime, pink, rose, fuchsia)
    'blue-50': 'primary/10',
    'blue-100': 'primary/20',
    'blue-200': 'primary/30',
    'blue-300': 'primary/40',
    'blue-400': 'primary',
    'blue-500': 'primary',
    'blue-600': 'primary',
    'blue-700': 'primary',
    'blue-800': 'primary',
    'blue-900': 'primary',
    
    'purple-50': 'primary/10',
    'purple-100': 'primary/20',
    'purple-200': 'primary/30',
    'purple-300': 'primary/40',
    'purple-400': 'primary',
    'purple-500': 'primary',
    'purple-600': 'primary',
    'purple-700': 'primary',
    'purple-800': 'primary',
    'purple-900': 'primary',
    
    'indigo-50': 'primary/10',
    'indigo-100': 'primary/20',
    'indigo-200': 'primary/30',
    'indigo-300': 'primary/40',
    'indigo-400': 'primary',
    'indigo-500': 'primary',
    'indigo-600': 'primary',
    'indigo-700': 'primary',
    'indigo-800': 'primary',
    'indigo-900': 'primary',
    
    'green-50': 'primary/10',
    'green-100': 'primary/20',
    'green-200': 'primary/30',
    'green-300': 'primary/40',
    'green-400': 'primary',
    'green-500': 'primary',
    'green-600': 'primary',
    'green-700': 'primary',
    'green-800': 'primary',
    'green-900': 'primary',
    
    'emerald-50': 'primary/10',
    'emerald-100': 'primary/20',
    'emerald-200': 'primary/30',
    'emerald-300': 'primary/40',
    'emerald-400': 'primary',
    'emerald-500': 'primary',
    'emerald-600': 'primary',
    'emerald-700': 'primary',
    'emerald-800': 'primary',
    'emerald-900': 'primary',
    
    'lime-50': 'primary/10',
    'lime-100': 'primary/20',
    'lime-200': 'primary/30',
    'lime-300': 'primary/40',
    'lime-400': 'primary',
    'lime-500': 'primary',
    'lime-600': 'primary',
    'lime-700': 'primary',
    'lime-800': 'primary',
    'lime-900': 'primary',
    
    'pink-50': 'primary/10',
    'pink-100': 'primary/20',
    'pink-200': 'primary/30',
    'pink-300': 'primary/40',
    'pink-400': 'primary',
    'pink-500': 'primary',
    'pink-600': 'primary',
    'pink-700': 'primary',
    'pink-800': 'primary',
    'pink-900': 'primary',
    
    'rose-50': 'primary/10',
    'rose-100': 'primary/20',
    'rose-200': 'primary/30',
    'rose-300': 'primary/40',
    'rose-400': 'primary',
    'rose-500': 'primary',
    'rose-600': 'primary',
    'rose-700': 'primary',
    'rose-800': 'primary',
    'rose-900': 'primary',
    
    'fuchsia-50': 'primary/10',
    'fuchsia-100': 'primary/20',
    'fuchsia-200': 'primary/30',
    'fuchsia-300': 'primary/40',
    'fuchsia-400': 'primary',
    'fuchsia-500': 'primary',
    'fuchsia-600': 'primary',
    'fuchsia-700': 'primary',
    'fuchsia-800': 'primary',
    'fuchsia-900': 'primary',
    
    // Secondary colors (yellow, orange)
    'yellow-50': 'primary/10',
    'yellow-100': 'primary/20',
    'yellow-200': 'primary/30',
    'yellow-300': 'primary/40',
    'yellow-400': 'primary',
    'yellow-500': 'primary',
    'yellow-600': 'primary',
    'yellow-700': 'primary',
    'yellow-800': 'primary',
    'yellow-900': 'primary',
    
    'orange-50': 'primary/10',
    'orange-100': 'primary/20',
    'orange-200': 'primary/30',
    'orange-300': 'primary/40',
    'orange-400': 'primary',
    'orange-500': 'primary',
    'orange-600': 'primary',
    'orange-700': 'primary',
    'orange-800': 'primary',
    'orange-900': 'primary',
    
    // Neutral colors (gray)
    'gray-50': 'muted',
    'gray-100': 'muted',
    'gray-200': 'muted',
    'gray-300': 'muted',
    'gray-400': 'muted-foreground',
    'gray-500': 'muted-foreground',
    'gray-600': 'muted-foreground',
    'gray-700': 'muted',
    'gray-800': 'muted',
    'gray-900': 'muted',
    
    // Destructive colors (red)
    'red-50': 'destructive/10',
    'red-100': 'destructive/20',
    'red-200': 'destructive/30',
    'red-300': 'destructive/40',
    'red-400': 'destructive',
    'red-500': 'destructive',
    'red-600': 'destructive',
    'red-700': 'destructive',
    'red-800': 'destructive',
    'red-900': 'destructive'
  },
  
  // CSS property mappings
  cssPropertyMappings: {
    // Primary colors
    'bg-blue': 'bg-primary',
    'text-blue': 'text-primary',
    'border-blue': 'border-primary',
    'bg-purple': 'bg-primary',
    'text-purple': 'text-primary',
    'border-purple': 'border-primary',
    'bg-indigo': 'bg-primary',
    'text-indigo': 'text-primary',
    'border-indigo': 'border-primary',
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
    
    // Secondary colors
    'bg-yellow': 'bg-primary',
    'text-yellow': 'text-primary',
    'border-yellow': 'border-primary',
    'bg-orange': 'bg-primary',
    'text-orange': 'text-primary',
    'border-orange': 'border-primary',
    
    // Neutral colors
    'bg-gray': 'bg-muted',
    'text-gray': 'text-muted-foreground',
    'border-gray': 'border-border',
    
    // Destructive colors
    'bg-red': 'bg-destructive',
    'text-red': 'text-destructive',
    'border-red': 'border-destructive'
  },
  
  // Special cases that need custom handling
  specialCases: [
    // Common dark mode patterns
    {
      pattern: /text-white/g,
      replacement: 'text-primary-foreground'
    },
    {
      pattern: /bg-white/g,
      replacement: 'bg-background'
    },
    {
      pattern: /border-white/g,
      replacement: 'border-border'
    },
    
    // Dark mode combinations
    {
      pattern: /text-gray-900 dark:text-gray-100/g,
      replacement: 'text-foreground'
    },
    {
      pattern: /text-gray-800 dark:text-gray-200/g,
      replacement: 'text-foreground'
    },
    {
      pattern: /text-gray-700 dark:text-gray-300/g,
      replacement: 'text-foreground'
    },
    {
      pattern: /text-gray-600 dark:text-gray-400/g,
      replacement: 'text-muted-foreground'
    },
    {
      pattern: /text-gray-500 dark:text-gray-500/g,
      replacement: 'text-muted-foreground'
    },
    {
      pattern: /text-gray-400 dark:text-gray-600/g,
      replacement: 'text-muted-foreground'
    },
    
    // Background combinations
    {
      pattern: /bg-gray-50 dark:bg-gray-900/g,
      replacement: 'bg-muted'
    },
    {
      pattern: /bg-gray-100 dark:bg-gray-800/g,
      replacement: 'bg-muted'
    },
    {
      pattern: /bg-gray-200 dark:bg-gray-700/g,
      replacement: 'bg-muted'
    },
    {
      pattern: /bg-gray-300 dark:bg-gray-600/g,
      replacement: 'bg-muted'
    },
    
    // Border combinations
    {
      pattern: /border-gray-200 dark:border-gray-700/g,
      replacement: 'border-border'
    },
    {
      pattern: /border-gray-300 dark:border-gray-600/g,
      replacement: 'border-border'
    },
    
    // Primary color dark mode patterns
    {
      pattern: /text-blue-600 dark:text-blue-400/g,
      replacement: 'text-primary'
    },
    {
      pattern: /text-purple-600 dark:text-purple-400/g,
      replacement: 'text-primary'
    },
    {
      pattern: /text-indigo-600 dark:text-indigo-400/g,
      replacement: 'text-primary'
    },
    {
      pattern: /text-green-600 dark:text-green-400/g,
      replacement: 'text-primary'
    },
    {
      pattern: /text-pink-600 dark:text-pink-400/g,
      replacement: 'text-primary'
    },
    
    // Background with text combinations
    {
      pattern: /bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200/g,
      replacement: 'bg-primary/10 text-primary'
    },
    {
      pattern: /bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200/g,
      replacement: 'bg-primary/10 text-primary'
    },
    {
      pattern: /bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200/g,
      replacement: 'bg-primary/10 text-primary'
    },
    {
      pattern: /bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200/g,
      replacement: 'bg-primary/10 text-primary'
    },
    {
      pattern: /bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200/g,
      replacement: 'bg-primary/10 text-primary'
    },
    
    // Destructive color patterns
    {
      pattern: /text-red-600 dark:text-red-400/g,
      replacement: 'text-destructive'
    },
    {
      pattern: /bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200/g,
      replacement: 'bg-destructive/10 text-destructive'
    },
    
    // Yellow/Orange patterns
    {
      pattern: /text-yellow-600 dark:text-yellow-400/g,
      replacement: 'text-primary'
    },
    {
      pattern: /text-orange-600 dark:text-orange-400/g,
      replacement: 'text-primary'
    },
    {
      pattern: /bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200/g,
      replacement: 'bg-primary/10 text-primary'
    },
    {
      pattern: /bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200/g,
      replacement: 'bg-primary/10 text-primary'
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
Comprehensive Hardcoded Color Fixer

Usage: node scripts/fix-all-hardcoded-colors.js [options]

Options:
  --scan-only    Only scan and report, don't fix
  --dry-run      Show what would be changed without making changes
  --verbose      Show detailed output
  --help         Show this help message

Examples:
  node scripts/fix-all-hardcoded-colors.js --scan-only
  node scripts/fix-all-hardcoded-colors.js --dry-run --verbose
  node scripts/fix-all-hardcoded-colors.js
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
  // All Tailwind color classes
  /\b(blue|purple|indigo|green|emerald|lime|teal|pink|rose|fuchsia|yellow|orange|gray|red)-[0-9]{2,3}\b/g,
  // CSS property classes
  /\b(bg|text|border)-(blue|purple|indigo|green|emerald|lime|teal|pink|rose|fuchsia|yellow|orange|gray|red)-[0-9]{2,3}\b/g,
  // Special patterns
  /text-white\b/g,
  /bg-white\b/g,
  /border-white\b/g
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
    const pattern = new RegExp(`\\b(blue|purple|indigo|green|emerald|lime|teal|pink|rose|fuchsia|yellow|orange|gray|red)-${oldColor.replace(/^(blue|purple|indigo|green|emerald|lime|teal|pink|rose|fuchsia|yellow|orange|gray|red)-/, '')}\\b`, 'g');
    const matches = newContent.match(pattern);
    if (matches) {
      newContent = newContent.replace(pattern, (match) => {
        const colorType = match.split('-')[0];
        if (colorType === 'gray') {
          return `muted-${newColor}`;
        } else if (colorType === 'red') {
          return `destructive-${newColor}`;
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
          const originalColors = content.match(/\b(blue|purple|indigo|green|emerald|lime|teal|pink|rose|fuchsia|yellow|orange|gray|red)-[0-9]{2,3}\b/g) || [];
          const newColors = newContent.match(/\b(primary|secondary|muted|destructive)-[0-9]{2,3}\b/g) || [];
          console.log(`  Original: ${originalColors.slice(0, 5).join(', ')}${originalColors.length > 5 ? '...' : ''}`);
          console.log(`  New: ${newColors.slice(0, 5).join(', ')}${newColors.length > 5 ? '...' : ''}`);
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
  console.log('COMPREHENSIVE HARDCODED COLOR SCAN REPORT');
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
  console.log('  Blue/Purple/Indigo/Green/Emerald/Lime/Pink/Rose/Fuchsia/Yellow/Orange → Primary');
  console.log('  Gray → Muted');
  console.log('  Red → Destructive');
  console.log('  White → Primary-foreground/Background/Border');
  console.log('  All variants (50-900) → Theme-aware equivalents');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for ALL hardcoded colors...\n');
  
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
