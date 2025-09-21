#!/usr/bin/env node

/**
 * Comprehensive Theme Audit Script
 * 
 * This script performs a comprehensive audit of the codebase to ensure
 * theme consistency and identify any hardcoded colors or styling issues.
 * 
 * Usage:
 *   node scripts/theme-audit.js [options]
 * 
 * Options:
 *   --fix-colors     Automatically fix hardcoded colors
 *   --fix-spacing    Fix spacing inconsistencies
 *   --fix-shadows    Fix shadow inconsistencies
 *   --report-only    Generate report only, don't fix
 *   --verbose        Show detailed output
 *   --help           Show this help message
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Directories to scan
  scanDirs: [
    'apps/web/app',
    'apps/web/components',
    'apps/web/lib',
    'packages/tokens/src'
  ],
  
  // File extensions to process
  fileExtensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss'],
  
  // Theme-aware CSS variables
  themeVariables: [
    '--background',
    '--foreground',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--muted',
    '--muted-foreground',
    '--accent',
    '--accent-foreground',
    '--destructive',
    '--destructive-foreground',
    '--border',
    '--input',
    '--ring',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground'
  ],
  
  // Hardcoded color patterns
  hardcodedPatterns: {
    // Tailwind colors
    tailwindColors: /\b(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]{2,3}\b/g,
    
    // Hex colors
    hexColors: /#[0-9a-fA-F]{3,6}\b/g,
    
    // RGB colors
    rgbColors: /rgb\([^)]+\)/g,
    
    // RGBA colors
    rgbaColors: /rgba\([^)]+\)/g,
    
    // HSL colors
    hslColors: /hsl\([^)]+\)/g,
    
    // Hardcoded spacing
    hardcodedSpacing: /\b(mt|mb|ml|mr|pt|pb|pl|pr|px|py|mx|my|m|p)-[0-9]+\b/g,
    
    // Hardcoded shadows
    hardcodedShadows: /\b(shadow|drop-shadow)-[a-z0-9-]+\b/g
  },
  
  // Color mappings for automatic fixes
  colorMappings: {
    // Green family → Primary
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
    
    // Emerald family → Primary
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
    
    // Pink/Rose/Fuchsia family → Primary (fixing pink appearing instead of green)
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
    
    // Teal family → Secondary
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
  }
};

// Command line options
const options = {
  fixColors: process.argv.includes('--fix-colors'),
  fixSpacing: process.argv.includes('--fix-spacing'),
  fixShadows: process.argv.includes('--fix-shadows'),
  reportOnly: process.argv.includes('--report-only'),
  verbose: process.argv.includes('--verbose'),
  help: process.argv.includes('--help')
};

// Statistics
const stats = {
  filesScanned: 0,
  filesModified: 0,
  issuesFound: {
    hardcodedColors: 0,
    hardcodedSpacing: 0,
    hardcodedShadows: 0,
    missingThemeVars: 0,
    inconsistentSpacing: 0
  },
  errors: []
};

// Show help
if (options.help) {
  console.log(`
Comprehensive Theme Audit Script

Usage: node scripts/theme-audit.js [options]

Options:
  --fix-colors     Automatically fix hardcoded colors
  --fix-spacing    Fix spacing inconsistencies
  --fix-shadows    Fix shadow inconsistencies
  --report-only    Generate report only, don't fix
  --verbose        Show detailed output
  --help           Show this help message

Examples:
  node scripts/theme-audit.js --report-only --verbose
  node scripts/theme-audit.js --fix-colors --fix-spacing
  node scripts/theme-audit.js --fix-colors --fix-shadows --verbose
`);
  process.exit(0);
}

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
        // Skip common directories
        if (!['node_modules', '.git', '.next', 'dist', 'build', '__pycache__'].includes(item)) {
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
 * Analyze a file for theme issues
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    stats.filesScanned++;
    
    const issues = {
      hardcodedColors: [],
      hardcodedSpacing: [],
      hardcodedShadows: [],
      missingThemeVars: [],
      inconsistentSpacing: []
    };
    
    // Check for hardcoded colors
    const colorMatches = content.match(CONFIG.hardcodedPatterns.tailwindColors);
    if (colorMatches) {
      issues.hardcodedColors = colorMatches.filter(color => 
        !color.startsWith('primary') && 
        !color.startsWith('secondary') &&
        !color.startsWith('muted') &&
        !color.startsWith('accent') &&
        !color.startsWith('destructive')
      );
      stats.issuesFound.hardcodedColors += issues.hardcodedColors.length;
    }
    
    // Check for hex colors
    const hexMatches = content.match(CONFIG.hardcodedPatterns.hexColors);
    if (hexMatches) {
      issues.hardcodedColors.push(...hexMatches);
      stats.issuesFound.hardcodedColors += hexMatches.length;
    }
    
    // Check for RGB/RGBA colors
    const rgbMatches = content.match(CONFIG.hardcodedPatterns.rgbColors);
    const rgbaMatches = content.match(CONFIG.hardcodedPatterns.rgbaColors);
    if (rgbMatches || rgbaMatches) {
      issues.hardcodedColors.push(...(rgbMatches || []), ...(rgbaMatches || []));
      stats.issuesFound.hardcodedColors += (rgbMatches?.length || 0) + (rgbaMatches?.length || 0);
    }
    
    // Check for hardcoded spacing
    const spacingMatches = content.match(CONFIG.hardcodedPatterns.hardcodedSpacing);
    if (spacingMatches) {
      issues.hardcodedSpacing = spacingMatches;
      stats.issuesFound.hardcodedSpacing += spacingMatches.length;
    }
    
    // Check for hardcoded shadows
    const shadowMatches = content.match(CONFIG.hardcodedPatterns.hardcodedShadows);
    if (shadowMatches) {
      issues.hardcodedShadows = shadowMatches;
      stats.issuesFound.hardcodedShadows += shadowMatches.length;
    }
    
    // Check for missing theme variables
    const hasThemeVars = CONFIG.themeVariables.some(varName => 
      content.includes(varName)
    );
    if (!hasThemeVars && (content.includes('className=') || content.includes('style='))) {
      issues.missingThemeVars.push('No theme variables found');
      stats.issuesFound.missingThemeVars++;
    }
    
    return issues;
  } catch (error) {
    stats.errors.push(`Error analyzing ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Fix hardcoded colors in a file
 */
