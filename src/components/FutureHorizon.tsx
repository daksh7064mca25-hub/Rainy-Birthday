'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import { FutureMilestone } from '@/types/content';

interface FutureHorizonProps {
  title?: string;
  subtitle?: string;
  startDate?: string;
  bottomNote?: string;
  milestones?: FutureMilestone[];
}

interface TimeElapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Fixed relationship start date: 18 July 2025 at midnight local time
const DEFAULT_START_YEAR = 2025;
const DEFAULT_START_MONTH = 6; // July (0-indexed)
const DEFAULT_START_DAY = 18;

function parseStartDate(dateStr?: string): Date {
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d, 0, 0, 0, 0);
      }
    }
  }
  return new Date(DEFAULT_START_YEAR, DEFAULT_START_MONTH, DEFAULT_START_DAY, 0, 0, 0, 0);
}

function computeTimeElapsed(startDate: Date): TimeElapsed {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - startDate.getTime());

  // Single accurate elapsed-time breakdown:
  // Days represents total elapsed days;
  // hours, minutes, and seconds represent remaining time within the current day.
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

// Background twinkling stars data
const AMBIENT_STARS = [
  { top: '8%', left: '10%', size: 3, duration: 3.2, delay: 0 },
  { top: '18%', right: '12%', size: 4, duration: 4.1, delay: 1.1 },
  { top: '35%', left: '5%', size: 2.5, duration: 3.6, delay: 2.3 },
  { top: '72%', left: '14%', size: 3.5, duration: 4.4, delay: 0.8 },
  { top: '82%', right: '8%', size: 3, duration: 3.8, delay: 1.9 },
  { top: '55%', right: '6%', size: 2.5, duration: 4.8, delay: 2.7 },
  { top: '92%', left: '46%', size: 3, duration: 3.4, delay: 1.4 },
];

export default function FutureHorizon({
  title = 'Every Second With You',
  subtitle = "Since July 18, 2025, every moment has been a little more beautiful because you're in my life.",
  startDate = '2025-07-18',
  bottomNote = 'Every second, my favourite chapter continues. ♡',
}: FutureHorizonProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  const startDateTime = useMemo(() => parseStartDate(startDate), [startDate]);

  // Initialize with null on SSR to guarantee identical client hydration HTML
  const [elapsed, setElapsed] = useState<TimeElapsed | null>(null);

  // Live timer interval updating every second after client hydration
  useEffect(() => {
    setElapsed(computeTimeElapsed(startDateTime));
    setMounted(true);

    const intervalId = setInterval(() => {
      setElapsed(computeTimeElapsed(startDateTime));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startDateTime]);

  return (
    <section
      id="future"
      className="mobile-section"
      style={{
        paddingTop: '30px',
        paddingBottom: '80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Background Glow behind Chapter */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -30%)',
          width: 'min(500px, 90vw)',
          height: '420px',
          background: 'radial-gradient(circle, rgba(226, 88, 127, 0.12) 0%, rgba(243, 207, 122, 0.08) 45%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Subtle Ambient Twinkling Stars */}
      {!shouldReduceMotion &&
        AMBIENT_STARS.map((star, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.15, 0.85, 0.15],
              scale: [0.85, 1.25, 0.85],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              top: star.top,
              left: star.left,
              right: star.right,
              width: `${star.size}px`,
              height: `${star.size}px`,
              borderRadius: '50%',
              background: '#f3cf7a',
              boxShadow: '0 0 8px rgba(243, 207, 122, 0.8)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

      {/* Chapter Title & Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
        {/* Eyebrow */}
        <span
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            display: 'inline-block',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          CHAPTER 6 · OUR STORY
        </span>

        {/* Main Heading */}
        <h2
          className="gold-gradient-text"
          style={{
            fontSize: 'clamp(1.75rem, 5.5vw, 2.4rem)',
            marginBottom: '10px',
            lineHeight: 1.25,
            fontWeight: 700,
          }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 'clamp(0.88rem, 2.5vw, 0.98rem)',
            lineHeight: 1.65,
            maxWidth: '520px',
            margin: '0 auto',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Central Live Relationship Counter Card */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto',
          background: 'linear-gradient(165deg, rgba(28, 20, 38, 0.92) 0%, rgba(13, 11, 22, 0.96) 100%)',
          border: '1.5px solid rgba(243, 207, 122, 0.38)',
          borderRadius: '24px',
          padding: '24px 18px 22px 18px',
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.75), 0 0 45px rgba(243, 207, 122, 0.16), 0 0 25px rgba(226, 88, 127, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Floating Heart with delicate pulse */}
        <div style={{ marginBottom: '14px', position: 'relative' }}>
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: [1, 1.15, 1],
                    y: [0, -3, 0],
                  }
            }
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(226, 88, 127, 0.28) 0%, rgba(19, 14, 27, 0.85) 75%)',
              border: '1.5px solid rgba(243, 207, 122, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(226, 88, 127, 0.45)',
            }}
          >
            <Heart size={20} color="var(--color-rose)" fill="var(--color-rose)" />
          </motion.div>
        </div>

        {/* Date caption badge: OUR JOURNEY BEGAN · 18 JULY 2025 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(243, 207, 122, 0.1)',
            border: '1px solid rgba(243, 207, 122, 0.3)',
            borderRadius: '9999px',
            padding: '5px 14px',
            fontSize: '0.72rem',
            color: 'var(--color-gold)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '20px',
          }}
        >
          <Sparkles size={12} color="var(--color-gold)" />
          <span>OUR JOURNEY BEGAN · 18 JULY 2025</span>
        </div>

        {/* 4 Counter Values: DAYS : HOURS : MINUTES : SECONDS */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(4px, 1.5vw, 10px)',
          }}
        >
          {/* Days */}
          <CounterUnit
            value={elapsed ? elapsed.days : 0}
            label="DAYS"
            reduceMotion={shouldReduceMotion}
            padZero={false}
            mounted={mounted}
          />

          {/* Separator */}
          <ColonSeparator reduceMotion={shouldReduceMotion} />

          {/* Hours */}
          <CounterUnit
            value={elapsed ? elapsed.hours : 0}
            label="HOURS"
            reduceMotion={shouldReduceMotion}
            padZero={true}
            mounted={mounted}
          />

          {/* Separator */}
          <ColonSeparator reduceMotion={shouldReduceMotion} />

          {/* Minutes */}
          <CounterUnit
            value={elapsed ? elapsed.minutes : 0}
            label="MINUTES"
            reduceMotion={shouldReduceMotion}
            padZero={true}
            mounted={mounted}
          />

          {/* Separator */}
          <ColonSeparator reduceMotion={shouldReduceMotion} />

          {/* Seconds */}
          <CounterUnit
            value={elapsed ? elapsed.seconds : 0}
            label="SECONDS"
            reduceMotion={shouldReduceMotion}
            padZero={true}
            mounted={mounted}
          />
        </div>

        {/* Subtle decorative divider line */}
        <div
          style={{
            width: '80%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(243, 207, 122, 0.35) 50%, transparent 100%)',
            margin: '22px 0 16px 0',
          }}
        />

        {/* Below the counter message: Every second, my favourite chapter continues. ♡ */}
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(0.95rem, 3vw, 1.08rem)',
            fontStyle: 'italic',
            color: 'var(--color-blush)',
            lineHeight: 1.5,
            textAlign: 'center',
            margin: 0,
            textShadow: '0 0 14px rgba(226, 88, 127, 0.35)',
          }}
        >
          {bottomNote}
        </p>
      </motion.div>
    </section>
  );
}

