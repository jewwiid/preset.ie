import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

async function findTsxFiles(dir: string, baseDir: string = ''): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(baseDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .next, and other build directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
          const subFiles = await findTsxFiles(fullPath, relativePath);
          files.push(...subFiles);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.warn(`Could not read directory ${dir}:`, error);
  }
  
  return files;
}

export async function GET() {
  try {
    const projectRoot = process.cwd();
    const appsWebDir = path.join(projectRoot, 'apps/web');
    
    // Check if apps/web directory exists
    try {
      await fs.access(appsWebDir);
    } catch {
      return NextResponse.json({ 
        error: 'apps/web directory not found',
        files: []
      });
    }
    
    // Find all TypeScript/TSX files
    const files = await findTsxFiles(appsWebDir);
    
    // Filter to only include relevant files (exclude API routes, config files, etc.)
    const relevantFiles = files.filter(file => 
      !file.includes('/api/') &&
      !file.includes('/node_modules/') &&
      !file.includes('.config.') &&
      !file.includes('.d.ts') &&
      (file.includes('/app/') || file.includes('/components/'))
    );
    
    return NextResponse.json({ 
      files: relevantFiles,
      total: relevantFiles.length,
      scanned: 'apps/web directory'
    });
    
  } catch (error) {
    console.error('Scan files API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to scan files',
        files: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
