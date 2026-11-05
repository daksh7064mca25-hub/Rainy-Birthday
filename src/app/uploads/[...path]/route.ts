import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getMimeType(filePath: string, buffer?: Buffer): string {
  // If buffer is available or we read first bytes, check magic bytes first
  if (buffer && buffer.length >= 4) {
    // MP3 with ID3 header: 0x49 0x44 0x33 ('ID3')
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return 'audio/mpeg';
    }
    // MP3 frame sync: 0xFF followed by 0xFB, 0xF3, or 0xF2
    if (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xf3 || buffer[1] === 0xf2)) {
      return 'audio/mpeg';
    }
    // JPEG: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    // PNG: 0x89 'PNG'
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }
    // WebP / RIFF: 0x52 0x49 0x46 0x46 ('RIFF')
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      return 'image/webp';
    }
    // MP4: ftyp in bytes 4..7
    if (buffer.length >= 8 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
      return 'video/mp4';
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.heic' || ext === '.heif') return 'image/heic';
  if (ext === '.mp4' || ext === '.m4v') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';

  return 'image/jpeg';
}

function sniffFileMime(filePath: string): string {
  try {
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(16);
    fs.readSync(fd, header, 0, 16, 0);
    fs.closeSync(fd);
    return getMimeType(filePath, header);
  } catch {
    return getMimeType(filePath);
  }
}

function serveFileResponse(filePath: string, mime: string, req: NextRequest) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get('range');

  // Video HTTP Range streaming support for smooth playback and seeking
  if (range && (mime.startsWith('video/') || mime.startsWith('audio/'))) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fd = fs.openSync(filePath, 'r');
    const chunkBuffer = Buffer.alloc(chunkSize);
    fs.readSync(fd, chunkBuffer, 0, chunkSize, start);
    fs.closeSync(fd);

    return new NextResponse(chunkBuffer, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const rawSegments = params?.path || [];
    const requestedPath = rawSegments.join('/');

    // Security check: prevent directory traversal
    const safePath = path
      .normalize(requestedPath)
      .replace(/^(\.\.(\/|\\|$))+/, '');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const targetFile = path.join(uploadsDir, safePath);

    // 1. Direct match
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
      const mime = sniffFileMime(targetFile);

      // Check if client supports WebP and an optimized .webp version exists
      const acceptsWebP = req.headers.get('accept')?.includes('image/webp');
      if (acceptsWebP && (mime === 'image/jpeg' || mime === 'image/png')) {
        const webpAlternative = targetFile.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        if (fs.existsSync(webpAlternative)) {
          return serveFileResponse(webpAlternative, 'image/webp', req);
        }
      }

      // If it's a raw HEIC file, check if a converted .jpg or .webp exists alongside it
      if (mime === 'image/heic') {
        const baseName = safePath.replace(/\.(heic|heif)$/i, '');
        const convertedWebp = path.join(uploadsDir, `${baseName}.webp`);
        if (acceptsWebP && fs.existsSync(convertedWebp)) {
          return serveFileResponse(convertedWebp, 'image/webp', req);
        }
        const convertedJpg = path.join(uploadsDir, `${baseName}.jpg`);
        if (fs.existsSync(convertedJpg)) {
          return serveFileResponse(convertedJpg, 'image/jpeg', req);
        } else {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const convert = require('heic-convert');
            const fileBuffer = fs.readFileSync(targetFile);
            const converted = await convert({
              buffer: fileBuffer,
              format: 'JPEG',
              quality: 0.9,
            });
            fs.writeFileSync(convertedJpg, Buffer.from(converted));
            return serveFileResponse(convertedJpg, 'image/jpeg', req);
          } catch (e) {
            console.error('On-the-fly HEIC conversion error:', e);
          }
        }
      }

      return serveFileResponse(targetFile, mime, req);
    }

    // 2. Candidate fallbacks (e.g. extension differences or converted versions)
    const candidates = [
      `${safePath}.jpg`,
      `${safePath}.jpeg`,
      `${safePath}.png`,
      `${safePath}.webp`,
      `${safePath}.mp4`,
      `${safePath}.webm`,
      safePath.replace(/_heic$/i, '.jpg'),
      safePath.replace(/_heic$/i, '.HEIC'),
      safePath.replace(/\.heic$/i, '.jpg'),
    ];

    for (const cand of candidates) {
      const candPath = path.join(uploadsDir, cand);
      if (fs.existsSync(candPath) && fs.statSync(candPath).isFile()) {
        const mime = getMimeType(candPath);
        return serveFileResponse(candPath, mime, req);
      }
    }

    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  } catch (err) {
    console.error('Upload serving error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
