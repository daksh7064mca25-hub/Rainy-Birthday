'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryItem } from '@/types/content';
import { Play, Pause, RotateCcw, FastForward, Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinalRevealProps {
  title: string;
  subtitle: string;
  montageQuote: string;
  finalMessage: string;
  celebrationTag: string;
  memories: MemoryItem[];
  recipientName: string;
  partnerName: string;
}

export default function FinalReveal({
  title,
  subtitle,
  montageQuote,
  finalMessage,
  celebrationTag,
  memories,
  recipientName,
  partnerName,
}: FinalRevealProps) {
  const publishedMemories = memories.filter((m) => m.published !== false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Auto advance slides during montage if playing and not completed
  useEffect(() => {
    if (!isPlaying || isCompleted || publishedMemories.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 >= publishedMemories.length) {
          setIsCompleted(true);
          triggerConfetti();
          return prev;
        }
        return prev + 1;
      });
    }, 3800);

    return () => clearInterval(interval);
  }, [isPlaying, isCompleted, publishedMemories.length]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f3cf7a', '#e2587f', '#ffd5e2', '#ffffff'],
      });
    } catch (e) {
      // safe fallback
    }
  };

  const handleReplay = () => {
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsPlaying(true);
  };

  const handleSkip = () => {
    setIsCompleted(true);
    triggerConfetti();
  };

  const currentMemory = publishedMemories[currentIndex] || publishedMemories[0];

  return (
    <section id="final-reveal" className="mobile-section" style={{ paddingBottom: '80px' }}>
      {/* Chapter Title */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            display: 'inline-block',
            marginBottom: '6px',
            fontWeight: 600,
          }}
        >
          Chapter 7
        </span>
        <h2 className="gold-gradient-text" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!isCompleted ? (
          /* Cinematic Montage Player */
          <motion.div
            key="montage-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card"
            style={{
              overflow: 'hidden',
              padding: '16px',
              border: '1px solid rgba(243, 207, 122, 0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }}
          >
            {/* Slide Image Container */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4/5',
                borderRadius: '14px',
                overflow: 'hidden',
                background: '#120718',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentMemory?.id || currentIndex}
                  src={currentMemory?.imageUrl}
                  alt={currentMemory?.title}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </AnimatePresence>

              {/* Cinematic Vignette Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(14, 8, 20, 0.2) 0%, transparent 40%, rgba(9, 10, 20, 0.9) 100%)',
                }}
              />

              {/* Memory Caption Overlay on Slide */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--color-gold)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Memory {currentIndex + 1} of {memories.length}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-champagne)',
                    marginTop: '2px',
                    marginBottom: '4px',
                  }}
                >
                  {currentMemory?.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-blush)',
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}
                >
                  &ldquo;{currentMemory?.caption}&rdquo;
                </p>
              </div>
            </div>

            {/* Montage Controls */}
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                aria-label={isPlaying ? 'Pause montage' : 'Play montage'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Resume'}</span>
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {publishedMemories.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    style={{
                      width: i === currentIndex ? '18px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: i === currentIndex ? 'var(--color-gold)' : 'rgba(255,255,255,0.25)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleSkip}
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                aria-label="Skip montage"
              >
                <span>Skip</span>
                <FastForward size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          /* Final Reveal Letter & Stable Ending Screen */
          <motion.div
            key="final-letter-view"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-card"
            style={{
              padding: '28px 22px',
              textAlign: 'center',
              border: '1.5px solid rgba(243, 207, 122, 0.4)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 35px rgba(226, 88, 127, 0.3)',
              position: 'relative',
            }}
          >
            {/* Heart Icon Crown */}
            <div
              className="animate-pulse-glow"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #e2587f 0%, #750e33 70%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto',
                boxShadow: '0 0 25px rgba(226, 88, 127, 0.6)',
              }}
            >
              <Heart size={30} fill="#ffffff" color="#ffffff" />
            </div>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(243, 207, 122, 0.15)',
                color: 'var(--color-gold)',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                marginBottom: '12px',
                border: '1px solid rgba(243, 207, 122, 0.3)',
              }}
            >
              {celebrationTag || 'Make a Wish ✨'}
            </span>

            <h3
              className="gold-gradient-text"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.4rem, 4.5vw, 1.85rem)',
                marginBottom: '16px',
                lineHeight: 1.3,
              }}
            >
              {montageQuote || `To My Everything, ${recipientName}`}
            </h3>

            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'var(--color-champagne)',
                fontFamily: 'var(--font-serif)',
                marginBottom: '24px',
                padding: '0 6px',
              }}
            >
              {finalMessage}
            </p>

            <div
              style={{
                borderTop: '1px solid rgba(243, 207, 122, 0.2)',
                paddingTop: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.95rem',
                  fontStyle: 'italic',
                  color: 'var(--color-blush)',
                }}
              >
                Forever entwined, {partnerName || 'With all my love'}
              </p>

              <button
                onClick={handleReplay}
                className="btn-outline"
                style={{ marginTop: '8px' }}
                aria-label="Replay memory montage"
              >
                <RotateCcw size={15} />
                <span>Replay Montage</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
