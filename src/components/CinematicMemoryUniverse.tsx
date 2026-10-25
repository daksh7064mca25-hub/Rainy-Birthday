'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MemoryItem } from '@/types/content';
import { isVideoUrl, getValidPosterUrl, getPlayableVideoUrl } from '@/lib/videoUtils';
import {
  Sparkles,
  Calendar,
  MapPin,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Film,
  Camera,
  Star,
  Clock,
} from 'lucide-react';

interface CinematicMemoryUniverseProps {
  title?: string;
  subtitle?: string;
  finalQuote?: string;
  memories: MemoryItem[];
}

// Background drifting cosmic particles
const DRIFTING_PARTICLES = [
  { top: '8%', left: '6%', size: 3, duration: 4.5, delay: 0 },
  { top: '22%', right: '8%', size: 3.5, duration: 5.2, delay: 1.2 },
  { top: '44%', left: '4%', size: 2.5, duration: 4.8, delay: 2.1 },
  { top: '68%', right: '6%', size: 3, duration: 5.4, delay: 0.6 },
  { top: '88%', left: '10%', size: 3.5, duration: 4.2, delay: 1.8 },
];

export default function CinematicMemoryUniverse({
  title = 'Every Little Moment, Forever Ours',
  subtitle = 'A thousand little moments, countless reasons to smile, and a lifetime of memories I want to keep with you.',
  finalQuote = "If I could relive a thousand moments, I'd still choose every one with you. ♡",
  memories = [],
}: CinematicMemoryUniverseProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedPhoto, setSelectedPhoto] = useState<MemoryItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<MemoryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Touch tracking for mobile swipe navigation in lightbox
  const touchStartX = useRef<number | null>(null);

  // Published memories sorted by order / starPosition
  const publishedMemories = useMemo(() => {
    return memories
      .filter((m) => m.published !== false)
      .sort((a, b) => (a.order || a.starPosition || 0) - (b.order || b.starPosition || 0));
  }, [memories]);

  // Extract unique collections
  const collections = useMemo(() => {
    const list = new Set<string>();
    publishedMemories.forEach((m) => {
      if (m.collection && m.collection.trim()) {
        list.add(m.collection.trim());
      }
    });
    return Array.from(list);
  }, [publishedMemories]);

  // Filtered memories based on collection tab
  const filteredMemories = useMemo(() => {
    if (activeFilter === 'all') return publishedMemories;
    return publishedMemories.filter((m) => m.collection === activeFilter);
  }, [publishedMemories, activeFilter]);

  // Lock scroll when lightbox or video player is active
  useEffect(() => {
    if (selectedPhoto || selectedVideo) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedPhoto, selectedVideo]);

  // Lightbox keyboard navigation & escape key
  const handlePhotoNav = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedPhoto) return;
      const photoMemories = publishedMemories.filter((m) => m.mediaType !== 'video');
      const idx = photoMemories.findIndex((m) => m.id === selectedPhoto.id);
      if (idx === -1) return;

      if (direction === 'prev') {
        const nextIdx = idx > 0 ? idx - 1 : photoMemories.length - 1;
        setSelectedPhoto(photoMemories[nextIdx]);
      } else {
        const nextIdx = idx < photoMemories.length - 1 ? idx + 1 : 0;
        setSelectedPhoto(photoMemories[nextIdx]);
      }
    },
    [selectedPhoto, publishedMemories]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
        setSelectedVideo(null);
      } else if (e.key === 'ArrowLeft' && selectedPhoto) {
        handlePhotoNav('prev');
      } else if (e.key === 'ArrowRight' && selectedPhoto) {
        handlePhotoNav('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, selectedVideo, handlePhotoNav]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 45) {
      handlePhotoNav('prev');
    } else if (deltaX < -45) {
      handlePhotoNav('next');
    }
    touchStartX.current = null;
  };

  return (
    <section
      id="universe"
      aria-label="Every Little Moment, Forever Ours"
      style={{
        position: 'relative',
        paddingTop: '28px',
        paddingBottom: '60px',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(700px, 92vw)',
          height: '420px',
          background:
            'radial-gradient(circle, rgba(226, 88, 127, 0.1) 0%, rgba(243, 207, 122, 0.06) 40%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating Golden Particles */}
      {!shouldReduceMotion &&
        DRIFTING_PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.15, 0.75, 0.15],
              scale: [0.8, 1.2, 0.8],
              y: [0, -8, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              top: p.top,
              left: p.left,
              right: p.right,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: '#f3cf7a',
              boxShadow: '0 0 8px rgba(243, 207, 122, 0.8)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

      {/* Compact Chapter Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          textAlign: 'center',
          marginBottom: '18px',
          position: 'relative',
          zIndex: 1,
          padding: '0 16px',
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '4px',
            fontWeight: 600,
          }}
        >
          <Sparkles size={12} color="var(--color-gold)" />
          <span>CHAPTER 2 · OUR MEMORIES</span>
        </span>

        <h2
          className="gold-gradient-text"
          style={{
            fontSize: 'clamp(1.65rem, 4.6vw, 2.3rem)',
            marginBottom: '6px',
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)',
            lineHeight: 1.5,
            maxWidth: '520px',
            margin: '0 auto',
          }}
        >
          {subtitle}
        </p>

        {/* Refined Compact Collection Filter Buttons */}
        {collections.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '12px',
            }}
          >
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.74rem',
                border:
                  activeFilter === 'all'
                    ? '1px solid var(--color-gold)'
                    : '1px solid rgba(243, 207, 122, 0.22)',
                background:
                  activeFilter === 'all' ? 'rgba(243, 207, 122, 0.2)' : 'rgba(18, 14, 26, 0.7)',
                color: activeFilter === 'all' ? 'var(--color-gold)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: activeFilter === 'all' ? 600 : 400,
              }}
            >
              All Moments ({publishedMemories.length})
            </button>
            {collections.map((col) => {
              const count = publishedMemories.filter((m) => m.collection === col).length;
              return (
                <button
                  key={col}
                  onClick={() => setActiveFilter(col)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    border:
                      activeFilter === col
                        ? '1px solid var(--color-gold)'
                        : '1px solid rgba(243, 207, 122, 0.22)',
                    background:
                      activeFilter === col ? 'rgba(243, 207, 122, 0.2)' : 'rgba(18, 14, 26, 0.7)',
                    color: activeFilter === col ? 'var(--color-gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: activeFilter === col ? 600 : 400,
                  }}
                >
                  {col} ({count})
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Dense Cinematic Collage Wall */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1420px',
          margin: '0 auto',
          padding: '0 8px',
        }}
      >
        {filteredMemories.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: 'rgba(18, 14, 26, 0.6)',
              borderRadius: '16px',
              border: '1px dashed rgba(243, 207, 122, 0.25)',
              margin: '20px 0',
            }}
          >
            <Camera size={32} color="var(--color-gold)" style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
            <p style={{ color: 'var(--color-champagne)', fontSize: '0.9rem' }}>
              No memories found in this collection filter.
            </p>
          </div>
        ) : (
          <div className="dense-collage-wall">
            {filteredMemories.map((mem, index) => (
              <CollageTile
                key={mem.id}
                memory={mem}
                index={index}
                shouldReduceMotion={shouldReduceMotion}
                hasError={!!imageErrors[mem.id]}
                onError={() => setImageErrors((prev) => ({ ...prev, [mem.id]: true }))}
                onOpenPhoto={() => setSelectedPhoto(mem)}
                onOpenVideo={() => setSelectedVideo(mem)}
              />
            ))}
          </div>
        )}

        {/* Compact Final Romantic Closing Card */}
        {finalQuote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              marginTop: '32px',
              padding: '20px 18px',
              textAlign: 'center',
              borderRadius: '18px',
              background: 'linear-gradient(180deg, rgba(26, 18, 36, 0.8) 0%, rgba(14, 11, 24, 0.9) 100%)',
              border: '1px solid rgba(243, 207, 122, 0.3)',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(226, 88, 127, 0.12)',
              backdropFilter: 'blur(16px)',
              maxWidth: '680px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(243, 207, 122, 0.12)',
                border: '1px solid rgba(243, 207, 122, 0.3)',
                borderRadius: '9999px',
                padding: '4px 14px',
                fontSize: '0.7rem',
                color: 'var(--color-gold)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              <Heart size={11} color="var(--color-rose)" fill="var(--color-rose)" />
              <span>THE CENTER OF MY UNIVERSE</span>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.05rem, 3.2vw, 1.35rem)',
                fontStyle: 'italic',
                color: 'var(--color-champagne)',
                lineHeight: 1.55,
                margin: '0 auto 8px auto',
                textShadow: '0 0 15px rgba(243, 207, 122, 0.25)',
              }}
            >
              &ldquo;{finalQuote}&rdquo;
            </p>

            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--color-blush)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Forever With You
            </span>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal for Photographs with Touch/Swipe Navigation */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'radial-gradient(circle at 50% 30%, rgba(32, 12, 26, 0.96) 0%, rgba(9, 10, 20, 0.98) 80%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'max(14px, env(safe-area-inset-top, 14px)) 14px max(16px, env(safe-area-inset-bottom, 16px)) 14px',
              boxSizing: 'border-box',
              overflowY: 'auto',
            }}
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.94, y: 14, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 14, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '560px',
                background: 'linear-gradient(165deg, rgba(26, 18, 34, 0.98) 0%, rgba(13, 11, 20, 0.98) 100%)',
                border: '1.5px solid rgba(243, 207, 122, 0.45)',
                borderRadius: '22px',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 35px rgba(226, 88, 127, 0.25)',
                overflow: 'hidden',
                position: 'relative',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header with Close Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(243, 207, 122, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={14} color="var(--color-gold)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                    {selectedPhoto.collection || 'Our Memories'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="btn-icon"
                  style={{ width: '36px', height: '36px', color: 'var(--color-champagne)' }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Photo & Story */}
              <div
                style={{
                  overflowY: 'auto',
                  padding: '14px 16px 20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Centerpiece Image Container with Swipe Detection */}
                <div
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: '#100c16',
                    border: '1px solid rgba(243, 207, 122, 0.28)',
                    maxHeight: '52vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.title}
                    style={{
                      width: '100%',
                      maxHeight: '52vh',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />

                  {/* Prev / Next Navigation Buttons */}
                  <button
                    onClick={() => handlePhotoNav('prev')}
                    aria-label="Previous photo"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '8px',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(15, 12, 25, 0.85)',
                      border: '1px solid rgba(243, 207, 122, 0.35)',
                      color: 'var(--color-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={() => handlePhotoNav('next')}
                    aria-label="Next photo"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '8px',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(15, 12, 25, 0.85)',
                      border: '1px solid rgba(243, 207, 122, 0.35)',
                      color: 'var(--color-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {selectedPhoto.date && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.76rem',
                        color: 'var(--color-gold)',
                      }}
                    >
                      <Calendar size={12} color="var(--color-gold)" />
                      {selectedPhoto.date}
                    </span>
                  )}
                  {selectedPhoto.location && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.76rem',
                        color: 'var(--color-rose)',
                      }}
                    >
                      <MapPin size={12} color="var(--color-rose)" />
                      {selectedPhoto.location}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-champagne)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {selectedPhoto.title}
                </h3>

                {/* Handwritten Polaroid Caption */}
                {selectedPhoto.caption && (
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '0.94rem',
                      fontStyle: 'italic',
                      color: 'var(--color-blush)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    &ldquo;{selectedPhoto.caption}&rdquo;
                  </p>
                )}

                {/* Full Backstory */}
                {selectedPhoto.fullStory && (
                  <div
                    style={{
                      borderTop: '1px solid rgba(243, 207, 122, 0.15)',
                      paddingTop: '10px',
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {selectedPhoto.fullStory}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic HTML5 Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedVideo(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(5, 4, 10, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '720px',
                background: '#130d1e',
                border: '1.5px solid rgba(243, 207, 122, 0.4)',
                borderRadius: '22px',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(226, 88, 127, 0.28)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderBottom: '1px solid rgba(243, 207, 122, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Film size={14} color="var(--color-gold)" />
                  <span style={{ fontSize: '0.84rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                    {selectedVideo.title}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="btn-icon"
                  style={{ width: '36px', height: '36px', color: 'var(--color-champagne)' }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Video Player */}
              <div style={{ width: '100%', background: '#000000', maxHeight: '62vh', overflow: 'hidden', position: 'relative' }}>
                <video
                  src={getPlayableVideoUrl(selectedVideo) || selectedVideo.videoUrl || selectedVideo.imageUrl}
                  poster={getValidPosterUrl(selectedVideo) || undefined}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxHeight: '62vh',
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </div>

              {/* Video Caption & Story */}
              <div style={{ padding: '14px 18px 18px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedVideo.caption && (
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '0.94rem',
                      fontStyle: 'italic',
                      color: 'var(--color-blush)',
                      margin: 0,
                    }}
                  >
                    &ldquo;{selectedVideo.caption}&rdquo;
                  </p>
                )}
                {selectedVideo.fullStory && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {selectedVideo.fullStory}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Subcomponent: Compact Collage Tile
interface CollageTileProps {
  memory: MemoryItem;
  index: number;
  shouldReduceMotion: boolean | null;
  hasError: boolean;
  onError: () => void;
  onOpenPhoto: () => void;
  onOpenVideo: () => void;
}

function getAspectClass(mem: MemoryItem, idx: number): string {
  if (mem.aspect === 'tall') return 'tile-aspect-tall';
  if (mem.aspect === 'wide') return 'tile-aspect-wide';
  if (mem.aspect === 'landscape') return 'tile-aspect-landscape';
  if (mem.aspect === 'square') return 'tile-aspect-square';
  if (mem.aspect === 'portrait') return 'tile-aspect-portrait';
  if (mem.displaySize === 'large' || mem.displaySize === 'full') return 'tile-aspect-wide';
  if (mem.displaySize === 'small') return 'tile-aspect-square';

  // Natural organic Pinterest mosaic pattern
  const pattern = [
    'tile-aspect-portrait',
    'tile-aspect-square',
    'tile-aspect-tall',
    'tile-aspect-landscape',
    'tile-aspect-portrait',
    'tile-aspect-wide',
  ];
  return pattern[idx % pattern.length];
}

function CollageTile({
  memory,
  index,
  shouldReduceMotion,
  hasError,
  onError,
  onOpenPhoto,
  onOpenVideo,
}: CollageTileProps) {
  const isVideo =
    memory.mediaType === 'video' ||
    isVideoUrl(memory.videoUrl) ||
    isVideoUrl(memory.imageUrl);
  const aspectClass = getAspectClass(memory, index);
  const posterUrl = getValidPosterUrl(memory);
  const videoUrl = getPlayableVideoUrl(memory);

  // Subtle natural tilt for occasional tiles (-1.2deg to +1.2deg)
  const rotationDeg = !shouldReduceMotion && (index % 7 === 1 ? -1.2 : index % 7 === 4 ? 1.2 : 0);

  const handleClick = () => {
    if (isVideo) {
      onOpenVideo();
    } else {
      onOpenPhoto();
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.38, delay: (index % 6) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={`collage-tile ${aspectClass}`}
      style={{
        transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {hasError ? (
        isVideo ? (
          <div className="collage-video-fallback">
            <div className="collage-video-fallback-icon">
              <Play size={18} fill="var(--color-gold)" color="var(--color-gold)" />
            </div>
            <span className="collage-video-fallback-label">Watch memory</span>
          </div>
        ) : (
          <div className="collage-fallback-placeholder">
            <Camera size={24} color="var(--color-gold)" style={{ opacity: 0.6 }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-blush)', marginTop: '4px' }}>
              {memory.title || 'Memory'}
            </span>
          </div>
        )
      ) : isVideo ? (
        <>
          {posterUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={posterUrl}
              alt={memory.title}
              loading="lazy"
              onError={onError}
              className="collage-tile-media"
            />
          ) : videoUrl ? (
            <video
              src={`${videoUrl}#t=0.5`}
              preload="metadata"
              muted
              playsInline
              onError={onError}
              className="collage-tile-media"
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                display: 'block',
              }}
            />
          ) : (
            <div className="collage-video-fallback">
              <div className="collage-video-fallback-icon">
                <Play size={18} fill="var(--color-gold)" color="var(--color-gold)" />
              </div>
              <span className="collage-video-fallback-label">Watch memory</span>
            </div>
          )}

          {/* Subtle Centered Play Overlay */}
          <div className="collage-video-center-play">
            <div className="collage-play-circle">
              <Play size={16} fill="var(--color-gold)" color="var(--color-gold)" style={{ marginLeft: '2px' }} />
            </div>
          </div>

          {/* Video Duration Badge */}
          <div className="collage-video-badge">
            <Play size={10} fill="var(--color-gold)" color="var(--color-gold)" />
            <span>{memory.videoDuration || 'VIDEO'}</span>
          </div>
        </>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={memory.imageUrl}
          alt={memory.title}
          loading="lazy"
          onError={onError}
          className="collage-tile-media"
        />
      )}

      {/* Featured Star Badge */}
      {memory.featured && (
        <div className="collage-star-badge" title="Featured Memory">
          <Star size={11} fill="var(--color-gold)" color="var(--color-gold)" />
        </div>
      )}

      {/* Elegant Hover Overlay with Title, Short Caption & Heart Indicator */}
      <div className="collage-tile-overlay">
        <h4 className="collage-overlay-title">{memory.title}</h4>
        {memory.caption && <p className="collage-overlay-caption">&ldquo;{memory.caption}&rdquo;</p>}
        <div className="collage-overlay-meta">
          <span>{memory.date || memory.location || 'Special moment'}</span>
          <Heart size={11} color="var(--color-rose-glow)" fill="var(--color-rose-glow)" />
        </div>
      </div>
    </motion.div>
  );
}
