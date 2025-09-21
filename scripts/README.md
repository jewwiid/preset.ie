# Theme Management Scripts

This directory contains scripts to help maintain theme consistency across the Preset codebase.

## Scripts Overview

### 1. `fix-hardcoded-colors.js`
**Purpose**: Automatically scan and fix hardcoded colors in the codebase.

**Features**:
- Scans all TypeScript/JavaScript files for hardcoded colors
- Replaces hardcoded green/emerald/lime colors with theme-aware alternatives
- Supports dry-run mode to preview changes
- Comprehensive reporting

**Usage**:
```bash
# Scan only (report issues without fixing)
node scripts/fix-hardcoded-colors.js --scan-only

# Dry run (show what would be changed)
node scripts/fix-hardcoded-colors.js --dry-run --verbose

# Fix all hardcoded colors
node scripts/fix-hardcoded-colors.js

# Show help
node scripts/fix-hardcoded-colors.js --help
```

### 2. `theme-audit.js`
**Purpose**: Comprehensive theme audit and maintenance tool.

**Features**:
- Scans for hardcoded colors, spacing, and shadows
- Identifies missing theme variables
- Provides detailed reporting
- Automatic fixing capabilities

**Usage**:
```bash
# Generate comprehensive report
node scripts/theme-audit.js --report-only --verbose

# Fix hardcoded colors automatically
node scripts/theme-audit.js --fix-colors

# Fix multiple issues
node scripts/theme-audit.js --fix-colors --fix-spacing --fix-shadows

# Show help
node scripts/theme-audit.js --help
```

## Color Mappings

The scripts automatically map hardcoded colors to theme-aware alternatives:

### Green Family → Primary
- `green-50` → `primary/10`
- `green-100` → `primary/10`
- `green-200` → `primary/20`
- `green-300` → `primary/30`
- `green-400` → `primary`
- `green-500` → `primary`
- `green-600` → `primary`
- `green-700` → `primary/90`
- `green-800` → `primary`
- `green-900` → `primary`

### Emerald Family → Primary
- `emerald-*` → `primary-*` (same mapping as green)

### Teal Family → Secondary
- `teal-*` → `secondary-*` (same mapping pattern)

## Special Cases Handled

The scripts handle complex patterns like:

```tsx
// Before
className="text-green-600 dark:text-green-400"
className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
className="hover:text-green-500"
className="focus:ring-green-500 focus:border-green-500"

// After
className="text-primary"
className="bg-primary/10 text-primary"
className="hover:text-primary"
className="focus:ring-primary focus:border-primary"
```

## Integration with Package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "theme:audit": "node scripts/theme-audit.js --report-only",
    "theme:audit:verbose": "node scripts/theme-audit.js --report-only --verbose",
    "theme:fix-colors": "node scripts/fix-hardcoded-colors.js",
    "theme:fix-all": "node scripts/theme-audit.js --fix-colors --fix-spacing --fix-shadows",
    "theme:scan": "node scripts/fix-hardcoded-colors.js --scan-only"
  }
}
```

Then run:
```bash
npm run theme:audit
npm run theme:fix-colors
npm run theme:fix-all
```

## Best Practices

### 1. Regular Audits
Run theme audits regularly to catch new hardcoded colors:
```bash
npm run theme:audit
```

### 2. Pre-commit Hooks
Consider adding a pre-commit hook to prevent hardcoded colors:
```bash
# In .husky/pre-commit
npm run theme:scan
```

### 3. CI/CD Integration
Add theme checks to your CI pipeline:
```bash
# In your CI workflow
npm run theme:audit
```

### 4. Development Workflow
1. Run `npm run theme:audit` before major releases
2. Use `npm run theme:fix-colors` to automatically fix issues
3. Review changes before committing

## Configuration

### Customizing Scan Directories
Edit the `scanDirs` array in the script files:

```javascript
const CONFIG = {
  scanDirs: [
    'apps/web/app',
    'apps/web/components',
    'apps/web/lib',
    'packages/tokens/src'  // Add custom directories
  ]
};
```

### Adding New Color Mappings
Extend the `colorMappings` object:

```javascript
const CONFIG = {
  colorMappings: {
    // Existing mappings...
    'purple-500': 'accent',
    'blue-600': 'primary'
  }
};
```

## Troubleshooting

### Common Issues

1. **Script not found**: Ensure you're running from the project root
2. **Permission denied**: Make scripts executable: `chmod +x scripts/*.js`
3. **Node version**: Scripts require Node.js 14+

### Debugging

Use verbose mode for detailed output:
```bash
node scripts/theme-audit.js --report-only --verbose
```

### Excluding Files

Add patterns to skip certain files:
```javascript
// In the script
if (['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
  // Skip these directories
}
```

## Contributing

When adding new theme-related features:

1. Update the color mappings in both scripts
2. Add new patterns to the special cases
3. Test with `--dry-run` first
4. Update this README with new features

## Support

For issues or questions:
1. Check the script output for error messages
2. Use `--verbose` flag for detailed information
3. Review the configuration in the script files
4. Test with `--dry-run` before applying fixes