// Subcomponent: Individual Counter Block
interface CounterUnitProps {
  value: number;
  label: string;
  reduceMotion: boolean | null;
  padZero: boolean;
  mounted: boolean;
}

function CounterUnit({ value, label, reduceMotion, padZero, mounted }: CounterUnitProps) {
  const displayStr = !mounted
    ? '--'
    : padZero
    ? String(value).padStart(2, '0')
    : value.toLocaleString();

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(18, 14, 26, 0.72)',
        border: '1px solid rgba(243, 207, 122, 0.24)',
        borderRadius: '16px',
        padding: '14px 4px 10px 4px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.45)',
        boxSizing: 'border-box',
      }}
    >
      {/* Numeric value with subtle smooth digit transition */}
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.6rem, 5.2vw, 2.7rem)',
          fontWeight: 700,
          color: 'var(--color-champagne)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
          minHeight: '1.15em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textShadow: '0 0 18px rgba(243, 207, 122, 0.4)',
          overflow: 'hidden',
        }}
        suppressHydrationWarning
      >
        {!mounted ? (
          <span suppressHydrationWarning>--</span>
        ) : reduceMotion ? (
          <span suppressHydrationWarning>{displayStr}</span>
        ) : (
          <motion.span
            key={displayStr}
            initial={{ opacity: 0.6, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ display: 'inline-block' }}
            suppressHydrationWarning
          >
            {displayStr}
          </motion.span>
        )}
      </div>

      {/* Label underneath */}
      <span
        style={{
          fontSize: 'clamp(0.6rem, 1.8vw, 0.72rem)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-gold)',
          fontWeight: 600,
          marginTop: '6px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// Subcomponent: Colon Separator with subtle ambient glow
function ColonSeparator({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(1.3rem, 4.2vw, 2.2rem)',
        fontWeight: 600,
        color: 'var(--color-gold)',
        opacity: 0.7,
        paddingBottom: '24px', // Align with the numbers above the labels
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {reduceMotion ? (
        <span>:</span>
      ) : (
        <motion.span
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          :
        </motion.span>
      )}
    </div>
  );
}
