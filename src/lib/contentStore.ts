import fs from 'fs';
import path from 'path';
import { SiteContent } from '@/types/content';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'content.json');

export function getContent(): SiteContent {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(data) as SiteContent;
    }
  } catch (error) {
    console.error('Error reading content file:', error);
  }
  // Return a fallback structure if file read fails
  throw new Error('Could not read content data file');
}

export function saveContent(updatedContent: SiteContent): boolean {
  try {
    const tempPath = `${DATA_FILE_PATH}.tmp`;
    const serialized = JSON.stringify(updatedContent, null, 2);
    
    // Ensure parent directory exists
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to temporary file first for atomic safety
    fs.writeFileSync(tempPath, serialized, 'utf-8');
    fs.renameSync(tempPath, DATA_FILE_PATH);
    return true;
  } catch (error) {
    console.error('Error writing content file:', error);
    return false;
  }
}
