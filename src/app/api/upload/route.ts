import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SESSION_SECRET = 'aether-love-secret-token-2026';
const MAX_IMAGE_SIZE_BYTES = 35 * 1024 * 1024; // 35 MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

function isHeicBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const ftyp = buffer.toString('ascii', 4, 8);
  if (ftyp !== 'ftyp') return false;

  const brand = buffer.toString('ascii', 8, 12).toLowerCase();
  const compatibleBrands = ['heic', 'heix', 'heim', 'heis', 'mif1', 'msf1', 'hevc', 'hevx'];
  return compatibleBrands.includes(brand);
}

function detectImageExtension(buffer: Buffer, originalExt: string): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return '.jpg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return '.png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return '.webp';
  }
  if (
    buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    return '.gif';
  }

  const cleanExt = originalExt.toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(cleanExt)) {
    return cleanExt === '.jpeg' ? '.jpg' : cleanExt;
  }

  return '.jpg';
}

function isVideoFile(fileName: string, mimeType: string): boolean {
  const ext = path.extname(fileName || '').toLowerCase();
  const videoExts = ['.mp4', '.webm', '.mov', '.m4v', '.ogg'];
  if (videoExts.includes(ext)) return true;
  if (mimeType.toLowerCase().startsWith('video/')) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Check
    const token = req.cookies.get('aether_admin_token')?.value;
    if (token !== SESSION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized. Please log in as admin.' }, { status: 401 });
    }

    // 2. Parse FormData for single or multiple files
    const formData = await req.formData();
    const filesToProcess: File[] = [];

    const allFiles = formData.getAll('files') as File[];
    if (allFiles && allFiles.length > 0) {
      filesToProcess.push(...allFiles);
    }

    const singleFiles = formData.getAll('file') as File[];
    if (singleFiles && singleFiles.length > 0) {
      for (const f of singleFiles) {
        if (!filesToProcess.includes(f)) {
          filesToProcess.push(f);
        }
      }
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: 'No media file provided in request' }, { status: 400 });
    }

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const processedResults: Array<{
      url: string;
      filename: string;
      size: number;
      format: string;
      mediaType: 'photo' | 'video';
      isConvertedHeic: boolean;
      originalName: string;
    }> = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      if (!file || typeof file.arrayBuffer !== 'function') continue;

      const rawExt = path.extname(file.name || '');
      const isVideo = isVideoFile(file.name, file.type);
      const maxAllowedSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

      if (file.size > maxAllowedSize) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the maximum allowed limit of ${isVideo ? '100MB' : '35MB'}` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      let buffer = Buffer.from(bytes);
      if (buffer.length === 0) continue;

      let finalExt = isVideo ? (rawExt.toLowerCase() === '.webm' ? '.webm' : '.mp4') : '.jpg';
      let isConvertedHeic = false;

      if (isVideo) {
        finalExt = rawExt.toLowerCase() === '.webm' ? '.webm' : '.mp4';
      } else {
        const isHeicByName = /\.(heic|heif)$/i.test(file.name) || /_heic$/i.test(file.name);
        const isHeicByType =
          file.type.toLowerCase().includes('heic') || file.type.toLowerCase().includes('heif');
        const isHeicByBytes = isHeicBuffer(buffer);

        if (isHeicByName || isHeicByType || isHeicByBytes) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const convert = require('heic-convert');
            const converted = await convert({
              buffer,
              format: 'JPEG',
              quality: 0.92,
            });
            buffer = Buffer.from(converted);
            finalExt = '.jpg';
            isConvertedHeic = true;
          } catch (convErr: any) {
            console.warn('HEIC conversion warning, falling back:', convErr);
            finalExt = '.jpg';
          }
        } else {
          finalExt = detectImageExtension(buffer, rawExt);
        }
      }

      const baseName = path
        .basename(file.name || (isVideo ? 'video_memory' : 'photograph'), rawExt)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 50);

      const timestamp = Date.now() + i;
      const cleanFileName = `${timestamp}-${baseName}${finalExt}`;
      const filePath = path.join(uploadsDir, cleanFileName);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${cleanFileName}`;

      processedResults.push({
        url: publicUrl,
        filename: cleanFileName,
        size: buffer.length,
        format: finalExt.replace('.', ''),
        mediaType: isVideo ? 'video' : 'photo',
        isConvertedHeic,
        originalName: file.name,
      });
    }

    if (processedResults.length === 0) {
      return NextResponse.json({ error: 'No valid files could be processed' }, { status: 400 });
    }

    const first = processedResults[0];
    return NextResponse.json({
      success: true,
      url: first.url,
      filename: first.filename,
      size: first.size,
      format: first.format,
      mediaType: first.mediaType,
      isConvertedHeic: first.isConvertedHeic,
      files: processedResults,
      count: processedResults.length,
    });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error occurred during media upload' },
      { status: 500 }
    );
  }
}
