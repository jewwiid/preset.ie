/**
 * Color Audit Utility for Brand Tester
 * Scans files for hardcoded colors and theme compliance issues
 */

export interface ColorIssue {
  file: string;
  line: number;
  column: number;
  type: 'hardcoded-color' | 'custom-color' | 'non-theme-class';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  originalText: string;
  suggestedText: string;
}

export interface AuditResult {
  totalFiles: number;
  scannedFiles: number;
  issuesFound: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  filesWithIssues: string[];
  issues: ColorIssue[];
  scanTime: number;
}

export class ColorAuditor {
  private colorPatterns = {
    // Hardcoded Tailwind colors
    hardcodedColors: /(bg|text|border)-(blue|purple|indigo|gray|red|yellow|green|pink|orange|emerald|lime|teal|cyan|sky|violet|fuchsia|rose|slate|zinc|neutral|stone|amber)-\d+/g,
    
    // Custom hex colors
    hexColors: /#[0-9a-fA-F]{3,6}/g,
    
    // RGB/RGBA colors
    rgbColors: /(rgb|rgba)\([^)]+\)/g,
    
    // HSL colors
    hslColors: /(hsl|hsla)\([^)]+\)/g,
    
    // OKLCH colors (these are usually theme-aware, but we'll flag them for review)
    oklchColors: /oklch\([^)]+\)/g,
    
    // Hardcoded white/black
    hardcodedBasic: /(bg|text|border)-(white|black|transparent)/g,
    
    // Custom CSS properties that might not be theme-aware
    customProperties: /var\(--[^)]+\)/g,
  };

  private fixMappings: Record<string, string> = {
    // Background colors
    'bg-blue-500': 'bg-primary',
    'bg-blue-600': 'bg-primary',
    'bg-blue-400': 'bg-primary',
    'bg-primary-500': 'bg-primary',
    'bg-primary-600': 'bg-primary',
    'bg-primary-400': 'bg-primary',
    'bg-red-500': 'bg-destructive',
    'bg-red-600': 'bg-destructive',
    'bg-red-400': 'bg-destructive',
    'bg-gray-50': 'bg-muted',
    'bg-gray-100': 'bg-muted',
    'bg-gray-200': 'bg-muted',
    'bg-gray-300': 'bg-muted',
    'bg-gray-400': 'bg-muted',
    'bg-gray-500': 'bg-muted',
    'bg-gray-600': 'bg-muted',
    'bg-gray-700': 'bg-muted',
    'bg-gray-800': 'bg-muted',
    'bg-gray-900': 'bg-muted',
    'bg-white': 'bg-background',
    'bg-black': 'bg-background',
    
    // Text colors
    'text-blue-500': 'text-primary',
    'text-blue-600': 'text-primary',
    'text-blue-400': 'text-primary',
    'text-primary-500': 'text-primary',
    'text-primary-600': 'text-primary',
    'text-primary-400': 'text-primary',
    'text-red-500': 'text-destructive',
    'text-red-600': 'text-destructive',
    'text-red-400': 'text-destructive',
    'text-gray-500': 'text-muted-foreground',
    'text-gray-600': 'text-muted-foreground',
    'text-gray-700': 'text-muted-foreground',
    'text-gray-800': 'text-muted-foreground',
    'text-gray-900': 'text-foreground',
    'text-white': 'text-primary-foreground',
    'text-black': 'text-foreground',
    
    // Border colors
    'border-blue-500': 'border-primary',
    'border-blue-600': 'border-primary',
    'border-primary-500': 'border-primary',
    'border-primary-600': 'border-primary',
    'border-red-500': 'border-destructive',
    'border-red-600': 'border-destructive',
    'border-gray-200': 'border-border',
    'border-gray-300': 'border-border',
    'border-gray-400': 'border-border',
    'border-gray-500': 'border-border',
    'border-white': 'border-border',
    'border-black': 'border-border',
  };

  private themeAwareClasses = [
    'bg-background', 'bg-card', 'bg-muted', 'bg-accent', 'bg-primary', 'bg-secondary', 'bg-destructive',
    'text-foreground', 'text-muted-foreground', 'text-primary', 'text-secondary', 'text-destructive',
    'border-border', 'border-primary', 'border-secondary', 'border-destructive',
    'ring-ring', 'ring-primary', 'ring-secondary', 'ring-destructive',
    'bg-popover', 'text-popover-foreground', 'bg-input', 'bg-accent', 'text-accent-foreground'
  ];

  private colorMappings: Record<string, string> = {
    // Common mappings for auto-fix suggestions
    'bg-blue-500': 'bg-primary',
    'bg-blue-600': 'bg-primary',
    'bg-primary-500': 'bg-primary',
    'bg-primary-600': 'bg-primary',
    'bg-red-500': 'bg-destructive',
    'bg-red-600': 'bg-destructive',
    'text-blue-600': 'text-primary',
    'text-primary-600': 'text-primary',
    'text-red-600': 'text-destructive',
    'text-gray-600': 'text-muted-foreground',
    'text-gray-500': 'text-muted-foreground',
    'text-gray-900': 'text-foreground',
    'text-white': 'text-primary-foreground',
    'bg-white': 'bg-background',
    'bg-gray-50': 'bg-muted',
    'bg-gray-100': 'bg-muted',
    'border-gray-200': 'border-border',
    'border-blue-500': 'border-primary',
  };

  async scanFile(filePath: string, content: string): Promise<ColorIssue[]> {
    const issues: ColorIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      
      // Check for hardcoded Tailwind colors
      this.checkHardcodedColors(line, lineNumber, filePath, issues);
      
      // Check for hex colors
      this.checkHexColors(line, lineNumber, filePath, issues);
      
      // Check for RGB/RGBA colors
      this.checkRgbColors(line, lineNumber, filePath, issues);
      
      // Check for hardcoded basic colors
      this.checkHardcodedBasic(line, lineNumber, filePath, issues);
      
      // Check for non-theme-aware classes
      this.checkNonThemeClasses(line, lineNumber, filePath, issues);
    });

    return issues;
  }

  private checkHardcodedColors(line: string, lineNumber: number, filePath: string, issues: ColorIssue[]) {
    const matches = line.matchAll(this.colorPatterns.hardcodedColors);
    
    for (const match of matches) {
      const originalText = match[0];
      const suggestedText = this.colorMappings[originalText] || this.suggestThemeClass(originalText);
      
      issues.push({
        file: filePath,
        line: lineNumber,
        column: match.index || 0,
        type: 'hardcoded-color',
        severity: 'error',
        message: `Hardcoded color class: ${originalText}`,
        suggestion: `Use theme-aware class: ${suggestedText}`,
        originalText,
        suggestedText
      });
    }
  }

  private checkHexColors(line: string, lineNumber: number, filePath: string, issues: ColorIssue[]) {
    const matches = line.matchAll(this.colorPatterns.hexColors);
    
    for (const match of matches) {
      const originalText = match[0];
      
      issues.push({
        file: filePath,
        line: lineNumber,
        column: match.index || 0,
        type: 'custom-color',
        severity: 'warning',
        message: `Custom hex color: ${originalText}`,
        suggestion: 'Consider using a theme-aware CSS variable or OKLCH color',
        originalText,
        suggestedText: 'var(--primary)' // Generic suggestion
      });
    }
  }

  private checkRgbColors(line: string, lineNumber: number, filePath: string, issues: ColorIssue[]) {
    const matches = line.matchAll(this.colorPatterns.rgbColors);
    
    for (const match of matches) {
      const originalText = match[0];
      
      issues.push({
        file: filePath,
        line: lineNumber,
        column: match.index || 0,
        type: 'custom-color',
        severity: 'warning',
        message: `Custom RGB color: ${originalText}`,
        suggestion: 'Consider using a theme-aware CSS variable or OKLCH color',
        originalText,
        suggestedText: 'var(--primary)'
      });
    }
  }

  private checkHardcodedBasic(line: string, lineNumber: number, filePath: string, issues: ColorIssue[]) {
    const matches = line.matchAll(this.colorPatterns.hardcodedBasic);
    
    for (const match of matches) {
      const originalText = match[0];
      const suggestedText = this.colorMappings[originalText] || this.suggestThemeClass(originalText);
      
      issues.push({
        file: filePath,
        line: lineNumber,
        column: match.index || 0,
        type: 'hardcoded-color',
        severity: 'error',
        message: `Hardcoded basic color: ${originalText}`,
        suggestion: `Use theme-aware class: ${suggestedText}`,
        originalText,
        suggestedText
      });
    }
  }

  private checkNonThemeClasses(line: string, lineNumber: number, filePath: string, issues: ColorIssue[]) {
    // Check for className attributes that might contain non-theme classes
    const classNameMatches = line.match(/className=["']([^"']+)["']/g);
    
    if (classNameMatches) {
      classNameMatches.forEach(classNameMatch => {
        const classContent = classNameMatch.match(/className=["']([^"']+)["']/)?.[1];
        if (classContent) {
          const classes = classContent.split(' ');
          classes.forEach(cls => {
            if (cls.includes('bg-') || cls.includes('text-') || cls.includes('border-')) {
              if (!this.themeAwareClasses.includes(cls) && !cls.includes('hover:') && !cls.includes('focus:') && !cls.includes('active:')) {
                issues.push({
                  file: filePath,
                  line: lineNumber,
                  column: line.indexOf(cls),
                  type: 'non-theme-class',
                  severity: 'warning',
                  message: `Potentially non-theme-aware class: ${cls}`,
                  suggestion: 'Verify this class is theme-aware or replace with theme variable',
                  originalText: cls,
                  suggestedText: this.suggestThemeClass(cls)
                });
              }
            }
          });
        }
      });
    }
  }

  private suggestThemeClass(originalClass: string): string {
    if (originalClass.startsWith('bg-')) {
      if (originalClass.includes('blue') || originalClass.includes('green')) return 'bg-primary';
      if (originalClass.includes('red')) return 'bg-destructive';
      if (originalClass.includes('gray')) return 'bg-muted';
      return 'bg-background';
    }
    
    if (originalClass.startsWith('text-')) {
      if (originalClass.includes('blue') || originalClass.includes('green')) return 'text-primary';
      if (originalClass.includes('red')) return 'text-destructive';
      if (originalClass.includes('gray')) return 'text-muted-foreground';
      if (originalClass.includes('white')) return 'text-primary-foreground';
      return 'text-foreground';
    }
    
    if (originalClass.startsWith('border-')) {
      if (originalClass.includes('blue') || originalClass.includes('green')) return 'border-primary';
      if (originalClass.includes('red')) return 'border-destructive';
      if (originalClass.includes('gray')) return 'border-border';
      return 'border-border';
    }
    
    return originalClass; // Return original if no suggestion
  }

  async scanFiles(filePaths: string[]): Promise<AuditResult> {
    const startTime = Date.now();
    const issues: ColorIssue[] = [];
    const filesWithIssues: string[] = [];
    
    for (const filePath of filePaths) {
      try {
        // In a real implementation, you'd fetch the file content
        // For now, we'll simulate this
        const content = await this.fetchFileContent(filePath);
        const fileIssues = await this.scanFile(filePath, content);
        
        if (fileIssues.length > 0) {
          filesWithIssues.push(filePath);
          issues.push(...fileIssues);
        }
      } catch (error) {
        console.warn(`Failed to scan file ${filePath}:`, error);
      }
    }

    const scanTime = Date.now() - startTime;
    
    // Calculate statistics
    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles: filePaths.length,
      scannedFiles: filePaths.length,
      issuesFound: issues.length,
      issuesByType,
      issuesBySeverity,
      filesWithIssues,
      issues,
      scanTime
    };
  }

  private async fetchFileContent(filePath: string): Promise<string> {
    try {
      // Call API to get actual file content
      const response = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const { content } = await response.json();
        return content;
      }
    } catch (error) {
      console.warn(`Failed to fetch content for ${filePath}:`, error);
    }
    
    // Fallback to mock content for demonstration
    return `// Mock file content for ${filePath}
import React from 'react';

export function Component() {
  return (
    <div className="bg-blue-500 text-white p-4">
      <h1 className="text-gray-900">Title</h1>
      <p className="text-gray-600">Description</p>
      <button className="bg-primary-500 hover:bg-primary-600 text-white">
        Click me
      </button>
    </div>
  );
}`;
  }

  // Method to get file paths for scanning
  async getFilePaths(): Promise<string[]> {
    try {
      // Call API to get actual file paths
      const response = await fetch('/api/scan-files');
      if (response.ok) {
        const { files } = await response.json();
        return files;
      }
    } catch (error) {
      console.warn('Failed to get file paths from API, using fallback');
    }
    
    // Fallback to known file paths
    return [
      'apps/web/app/dashboard/page.tsx',
      'apps/web/components/auth/AuthGuard.tsx',
      'apps/web/app/gigs/page.tsx',
      'apps/web/components/marketplace/EquipmentRequestCard.tsx',
      'apps/web/app/components/CreditPurchase.tsx',
      'apps/web/app/components/OptimizedMasonryGrid.tsx',
      'apps/web/app/components/MosaicGrid.tsx',
      'apps/web/app/components/MasonryGrid.tsx',
      'apps/web/app/components/EnhancementPreview.tsx',
      'apps/web/app/components/presets/ApprovalStatusBadge.tsx',
      'apps/web/app/credits/purchase/page.tsx',
      'apps/web/app/treatments/page.tsx',
      'apps/web/components/marketplace/VerificationBadge.tsx'
    ];
  }

  // Auto-fix functionality
  async autoFixIssues(issues: ColorIssue[]): Promise<{ fixed: number; failed: number; details: string[] }> {
    const fixDetails: string[] = [];
    let fixed = 0;
    let failed = 0;

    // Filter issues that can be auto-fixed
    const fixableIssues = issues.filter(issue => 
      issue.type === 'hardcoded-color' && 
      this.fixMappings[issue.originalText]
    );

    if (fixableIssues.length === 0) {
      return { fixed: 0, failed: 0, details: ['No auto-fixable issues found'] };
    }

    try {
      // Prepare fixes for API
      const fixes = fixableIssues.map(issue => ({
        filePath: issue.file,
        originalText: issue.originalText,
        suggestedText: issue.suggestedText
      }));

      // Call the API to apply fixes
      const response = await fetch('/api/fix-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fixes }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const { results } = await response.json();

      // Process results
      for (const result of results) {
        if (result.success) {
          fixed += result.changes;
          fixDetails.push(`✅ Fixed ${result.changes} issues in ${result.filePath}`);
          if (result.backupPath) {
            fixDetails.push(`   📁 Backup created: ${result.backupPath}`);
          }
        } else {
          failed++;
          fixDetails.push(`❌ Failed to fix ${result.filePath}: ${result.error}`);
        }
      }

    } catch (error) {
      failed++;
      fixDetails.push(`❌ API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { fixed, failed, details: fixDetails };
  }

  // Helper method to write file content (placeholder for real implementation)
  private async writeFileContent(filePath: string, content: string): Promise<void> {
    // In a real implementation, this would write to the actual file system
    console.log(`Would write to ${filePath}:`, content.substring(0, 100) + '...');
  }
}

export const colorAuditor = new ColorAuditor();
