'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Sparkles, Heart } from 'lucide-react';
import { romanticSynth } from '@/lib/audioGenerator';

interface HeartLettersProps {
  title: string;
  subtitle: string;
  letter: {
    salutation: string;
    paragraphs: string[];
    closing: string;
    signature: string;
  };
  voiceNote: {
    title: string;
    duration: string;
    date: string;
    audioUrl: string;
    caption: string;
  };
}

export default function HeartLetters({ title, subtitle, letter, voiceNote }: HeartLettersProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSeconds, setCurrentSeconds] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(84); // 1m 24s default
  const [audioError, setAudioError] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse duration if string provided (e.g., "1:24")
  useEffect(() => {
    if (voiceNote?.duration) {
      const parts = voiceNote.duration.split(':');
      if (parts.length === 2) {
        const sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        if (!isNaN(sec)) setTotalSeconds(sec);
      }
    }
  }, [voiceNote?.duration]);

  const togglePlay = async () => {
    try {
      if (isPlaying) {
        setIsPlaying(false);
        if (audioRef.current && !audioError) {
          audioRef.current.pause();
        } else {
          romanticSynth.pause();
        }
      } else {
        setIsPlaying(true);
        // Try playing real audio if audioUrl is valid and not erroring
        if (voiceNote?.audioUrl && !audioError && audioRef.current) {
          try {
            await audioRef.current.play();
          } catch (err) {
            console.warn('HTML5 Audio failed, falling back to romantic Web Audio synth:', err);
            setAudioError(true);
            romanticSynth.play(
              (curr, dur) => {
                setCurrentSeconds(curr);
                setTotalSeconds(dur);
              },
              () => setIsPlaying(false)
            );
          }
        } else {
          // Play synthesized romantic melody
          romanticSynth.play(
            (curr, dur) => {
              setCurrentSeconds(curr);
              setTotalSeconds(dur);
            },
            () => setIsPlaying(false)
          );
        }
      }
    } catch (e) {
      console.error('Audio toggle error:', e);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentSeconds(target);
    if (audioRef.current && !audioError) {
      audioRef.current.currentTime = target;
    } else {
      romanticSynth.seek(target / totalSeconds);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <section id="letters" className="mobile-section" style={{ paddingBottom: '60px' }}>
      {/* Hidden HTML5 Audio Element for custom uploads */}
      {voiceNote?.audioUrl && (
        <audio
          ref={audioRef}
          src={voiceNote.audioUrl}
          preload="metadata"
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentSeconds(Math.floor(audioRef.current.currentTime));
              if (audioRef.current.duration) {
                setTotalSeconds(Math.floor(audioRef.current.duration));
              }
            }
          }}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setAudioError(true);
          }}
        />
      )}

      {/* Chapter Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
          Chapter 4
        </span>
        <h2 className="gold-gradient-text" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>

      {/* Love Letter Parchment */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="letter-paper"
        style={{ marginBottom: '36px' }}
      >
        {/* Wax Seal Decoration */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <div className="wax-seal">
            <Heart size={22} fill="#f7d58b" color="#f7d58b" />
          </div>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            color: '#630e22',
            marginBottom: '16px',
            fontWeight: 700,
          }}
        >
          {letter.salutation}
        </h3>

        {letter.paragraphs.map((paragraph, idx) => (
          <p
            key={idx}
            style={{
              marginBottom: '14px',
              color: '#241a20',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.02rem',
              lineHeight: 1.8,
            }}
          >
            {paragraph}
          </p>
        ))}

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <p style={{ color: '#630e22', fontStyle: 'italic', fontWeight: 600, fontSize: '0.95rem' }}>
            {letter.closing}
          </p>
          <p
            style={{
              color: '#381622',
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              fontSize: '1.05rem',
              marginTop: '4px',
            }}
          >
            {letter.signature}
          </p>
        </div>
      </motion.div>

      {/* Mobile-First Voice Message Player */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-card"
        style={{
          padding: '20px',
          border: '1px solid rgba(243, 207, 122, 0.3)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: 'var(--color-gold)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <Volume2 size={14} />
            Voice Recording
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
            {voiceNote?.date || 'Recorded for you'}
          </span>
        </div>

        <h4
          style={{
            color: 'var(--color-champagne)',
            fontSize: '1.05rem',
            fontFamily: 'var(--font-serif)',
            marginBottom: '6px',
          }}
        >
          {voiceNote?.title || 'A Whispered Birthday Note'}
        </h4>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
          {voiceNote?.caption || 'Touch the play button below to listen to a heartfelt personal recording.'}
        </p>

        {/* Player Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(15, 12, 25, 0.7)',
            padding: '12px 16px',
            borderRadius: '16px',
            border: '1px solid rgba(226, 88, 127, 0.25)',
          }}
        >
          {/* Thumb-friendly Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="btn-romantic"
            aria-label={isPlaying ? 'Pause audio recording' : 'Play audio recording'}
            style={{
              width: '50px',
              height: '50px',
              padding: 0,
              borderRadius: '50%',
              flexShrink: 0,
              minWidth: '50px',
              minHeight: '50px',
            }}
          >
            {isPlaying ? <Pause size={20} fill="#ffffff" /> : <Play size={20} fill="#ffffff" style={{ marginLeft: '2px' }} />}
          </button>

          {/* Progress & Waveform */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Waveform Visualization Bars */}
            <div className="waveform-container">
              {[8, 14, 22, 12, 18, 24, 16, 20, 10, 24, 18, 14, 22, 12, 19, 10].map((h, i) => (
                <div
                  key={i}
                  className={`waveform-bar ${isPlaying ? 'playing' : ''}`}
                  style={{
                    height: isPlaying ? `${Math.max(6, Math.min(26, h + (i % 3) * 4))}px` : `${Math.max(4, h * 0.4)}px`,
                    animationDelay: `${i * 0.08}s`,
                    opacity: currentSeconds / totalSeconds > i / 16 ? 1 : 0.4,
                  }}
                />
              ))}
            </div>

            {/* Time Scrubber */}
            <input
              type="range"
              min="0"
              max={totalSeconds || 84}
              value={currentSeconds}
              onChange={handleSeek}
              aria-label="Audio scrubber"
              style={{
                width: '100%',
                accentColor: 'var(--color-gold)',
                cursor: 'pointer',
                height: '4px',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-faint)',
              }}
            >
              <span>{formatTime(currentSeconds)}</span>
              <span>{formatTime(totalSeconds)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