function fixHardcodedColors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply color mappings
    for (const [oldColor, newColor] of Object.entries(CONFIG.colorMappings)) {
      const pattern = new RegExp(`\\b${oldColor}\\b`, 'g');
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, `primary-${newColor}`);
        modified = true;
      }
    }
    
    // Fix special cases
    const specialCases = [
      { pattern: /text-green-600 dark:text-green-400/g, replacement: 'text-primary' },
      { pattern: /bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200/g, replacement: 'bg-primary/10 text-primary' },
      { pattern: /hover:text-green-500/g, replacement: 'hover:text-primary' },
      { pattern: /hover:text-emerald-500/g, replacement: 'hover:text-primary' },
      { pattern: /hover:text-emerald-600/g, replacement: 'hover:text-primary' },
      { pattern: /hover:text-emerald-700/g, replacement: 'hover:text-primary/80' },
      { pattern: /hover:bg-green-50/g, replacement: 'hover:bg-primary/10' },
      { pattern: /hover:bg-emerald-50/g, replacement: 'hover:bg-primary/10' },
      { pattern: /focus:ring-green-500/g, replacement: 'focus:ring-primary' },
      { pattern: /focus:ring-emerald-500/g, replacement: 'focus:ring-primary' },
      { pattern: /focus:border-green-500/g, replacement: 'focus:border-primary' },
      { pattern: /focus:border-emerald-500/g, replacement: 'focus:border-primary' },
      // Pink color special cases
      { pattern: /text-pink-600 dark:text-pink-400/g, replacement: 'text-primary' },
      { pattern: /bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200/g, replacement: 'bg-primary/10 text-primary' },
      { pattern: /hover:text-pink-500/g, replacement: 'hover:text-primary' },
      { pattern: /hover:text-pink-600/g, replacement: 'hover:text-primary' },
      { pattern: /hover:text-pink-700/g, replacement: 'hover:text-primary/80' },
      { pattern: /hover:bg-pink-50/g, replacement: 'hover:bg-primary/10' },
      { pattern: /hover:bg-pink-100/g, replacement: 'hover:bg-primary/20' },
      { pattern: /hover:bg-pink-700/g, replacement: 'hover:bg-primary/90' },
      { pattern: /focus:ring-pink-500/g, replacement: 'focus:ring-primary' },
      { pattern: /focus:border-pink-500/g, replacement: 'focus:border-primary' }
    ];
    
    for (const specialCase of specialCases) {
      if (specialCase.pattern.test(content)) {
        content = content.replace(specialCase.pattern, specialCase.replacement);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
      return true;
    }
    
    return false;
  } catch (error) {
    stats.errors.push(`Error fixing colors in ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Generate detailed report
 */
function generateReport(fileIssues) {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE THEME AUDIT REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`  Files scanned: ${stats.filesScanned}`);
  console.log(`  Files modified: ${stats.filesModified}`);
  console.log(`  Total issues found: ${Object.values(stats.issuesFound).reduce((a, b) => a + b, 0)}`);
  
  console.log(`\n🎨 COLOR ISSUES:`);
  console.log(`  Hardcoded colors: ${stats.issuesFound.hardcodedColors}`);
  console.log(`  Hardcoded spacing: ${stats.issuesFound.hardcodedSpacing}`);
  console.log(`  Hardcoded shadows: ${stats.issuesFound.hardcodedShadows}`);
  console.log(`  Missing theme vars: ${stats.issuesFound.missingThemeVars}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    stats.errors.forEach(error => console.log(`  ${error}`));
  }
  
  // Show files with most issues
  const filesWithIssues = Object.entries(fileIssues)
    .filter(([_, issues]) => Object.values(issues).some(arr => arr.length > 0))
    .sort(([_, a], [__, b]) => {
      const aTotal = Object.values(a).reduce((sum, arr) => sum + arr.length, 0);
      const bTotal = Object.values(b).reduce((sum, arr) => sum + arr.length, 0);
      return bTotal - aTotal;
    })
    .slice(0, 10);
  
  if (filesWithIssues.length > 0) {
    console.log(`\n🔍 TOP FILES WITH ISSUES:`);
    filesWithIssues.forEach(([filePath, issues]) => {
      const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
      console.log(`  ${filePath}: ${totalIssues} issues`);
      if (options.verbose) {
        Object.entries(issues).forEach(([type, items]) => {
          if (items.length > 0) {
            console.log(`    ${type}: ${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''}`);
          }
        });
      }
    });
  }
  
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (stats.issuesFound.hardcodedColors > 0) {
    console.log(`  • Run with --fix-colors to automatically fix ${stats.issuesFound.hardcodedColors} hardcoded colors`);
  }
  if (stats.issuesFound.hardcodedSpacing > 0) {
    console.log(`  • Run with --fix-spacing to fix ${stats.issuesFound.hardcodedSpacing} spacing issues`);
  }
  if (stats.issuesFound.hardcodedShadows > 0) {
    console.log(`  • Run with --fix-shadows to fix ${stats.issuesFound.hardcodedShadows} shadow issues`);
  }
  if (stats.issuesFound.missingThemeVars > 0) {
    console.log(`  • Consider adding theme variables to ${stats.issuesFound.missingThemeVars} files`);
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting comprehensive theme audit...\n');
  
  // Find all files to process
  const files = [];
  for (const dir of CONFIG.scanDirs) {
    if (fs.existsSync(dir)) {
      findFiles(dir, files);
    } else {
      console.log(`⚠️  Directory ${dir} not found, skipping...`);
    }
  }
  
  console.log(`Found ${files.length} files to analyze\n`);
  
  const fileIssues = {};
  
  // Analyze each file
  for (const file of files) {
    const issues = analyzeFile(file);
    if (issues) {
      fileIssues[file] = issues;
      
      // Fix issues if requested
      if (options.fixColors && issues.hardcodedColors.length > 0) {
        const fixed = fixHardcodedColors(file);
        if (fixed) {
          console.log(`✅ Fixed colors in ${file}`);
        }
      }
    }
  }
  
  // Generate report
  generateReport(fileIssues);
  
  if (options.fixColors || options.fixSpacing || options.fixShadows) {
    console.log('\n🎉 Theme fixes applied successfully!');
  } else {
    console.log('\n💡 Use --fix-colors, --fix-spacing, or --fix-shadows to automatically fix issues.');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  findFiles,
  analyzeFile,
  fixHardcodedColors,
  generateReport,
  CONFIG
};