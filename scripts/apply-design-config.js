#!/usr/bin/env node

/**
 * Design Configuration Applier
 * 
 * This script applies design configurations from the brand tester
 * to the actual CSS files in your application.
 * 
 * Usage:
 *   node scripts/apply-design-config.js [config-file] [options]
 * 
 * Options:
 *   --backup    Create backup of original files
 *   --dry-run   Show what would be changed without making changes
 *   --verbose   Show detailed output
 *   --help      Show this help message
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // CSS files to update
  cssFiles: [
    'apps/web/app/globals.css',
    'design-system/globals.css'
  ],
  
  // Backup directory
  backupDir: 'design-backups',
  
  // Design config file
  defaultConfigFile: 'design-config.json'
};

// Command line options
const options = {
  backup: process.argv.includes('--backup'),
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  help: process.argv.includes('--help')
};

// Show help
if (options.help) {
  console.log(`
Design Configuration Applier

Usage: node scripts/apply-design-config.js [config-file] [options]

Options:
  --backup    Create backup of original files
  --dry-run   Show what would be changed without making changes
  --verbose   Show detailed output
  --help      Show this help message

Examples:
  node scripts/apply-design-config.js design-config.json
  node scripts/apply-design-config.js design-config.json --backup --verbose
  node scripts/apply-design-config.js design-config.json --dry-run
`);
  process.exit(0);
}

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  variablesUpdated: 0,
  errors: []
};

/**
 * Load design configuration from file
 */
function loadDesignConfig(configFile) {
  try {
    const configPath = path.resolve(configFile);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    if (!config.colors || !config.fonts) {
      throw new Error('Invalid configuration format. Missing colors or fonts.');
    }
    
    return config;
  } catch (error) {
    stats.errors.push(`Error loading config: ${error.message}`);
    return null;
  }
}

/**
 * Create backup of file
 */
function createBackup(filePath) {
  try {
    const backupDir = path.join(process.cwd(), CONFIG.backupDir);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${fileName}.backup.${timestamp}`);
    
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    stats.errors.push(`Error creating backup for ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Update CSS variables in file content
 */
function updateCSSVariables(content, config) {
  let newContent = content;
  let updates = 0;
  
  // Update color variables
  Object.entries(config.colors).forEach(([variable, values]) => {
    // Update light mode values
    const lightPattern = new RegExp(`(\\s*${variable}\\s*:\\s*)[^;]+(;)`, 'g');
    const lightMatches = newContent.match(lightPattern);
    if (lightMatches) {
      newContent = newContent.replace(lightPattern, `$1${values.light}$2`);
      updates += lightMatches.length;
    }
    
    // Update dark mode values
    const darkPattern = new RegExp(`(\\.dark\\s*{[^}]*\\s*${variable}\\s*:\\s*)[^;]+(;)`, 'g');
    const darkMatches = newContent.match(darkPattern);
    if (darkMatches) {
      newContent = newContent.replace(darkPattern, `$1${values.dark}$2`);
      updates += darkMatches.length;
    }
  });
  
  // Update font variables
  Object.entries(config.fonts).forEach(([variable, value]) => {
    const fontPattern = new RegExp(`(\\s*${variable}\\s*:\\s*)[^;]+(;)`, 'g');
    const fontMatches = newContent.match(fontPattern);
    if (fontMatches) {
      newContent = newContent.replace(fontPattern, `$1${value}$2`);
      updates += fontMatches.length;
    }
  });
  
  return { content: newContent, updates };
}

/**
 * Process a single CSS file
 */
function processCSSFile(filePath, config) {
  try {
    stats.filesProcessed++;
    
    if (!fs.existsSync(filePath)) {
      stats.errors.push(`File not found: ${filePath}`);
      return { modified: false, updates: 0 };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, updates } = updateCSSVariables(content, config);
    
    if (updates > 0) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would modify ${filePath}: ${updates} variable updates`);
        if (options.verbose) {
          console.log(`  Original length: ${content.length} characters`);
          console.log(`  New length: ${newContent.length} characters`);
        }
      } else {
        // Create backup if requested
        if (options.backup) {
          const backupPath = createBackup(filePath);
          if (backupPath) {
            console.log(`✅ Backup created: ${backupPath}`);
          }
        }
        
        // Write updated content
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Updated ${filePath}: ${updates} variable updates`);
        stats.filesModified++;
      }
      
      stats.variablesUpdated += updates;
      return { modified: true, updates };
    }
    
    return { modified: false, updates: 0 };
  } catch (error) {
    stats.errors.push(`Error processing ${filePath}: ${error.message}`);
    return { modified: false, updates: 0 };
  }
}

/**
 * Generate updated CSS content
 */
function generateUpdatedCSS(config) {
  let css = ':root {\n';
  
  // Add color variables
  Object.entries(config.colors).forEach(([variable, values]) => {
    css += `  ${variable}: ${values.light};\n`;
  });
  
  // Add font variables
  Object.entries(config.fonts).forEach(([variable, value]) => {
    css += `  ${variable}: ${value};\n`;
  });
  
  css += '}\n\n.dark {\n';
  
  // Add dark mode color variables
  Object.entries(config.colors).forEach(([variable, values]) => {
    css += `  ${variable}: ${values.dark};\n`;
  });
  
  css += '}\n';
  
  return css;
}

/**
 * Generate report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('DESIGN CONFIGURATION APPLICATION REPORT');
  console.log('='.repeat(60));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Variables updated: ${stats.variablesUpdated}`);
  
  if (stats.errors.length > 0) {
    console.log(`\nErrors encountered: ${stats.errors.length}`);
    stats.errors.forEach(error => console.log(`  ❌ ${error}`));
  }
  
  if (options.dryRun) {
    console.log('\n🔍 Dry run completed. Use without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Design configuration has been applied successfully!');
  }
  
  if (options.backup) {
    console.log(`\n📁 Backups created in: ${CONFIG.backupDir}/`);
  }
}

/**
 * Main execution
 */
function main() {
  const configFile = process.argv[2] || CONFIG.defaultConfigFile;
  
  console.log('🎨 Applying design configuration...\n');
  
  // Load configuration
  const config = loadDesignConfig(configFile);
  if (!config) {
    console.error('❌ Failed to load design configuration');
    process.exit(1);
  }
  
  console.log(`📁 Configuration loaded: ${config.metadata?.name || 'Unnamed Config'}`);
  console.log(`🎨 Colors: ${Object.keys(config.colors).length}`);
  console.log(`🔤 Fonts: ${Object.keys(config.fonts).length}\n`);
  
  // Process CSS files
  for (const filePath of CONFIG.cssFiles) {
    processCSSFile(filePath, config);
  }
  
  // Generate updated CSS if requested
  if (options.verbose) {
    console.log('\n📄 Generated CSS:');
    console.log('='.repeat(40));
    console.log(generateUpdatedCSS(config));
  }
  
  // Generate report
  generateReport();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  loadDesignConfig,
  updateCSSVariables,
  processCSSFile,
  generateUpdatedCSS,
  CONFIG
};
