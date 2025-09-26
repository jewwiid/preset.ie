import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Color fix mappings
const fixMappings: Record<string, string> = {
  // Background colors
  'bg-blue-500': 'bg-primary',
  'bg-blue-600': 'bg-primary',
  'bg-blue-400': 'bg-primary',
  'bg-green-500': 'bg-primary',
  'bg-green-600': 'bg-primary',
  'bg-green-400': 'bg-primary',
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
  'text-green-500': 'text-primary',
  'text-green-600': 'text-primary',
  'text-green-400': 'text-primary',
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
  'border-green-500': 'border-primary',
  'border-green-600': 'border-primary',
  'border-red-500': 'border-destructive',
  'border-red-600': 'border-destructive',
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-400': 'border-border',
  'border-gray-500': 'border-border',
  'border-white': 'border-border',
  'border-black': 'border-border',
};

interface FixRequest {
  filePath: string;
  originalText: string;
  suggestedText: string;
}

export async function POST(request: NextRequest) {
  try {
    const { fixes }: { fixes: FixRequest[] } = await request.json();
    
    if (!fixes || !Array.isArray(fixes)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const results = [];
    const projectRoot = process.cwd();
    
    for (const fix of fixes) {
      try {
        const fullPath = path.join(projectRoot, fix.filePath);
        
        // Check if file exists
        try {
          await fs.access(fullPath);
        } catch {
          results.push({
            filePath: fix.filePath,
            success: false,
            error: 'File not found'
          });
          continue;
        }
        
        // Read file content
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Create backup
        const backupPath = `${fullPath}.backup.${Date.now()}`;
        await fs.writeFile(backupPath, content, 'utf-8');
        
        // Apply fix
        const regex = new RegExp(fix.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const modifiedContent = content.replace(regex, fix.suggestedText);
        
        // Write modified content
        await fs.writeFile(fullPath, modifiedContent, 'utf-8');
        
        results.push({
          filePath: fix.filePath,
          success: true,
          backupPath: backupPath,
          changes: (content.match(regex) || []).length
        });
        
      } catch (error) {
        results.push({
          filePath: fix.filePath,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({ results });
    
  } catch (error) {
    console.error('Fix colors API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Color fix API endpoint',
    supportedMappings: Object.keys(fixMappings).length,
    mappings: fixMappings
  });
}
