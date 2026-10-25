'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, X, Sparkles, Heart, Play, BookOpen, Quote } from 'lucide-react';
import { MemoryItem } from '@/types/content';
import { isVideoUrl, getValidPosterUrl, getPlayableVideoUrl } from '@/lib/videoUtils';

interface PhotoMuseumProps {
  title: string;
  subtitle: string;
  memories: MemoryItem[];
}

export default function PhotoMuseum({ title, subtitle, memories }: PhotoMuseumProps) {
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);

  // Strictly select ONLY the 4 curated story memories
  const curatedStoryMemories = useMemo(() => {
    // 1. Pick memories explicitly marked for the Story Section
    const flagged = memories.filter(
      (m) => m.showInStorySection === true && m.published !== false
    );
    if (flagged.length === 4) return flagged;

    // 2. Supplement or select memories with heartfelt custom written stories (fullStory > 15 chars)
    const withCustomStory = memories.filter(
      (m) =>
        Boolean(m.fullStory && m.fullStory.trim().length > 15) &&
        m.published !== false &&
        !flagged.some((f) => f.id === m.id)
    );

    const combined = [...flagged, ...withCustomStory];
    if (combined.length >= 4) return combined.slice(0, 4);

    // 3. Fallback to curated mem-1 through mem-4
    const fallbackIds = ['mem-1', 'mem-2', 'mem-3', 'mem-4'];
    for (const id of fallbackIds) {
      if (combined.length >= 4) break;
      const found = memories.find(
        (m) => m.id === id && !combined.some((c) => c.id === m.id)
      );
      if (found) combined.push(found);
    }

    return combined.slice(0, 4);
  }, [memories]);

  return (
    <section
      id="museum"
      className="mobile-section"
      style={{
        paddingTop: '32px',
        paddingBottom: '80px',
        position: 'relative',
      }}
    >
      {/* Chapter Eyebrow & Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px', maxWidth: '680px', margin: '0 auto 36px auto', padding: '0 16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(243, 207, 122, 0.12)',
            border: '1px solid rgba(243, 207, 122, 0.3)',
            borderRadius: '9999px',
            padding: '4px 14px',
            marginBottom: '12px',
          }}
        >
          <Sparkles size={12} color="var(--color-gold)" />
          <span
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
              fontWeight: 600,
            }}
          >
            Chapter 3 &bull; Handpicked Moments
          </span>
        </div>

        <h2
          className="gold-gradient-text"
          style={{
            fontSize: 'clamp(1.7rem, 4.5vw, 2.35rem)',
            fontFamily: 'var(--font-serif)',
            letterSpacing: '-0.01em',
            marginBottom: '10px',
            lineHeight: 1.25,
          }}
        >
          {title || 'The Moments That Mean Everything'}
        </h2>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            margin: '0 auto',
            maxWidth: '540px',
          }}
        >
          {subtitle || 'Four chapters etched forever into my heart — in our own words.'}
        </p>
      </div>

      {/* 4 Distinct Curated Story Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '24px',
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 16px',
        }}
      >
        {curatedStoryMemories.map((memory, index) => {
          const isVideo =
            memory.mediaType === 'video' ||
            isVideoUrl(memory.videoUrl) ||
            isVideoUrl(memory.imageUrl);
          const poster = getValidPosterUrl(memory);
          const videoSrc = getPlayableVideoUrl(memory);

          return (
            <motion.article
              key={memory.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'linear-gradient(155deg, rgba(24, 18, 38, 0.85) 0%, rgba(13, 10, 22, 0.92) 100%)',
                border: '1px solid rgba(243, 207, 122, 0.24)',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
              }}
              whileHover={{
                y: -4,
                borderColor: 'rgba(243, 207, 122, 0.45)',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65), 0 0 25px rgba(226, 88, 127, 0.2)',
              }}
            >
              {/* Media Window */}
              <div
                onClick={() => setSelectedMemory(memory)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedMemory(memory);
                }}
                aria-label={`View story memory: ${memory.title}`}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '210px',
                  overflow: 'hidden',
                  background: '#0e0b17',
                  cursor: 'pointer',
                }}
              >
                {isVideo ? (
                  <>
                    {poster ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={poster}
                        alt={memory.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : videoSrc ? (
                      <video
                        src={`${videoSrc}#t=0.5`}
                        preload="metadata"
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          pointerEvents: 'none',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #231633 0%, #150e20 100%)',
                        }}
                      >
                        <Play size={28} color="var(--color-gold)" />
                      </div>
                    )}

                    {/* Subtle Play Circle Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'rgba(226, 88, 127, 0.88)',
                          border: '1.5px solid rgba(243, 207, 122, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingLeft: '3px',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        <Play size={16} fill="#ffffff" color="#ffffff" />
                      </div>
                    </div>
                  </>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={memory.imageUrl}
                    alt={memory.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}

                {/* Story Number Pill Top Left */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(12, 9, 20, 0.82)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(243, 207, 122, 0.4)',
                    borderRadius: '9999px',
                    padding: '3px 10px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--color-gold)',
                    letterSpacing: '0.08em',
                  }}
                >
                  STORY 0{index + 1}
                </div>

                {/* Location Badge Top Right */}
                {memory.location && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(12, 9, 20, 0.82)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(226, 88, 127, 0.35)',
                      borderRadius: '9999px',
                      padding: '3px 10px',
                      fontSize: '0.7rem',
                      color: 'var(--color-champagne)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MapPin size={11} color="var(--color-rose-glow)" />
                    <span>{memory.location}</span>
                  </div>
                )}
              </div>

              {/* Story Content Body */}
              <div
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                }}
              >
                {/* Date Row */}
                {memory.date && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.76rem',
                      color: 'var(--color-gold)',
                      fontWeight: 500,
                    }}
                  >
                    <Calendar size={12} color="var(--color-gold)" />
                    <span>{memory.date}</span>
                  </div>
                )}

                {/* Story Title */}
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.28rem',
                    color: 'var(--color-champagne)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {memory.title}
                </h3>

                {/* Personalized Caption */}
                {memory.caption && (
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '0.9rem',
                      fontStyle: 'italic',
                      color: 'var(--color-blush)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    &ldquo;{memory.caption}&rdquo;
                  </p>
                )}

                {/* Personal Story Text Box */}
                {memory.fullStory && (
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '12px 14px',
                      background: 'rgba(10, 8, 18, 0.6)',
                      borderLeft: '2.5px solid var(--color-gold)',
                      borderRadius: '0 10px 10px 0',
                      fontSize: '0.84rem',
                      color: '#d6cfdb',
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <Quote size={14} color="var(--color-gold)" style={{ opacity: 0.6, flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {memory.fullStory}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action button: Read & View */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedMemory(memory)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--color-gold)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <BookOpen size={13} />
                    <span>Read Full Story &bull; View Memory &rarr;</span>
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Detail Story Reader Lightbox */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMemory(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(6, 5, 12, 0.92)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom)) 16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '480px',
                maxHeight: '88vh',
                overflowY: 'auto',
                padding: '22px',
                position: 'relative',
                border: '1.5px solid rgba(243, 207, 122, 0.4)',
                borderRadius: '20px',
                background: 'linear-gradient(155deg, #181126 0%, #0d0817 100%)',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(226, 88, 127, 0.25)',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMemory(null)}
                className="btn-icon"
                aria-label="Close story"
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  zIndex: 10,
                  color: 'var(--color-champagne)',
                }}
              >
                <X size={18} />
              </button>

              {/* Media */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: selectedMemory.aspect === 'landscape' ? '16/10' : '4/5',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                  background: '#090810',
                }}
              >
                {selectedMemory.mediaType === 'video' ||
                isVideoUrl(selectedMemory.videoUrl) ||
                isVideoUrl(selectedMemory.imageUrl) ? (
                  <video
                    src={getPlayableVideoUrl(selectedMemory) || selectedMemory.videoUrl || selectedMemory.imageUrl}
                    poster={getValidPosterUrl(selectedMemory) || undefined}
                    controls
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000000' }}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedMemory.imageUrl}
                    alt={selectedMemory.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Meta details */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {selectedMemory.date && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                  >
                    <Calendar size={12} />
                    {selectedMemory.date}
                  </span>
                )}
                {selectedMemory.location && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-rose-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MapPin size={12} />
                    {selectedMemory.location}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.4rem',
                  color: 'var(--color-champagne)',
                  marginBottom: '10px',
                  lineHeight: 1.3,
                }}
              >
                {selectedMemory.title}
              </h3>

              {/* Caption */}
              {selectedMemory.caption && (
                <p
                  style={{
                    fontSize: '0.94rem',
                    lineHeight: 1.6,
                    color: 'var(--color-blush)',
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    marginBottom: '14px',
                  }}
                >
                  &ldquo;{selectedMemory.caption}&rdquo;
                </p>
              )}

              {/* Full Backstory */}
              {selectedMemory.fullStory && (
                <div
                  style={{
                    background: 'rgba(10, 8, 18, 0.75)',
                    border: '1px solid rgba(243, 207, 122, 0.2)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    color: '#e4dbe8',
                    marginBottom: '20px',
                  }}
                >
                  <p style={{ margin: 0 }}>
                    {selectedMemory.fullStory}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedMemory(null)}
                className="btn-romantic"
                style={{ width: '100%' }}
              >
                <Heart size={16} fill="#ffffff" />
                <span>Cherish This Memory</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
