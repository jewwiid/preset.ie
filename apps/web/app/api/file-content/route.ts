import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
    const projectRoot = process.cwd();
    const fullPath = path.join(projectRoot, filePath);
    
    // Security check: ensure the path is within the project
    if (!fullPath.startsWith(projectRoot)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
    }
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read file content
    const content = await fs.readFile(fullPath, 'utf-8');
    
    return NextResponse.json({ 
      content,
      filePath,
      size: content.length,
      lastModified: (await fs.stat(fullPath)).mtime
    });
    
  } catch (error) {
    console.error('File content API error:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}
