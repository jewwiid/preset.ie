#!/usr/bin/env node

/**
 * Simple script to audit hardcoded colors in the codebase
 */

const fs = require('fs');
const path = require('path');

function findHardcodedColors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hardcodedColors = [];
    
    // Find all hardcoded color classes
    const colorRegex = /(bg|text|border)-(blue|purple|indigo|gray|red|yellow|green|pink|orange)-[0-9]+/g;
    let match;
    
    while ((match = colorRegex.exec(content)) !== null) {
      hardcodedColors.push({
        color: match[0],
        line: content.substring(0, match.index).split('\n').length,
        context: content.substring(Math.max(0, match.index - 30), match.index + 30)
      });
    }
    
    return hardcodedColors;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dirPath) {
  const files = [];
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dirPath);
  return files;
}

function main() {
  console.log('🔍 Scanning for hardcoded colors...\n');
  
  const webDir = path.join(__dirname, '..', 'apps', 'web');
  const files = scanDirectory(webDir);
  
  let totalIssues = 0;
  const filesWithIssues = [];
  
  files.forEach(file => {
    const issues = findHardcodedColors(file);
    if (issues.length > 0) {
      filesWithIssues.push({ file, issues });
      totalIssues += issues.length;
    }
  });
  
  console.log(`Found ${totalIssues} hardcoded color issues in ${filesWithIssues.length} files:\n`);
  
  filesWithIssues.forEach(({ file, issues }) => {
    console.log(`📁 ${path.relative(process.cwd(), file)}`);
    issues.forEach(issue => {
      console.log(`  Line ${issue.line}: ${issue.color}`);
    });
    console.log('');
  });
}

if (require.main === module) {
  main();
}
