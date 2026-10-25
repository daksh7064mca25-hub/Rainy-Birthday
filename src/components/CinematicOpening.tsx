'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, ChevronDown } from 'lucide-react';

interface CinematicOpeningProps {
  recipientName: string;
  recipientNickname: string;
  headline: string;
  subtitle: string;
  ctaText: string;
  envelopeLabel: string;
  onEnter: () => void;
}

export default function CinematicOpening({
  recipientName,
  recipientNickname,
  headline,
  subtitle,
  ctaText,
  envelopeLabel,
  onEnter,
}: CinematicOpeningProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenEnvelope = () => {
    setIsOpen(true);
  };

  const handleProceed = () => {
    onEnter();
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingTop: 'max(24px, env(safe-area-inset-top, 24px))',
        paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: 'radial-gradient(circle at 50% 20%, #3a0b22 0%, #15091a 45%, #080911 100%)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Ambient Lighting Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(226, 88, 127, 0.22) 0%, rgba(243, 207, 122, 0.08) 50%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          zIndex: 2,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(28, 17, 33, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(243, 207, 122, 0.3)',
            borderRadius: '9999px',
            padding: '8px 18px',
            fontSize: '0.82rem',
            color: 'var(--color-gold)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Sparkles size={14} color="var(--color-gold)" />
          {recipientNickname || 'My Starlight'}
        </span>
      </motion.div>

      {/* Center Interactive Envelope & Love Letter */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 3,
        }}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* Closed 3D Glass Envelope */
            <motion.div
              key="envelope"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.6 }}
              className="animate-float"
              style={{
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                onClick={handleOpenEnvelope}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleOpenEnvelope();
                }}
                aria-label="Open Birthday Letter"
                style={{
                  width: '100%',
                  height: '220px',
                  background: 'linear-gradient(145deg, rgba(45, 18, 38, 0.85) 0%, rgba(18, 15, 30, 0.92) 100%)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  borderRadius: '18px',
                  border: '1.5px solid rgba(243, 207, 122, 0.35)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(226, 88, 127, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  touchAction: 'manipulation',
                }}
              >
                {/* Envelope Flap Accent Lines */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    borderBottom: '1px solid rgba(243, 207, 122, 0.2)',
                    background: 'linear-gradient(180deg, rgba(243, 207, 122, 0.08) 0%, transparent 100%)',
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  }}
                />

                {/* Wax Seal Badge */}
                <div
                  className="wax-seal"
                  style={{
                    zIndex: 2,
                    marginBottom: '14px',
                    boxShadow: '0 0 20px rgba(226, 88, 127, 0.6), inset 0 2px 4px rgba(255,255,255,0.4)',
                  }}
                >
                  <Heart size={24} fill="#f7d58b" color="#f7d58b" />
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.45rem',
                    color: 'var(--color-champagne)',
                    fontWeight: 600,
                    textAlign: 'center',
                    marginBottom: '6px',
                    zIndex: 2,
                  }}
                >
                  For {recipientName}
                </h2>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-gold)',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 2,
                  }}
                >
                  <Sparkles size={13} />
                  {envelopeLabel || 'Touch to Open'}
                </p>
              </div>

              {/* Title & Subtitle Beneath */}
              <div style={{ marginTop: '28px', textAlign: 'center', width: '100%' }}>
                <h1
                  className="gold-gradient-text"
                  style={{
                    fontSize: 'clamp(1.5rem, 5vw, 1.95rem)',
                    fontFamily: 'var(--font-serif)',
                    marginBottom: '10px',
                    lineHeight: 1.25,
                  }}
                >
                  {headline}
                </h1>
                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    padding: '0 8px',
                  }}
                >
                  {subtitle}
                </p>
              </div>
            </motion.div>
          ) : (
            /* Unfolded Warm Card */
            <motion.div
              key="letter"
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                background: 'linear-gradient(160deg, #fefaf0 0%, #f7eedb 100%)',
                color: '#281720',
                borderRadius: '16px',
                padding: '24px 20px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(243, 207, 122, 0.4)',
                border: '1px solid rgba(212, 167, 66, 0.5)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  borderBottom: '1px solid rgba(180, 140, 90, 0.25)',
                  paddingBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 700,
                    color: '#7b1435',
                    fontSize: '1.1rem',
                  }}
                >
                  My Beloved Rainy,
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#8c6b45',
                    fontStyle: 'italic',
                  }}
                >
                  A Birthday Universe
                </span>
              </div>

              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.98rem',
                  lineHeight: 1.7,
                  color: '#2e1c25',
                  marginBottom: '16px',
                }}
              >
                Today isn&apos;t just another day on the calendar. It is the anniversary of the day the world was blessed with your gentle heart and radiant smile. I made this private universe to hold our memories and my deepest love for you.
              </p>

              <div
                style={{
                  textAlign: 'right',
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: '#7b1435',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                — Yours, forever and always
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '380px',
          margin: '0 auto',
          gap: '12px',
          zIndex: 3,
        }}
      >
        <button
          onClick={isOpen ? handleProceed : handleOpenEnvelope}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          <Sparkles size={18} color="#1a060e" />
          <span>{isOpen ? 'Enter Our Universe' : ctaText || 'Open My Heart'}</span>
        </button>

        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-faint)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>Designed with love for your smartphone</span>
          <ChevronDown size={12} />
        </p>
      </motion.div>
    </div>
  );
}
