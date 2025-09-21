#!/usr/bin/env node

/**
 * Theme Update Script
 * Automatically updates components to use new OKLCH theme
 */

const fs = require('fs');
const path = require('path');

// Color mapping from old to new
const colorMappings = {
  // Background colors
  'bg-preset-500': 'bg-primary',
  'bg-preset-400': 'bg-primary/80',
  'bg-preset-600': 'bg-primary/90',
  
  // Text colors
  'text-preset-500': 'text-primary',
  'text-preset-600': 'text-primary/90',
  'text-preset-700': 'text-primary/80',
  
  // Border colors
  'border-preset-500': 'border-primary',
  'border-preset-200': 'border-border',
  
  // Ring colors
  'ring-preset-500': 'ring-primary',
  'focus:ring-preset-500': 'focus:ring-primary',
  
  // Hover states
  'hover:bg-preset-600': 'hover:bg-primary/90',
  'hover:bg-preset-700': 'hover:bg-primary/80',
};

// Files to update
const filesToUpdate = [
  'apps/web/components/**/*.tsx',
  'apps/web/app/**/*.tsx',
  'apps/mobile/screens/**/*.tsx',
  'apps/mobile/components/**/*.tsx',
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply color mappings
    Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
      const regex = new RegExp(oldColor, 'g');
      if (content.includes(oldColor)) {
        content = content.replace(regex, newColor);
        updated = true;
      }
    });
    
    // Update inline styles
    content = content.replace(
      /style=\{\{[\s\S]*?backgroundColor:\s*['"]#00876f['"][\s\S]*?\}\}/g,
      'className="bg-primary"'
    );
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

function findFiles(pattern) {
  // Simple glob pattern matching
  const basePath = pattern.split('**')[0];
  const files = [];
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
  }
  
  if (fs.existsSync(basePath)) {
    walkDir(basePath);
  }
  
  return files;
}

// Main execution
console.log('🎨 Starting theme update...\n');

filesToUpdate.forEach(pattern => {
  const files = findFiles(pattern);
  files.forEach(updateFile);
});

console.log('\n✨ Theme update complete!');
console.log('\n📋 Next steps:');
console.log('1. Test your application: npm run dev');
console.log('2. Check dark mode: Toggle theme in browser');
console.log('3. Verify all components render correctly');
console.log('4. Update any remaining hard-coded colors manually');
