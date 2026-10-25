/**
 * Video Utilities for AETHER LOVE
 * Ensures video files are never passed to <img> tags, provides reliable URL resolution,
 * and handles client-side video thumbnail frame generation.
 */

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  // Match standard video file extensions with optional query strings
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url.trim());
}

/**
 * Returns a valid static image poster URL for a memory item, or null if only video URLs are present.
 * NEVER returns a video file (.mp4, etc.) as an image source.
 */
export function getValidPosterUrl(memory: {
  posterUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  mediaType?: string;
}): string | null {
  if (memory.posterUrl && !isVideoUrl(memory.posterUrl)) {
    return memory.posterUrl;
  }
  if (memory.thumbnailUrl && !isVideoUrl(memory.thumbnailUrl)) {
    return memory.thumbnailUrl;
  }
  if (memory.imageUrl && !isVideoUrl(memory.imageUrl) && memory.mediaType !== 'video') {
    return memory.imageUrl;
  }
  return null;
}

/**
 * Resolves the playable video URL for a memory item.
 */
export function getPlayableVideoUrl(memory: {
  videoUrl?: string;
  imageUrl?: string;
  mediaType?: string;
}): string | null {
  if (memory.videoUrl && (isVideoUrl(memory.videoUrl) || memory.mediaType === 'video')) {
    return memory.videoUrl;
  }
  if (memory.imageUrl && isVideoUrl(memory.imageUrl)) {
    return memory.imageUrl;
  }
  if (memory.mediaType === 'video' && memory.videoUrl) {
    return memory.videoUrl;
  }
  return null;
}

/**
 * Client-side video thumbnail generator using an off-screen HTML5 video and canvas.
 * Works seamlessly on all modern browsers (Chrome, Edge, Safari, iOS, Android).
 */
export function generateVideoThumbnail(
  source: File | string,
  targetTimeSeconds?: number
): Promise<{
  blob: Blob;
  dataUrl: string;
  duration: string;
  width: number;
  height: number;
  aspect: 'portrait' | 'landscape' | 'square' | 'tall';
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Thumbnail generation is only available in browser environments'));
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      video.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
    }

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      video.remove();
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Video thumbnail generation timed out after 12 seconds'));
    }, 12000);

    let durationStr = '0:00';

    video.onloadedmetadata = () => {
      const dur = video.duration || 0;
      const totalSec = Math.round(dur);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      // Choose a frame at targetTimeSeconds, or 15% of duration, avoiding black opening frame (minimum 0.3s)
      let seekTime = 0.5;
      if (targetTimeSeconds !== undefined && targetTimeSeconds >= 0) {
        seekTime = Math.min(targetTimeSeconds, Math.max(dur - 0.2, 0.1));
      } else if (dur > 0) {
        seekTime = Math.min(Math.max(dur * 0.15, 0.4), Math.max(dur - 0.3, 0.1));
      }

      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;

        let aspect: 'portrait' | 'landscape' | 'square' | 'tall' = 'landscape';
        const ratio = width / height;
        if (ratio < 0.65) {
          aspect = 'tall'; // 9:16 story/reel
        } else if (ratio < 0.9) {
          aspect = 'portrait'; // 3:4 portrait
        } else if (ratio >= 0.9 && ratio <= 1.15) {
          aspect = 'square'; // 1:1
        } else {
          aspect = 'landscape'; // 16:9 / 4:3
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return reject(new Error('Could not get 2D canvas context'));
        }

        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve({
                blob,
                dataUrl,
                duration: durationStr,
                width,
                height,
                aspect,
              });
            } else {
              reject(new Error('Failed to create JPEG Blob from canvas'));
            }
          },
          'image/jpeg',
          0.9
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error(`Failed to load video for thumbnail generation: ${video.error?.message || 'Unknown error'}`));
    };
  });
}
