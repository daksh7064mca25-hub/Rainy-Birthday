'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryItem } from '@/types/content';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  MapPin,
  Heart,
  ImageIcon,
} from 'lucide-react';

interface MemoryPhotoRevealProps {
  memory: MemoryItem | null;
  memories: MemoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMemory: (memory: MemoryItem) => void;
}

export default function MemoryPhotoReveal({
  memory,
  memories,
  isOpen,
  onClose,
  onSelectMemory,
}: MemoryPhotoRevealProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Filter memories to published list
  const activeMemories = memories.filter((m) => m.published !== false);
  const currentIndex = memory
    ? activeMemories.findIndex((m) => m.id === memory.id)
    : -1;
  const totalCount = activeMemories.length;

  // Handle navigation
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setImageLoaded(false);
      setImageError(false);
      onSelectMemory(activeMemories[currentIndex - 1]);
    } else if (totalCount > 1) {
      // Wrap to end
      setImageLoaded(false);
      setImageError(false);
      onSelectMemory(activeMemories[totalCount - 1]);
    }
  }, [currentIndex, totalCount, activeMemories, onSelectMemory]);

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < totalCount - 1) {
      setImageLoaded(false);
      setImageError(false);
      onSelectMemory(activeMemories[currentIndex + 1]);
    } else if (totalCount > 1) {
      // Wrap to beginning
      setImageLoaded(false);
      setImageError(false);
      onSelectMemory(activeMemories[0]);
    }
  }, [currentIndex, totalCount, activeMemories, onSelectMemory]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Focus close button for accessibility
      setTimeout(() => closeBtnRef.current?.focus(), 100);

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Reset image state when memory changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [memory?.id]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  const starNumber = memory?.starPosition || (currentIndex >= 0 ? currentIndex + 1 : 1);

  return (
    <AnimatePresence>
      {isOpen && memory && (
        <motion.div
          key={memory.id}
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-photo-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'radial-gradient(circle at 50% 30%, rgba(35, 12, 28, 0.94) 0%, rgba(9, 10, 20, 0.98) 75%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'max(14px, env(safe-area-inset-top, 14px)) 16px max(18px, env(safe-area-inset-bottom, 18px)) 16px',
            boxSizing: 'border-box',
            overflowY: 'auto',
          }}
        >
        {/* Subtle Ambient Starlight Orbs behind modal */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(243, 207, 122, 0.16) 0%, rgba(226, 88, 127, 0.12) 50%, transparent 70%)',
            filter: 'blur(45px)',
            pointerEvents: 'none',
          }}
        />

        {/* Modal Window Container */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.88, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '430px',
            background: 'linear-gradient(165deg, rgba(28, 20, 36, 0.96) 0%, rgba(14, 12, 22, 0.98) 100%)',
            border: '1.5px solid rgba(243, 207, 122, 0.45)',
            borderRadius: '24px',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 35px rgba(226, 88, 127, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            maxHeight: '92vh',
          }}
        >
          {/* Header Bar: Constellation Star Tag & Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px 10px 18px',
              borderBottom: '1px solid rgba(243, 207, 122, 0.15)',
              zIndex: 10,
            }}
          >
            {/* Star badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(243, 207, 122, 0.14)',
                border: '1px solid rgba(243, 207, 122, 0.35)',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontSize: '0.75rem',
                color: 'var(--color-gold)',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              <Sparkles size={12} color="var(--color-gold)" />
              <span>Constellation Star {starNumber} of {totalCount}</span>
            </div>

            {/* Accessible Thumb-Friendly Close Button */}
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="btn-icon"
              aria-label="Close photo reveal"
              style={{
                width: '42px',
                height: '42px',
                minWidth: '42px',
                minHeight: '42px',
                background: 'rgba(30, 22, 40, 0.9)',
                border: '1px solid rgba(243, 207, 122, 0.4)',
                color: 'var(--color-champagne)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div
            style={{
              overflowY: 'auto',
              padding: '16px 18px 20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* The Centerpiece Photograph */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: memory.aspect === 'landscape' ? '16/10' : '4/5',
                maxHeight: '46vh',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'radial-gradient(circle, #251329 0%, #0c0812 100%)',
                border: '1.5px solid rgba(243, 207, 122, 0.35)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 24px rgba(226, 88, 127, 0.25)',
              }}
            >
              {/* Loading Shimmer / Skeleton */}
              {!imageLoaded && !imageError && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1c1528 0%, #291a35 50%, #1c1528 100%)',
                    gap: '8px',
                  }}
                >
                  <div className="animate-pulse-glow">
                    <Sparkles size={28} color="var(--color-gold)" />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-blush)', letterSpacing: '0.04em' }}>
                    Revealing Star Memory...
                  </span>
                </div>
              )}

              {/* Graceful Fallback if image fails to load */}
              {imageError ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle, #3d142b 0%, #130a1c 100%)',
                    padding: '20px',
                    textAlign: 'center',
                    gap: '10px',
                  }}
                >
                  <ImageIcon size={38} color="var(--color-gold)" />
                  <p style={{ color: 'var(--color-champagne)', fontSize: '0.85rem' }}>
                    Photograph safely stored in our memories
                  </p>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={memory.imageUrl}
                  alt={memory.title}
                  loading="eager"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.4s ease, transform 0.5s ease',
                    transform: imageLoaded ? 'scale(1)' : 'scale(1.04)',
                  }}
                />
              )}

              {/* Warm gradient vignette at the bottom of the photo */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 65%, rgba(14, 12, 22, 0.75) 100%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Navigation Arrows Floating on the Photo (Thumb reachable) */}
              {totalCount > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    aria-label="Previous star memory"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '10px',
                      transform: 'translateY(-50%)',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(15, 12, 25, 0.82)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(243, 207, 122, 0.35)',
                      color: 'var(--color-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 5,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    onClick={handleNext}
                    aria-label="Next star memory"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '10px',
                      transform: 'translateY(-50%)',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(15, 12, 25, 0.82)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(243, 207, 122, 0.35)',
                      color: 'var(--color-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 5,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Memory Metadata (Date & Location Badges) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {memory.date && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    color: 'var(--color-gold)',
                    fontWeight: 500,
                  }}
                >
                  <Calendar size={13} color="var(--color-gold)" />
                  {memory.date}
                </span>
              )}
              {memory.location && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <MapPin size={13} color="var(--color-rose)" />
                  {memory.location}
                </span>
              )}
            </div>

            {/* Memory Title */}
            <h2
              id="memory-photo-title"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.25rem, 4.5vw, 1.6rem)',
                color: 'var(--color-champagne)',
                lineHeight: 1.3,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {memory.title}
            </h2>

            {/* Personal Caption */}
            {memory.caption && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  color: 'var(--color-blush)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                &ldquo;{memory.caption}&rdquo;
              </p>
            )}

            {/* Full Story if available */}
            {memory.fullStory && memory.fullStory !== memory.caption && (
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  margin: 0,
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {memory.fullStory}
              </p>
            )}

            {/* Bottom Actions: Return to Constellation Button */}
            <div style={{ marginTop: '6px', display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                className="btn-romantic"
                style={{
                  flex: 1,
                  minHeight: '48px',
                  fontSize: '0.92rem',
                }}
              >
                <Heart size={16} fill="#ffffff" />
                <span>Keep in My Heart</span>
              </button>
            </div>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
