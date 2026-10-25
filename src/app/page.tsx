'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SiteContent, MemoryItem } from '@/types/content';
import defaultContent from '@/data/content.json';
import CinematicOpening from '@/components/CinematicOpening';
import CinematicMemoryUniverse from '@/components/CinematicMemoryUniverse';
import PhotoMuseum from '@/components/PhotoMuseum';
import HeartLetters from '@/components/HeartLetters';
import ReasonsDeck from '@/components/ReasonsDeck';
import FutureHorizon from '@/components/FutureHorizon';
import FinalReveal from '@/components/FinalReveal';
import ChapterNavigation from '@/components/ChapterNavigation';
import CosmicParticles from '@/components/CosmicParticles';
import MemoryPhotoReveal from '@/components/MemoryPhotoReveal';
import { Compass, Sparkles, Heart, Lock } from 'lucide-react';
import Link from 'next/link';

// Dynamically import 3D Universe to ensure smooth SSR and zero blocking
const HeartUniverse3D = dynamic(() => import('@/components/HeartUniverse3D'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '24px',
        background: 'radial-gradient(circle at 50% 50%, #200717 0%, #0c0d18 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="animate-pulse-glow" style={{ color: 'var(--color-gold)' }}>
        <Sparkles size={32} />
      </div>
    </div>
  ),
});

export default function HomePage() {
  const [content, setContent] = useState<SiteContent>(defaultContent as unknown as SiteContent);
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [selectedOrbitMemory, setSelectedOrbitMemory] = useState<MemoryItem | null>(null);
  const [isPhotoRevealOpen, setIsPhotoRevealOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/content')
      .then((res) => res.json())
      .then((data) => setContent(data))
      .catch((err) => console.error('Error fetching content:', err));
  }, []);

  const handleEnter = () => {
    setHasEntered(true);
    // Smoothly scroll to the universe section
    setTimeout(() => {
      const universeEl = document.getElementById('universe');
      if (universeEl) {
        universeEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  if (!content) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090a14',
          color: 'var(--color-gold)',
          gap: '16px',
        }}
      >
        <div className="animate-pulse-glow">
          <Heart size={42} fill="var(--color-rose)" color="var(--color-rose)" />
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', letterSpacing: '0.04em' }}>
          Preparing Our Universe...
        </p>
      </div>
    );
  }

  const { general, chapter1, chapter2, chapter3, chapter4, chapter5, chapter6, chapter7, sectionsVisibility } = content;

  return (
    <div id="top" style={{ position: 'relative', minHeight: '100dvh', overflowX: 'hidden' }}>
      {/* Background Star & Glow Canvas */}
      <CosmicParticles />

      {/* Chapter 1: The Cinematic Opening (The First 10 Seconds) */}
      {sectionsVisibility.surprise && (
        <CinematicOpening
          recipientName={general.recipientName}
          recipientNickname={general.recipientNickname}
          headline={chapter1.headline}
          subtitle={chapter1.subtitle}
          ctaText={chapter1.ctaText}
          envelopeLabel={chapter1.envelopeLabel}
          onEnter={handleEnter}
        />
      )}

      {/* Main Chapters Universe */}
      <div
        style={{
          opacity: hasEntered ? 1 : 0.85,
          transition: 'opacity 0.6s ease',
          paddingTop: '40px',
        }}
      >
        {/* Chapter 2: Cinematic Memory Universe Gallery */}
        {sectionsVisibility.universe && (
          <CinematicMemoryUniverse
            title={chapter2.title}
            subtitle={chapter2.subtitle}
            finalQuote={chapter2.finalQuote}
            memories={chapter3.memories}
          />
        )}

        {/* Chapter 3: The Museum of Us */}
        {sectionsVisibility.museum && (
          <PhotoMuseum
            title={chapter3.title}
            subtitle={chapter3.subtitle}
            memories={chapter3.memories}
          />
        )}

        {/* Chapter 4: Letters From My Heart */}
        {sectionsVisibility.letters && (
          <HeartLetters
            title={chapter4.title}
            subtitle={chapter4.subtitle}
            letter={chapter4.letter}
            voiceNote={chapter4.voiceNote}
          />
        )}

        {/* Chapter 5: Reasons Why I Love You */}
        {sectionsVisibility.reasons && (
          <ReasonsDeck
            title={chapter5.title}
            subtitle={chapter5.subtitle}
            reasons={chapter5.reasons}
          />
        )}

        {/* Chapter 6: Our Story - Live Relationship Counter */}
        {sectionsVisibility.future && (
          <FutureHorizon
            title={chapter6.title}
            subtitle={chapter6.subtitle}
            startDate={chapter6.startDate || '2025-07-18'}
            bottomNote={chapter6.bottomNote || 'Every second, my favourite chapter continues. ♡'}
          />
        )}

        {/* Chapter 7: The Final Reveal */}
        {sectionsVisibility.finalReveal && (
          <FinalReveal
            title={chapter7.title}
            subtitle={chapter7.subtitle}
            montageQuote={chapter7.montageQuote}
            finalMessage={chapter7.finalMessage}
            celebrationTag={chapter7.celebrationTag}
            memories={chapter3.memories}
            recipientName={general.recipientName}
            partnerName={general.partnerName}
          />
        )}

        {/* Discreet Footer with Admin Link */}
        <footer
          style={{
            paddingBottom: 'max(90px, env(safe-area-inset-bottom, 90px))',
            textAlign: 'center',
            paddingLeft: '20px',
            paddingRight: '20px',
            fontSize: '0.78rem',
            color: 'var(--text-faint)',
          }}
        >
          <p style={{ marginBottom: '8px' }}>
            Built with endless love for {general.recipientName} • {general.occasion}
          </p>
          <Link
            href="/admin"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.72rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Lock size={11} />
            <span>Admin Portal</span>
          </Link>
        </footer>
      </div>

      {/* Floating Bottom Navigator for Mobile */}
      <ChapterNavigation visible={hasEntered} />

      {/* Chapter 2: Interactive Gold Star Memory Photo Reveal Viewer */}
      <MemoryPhotoReveal
        memory={selectedOrbitMemory}
        memories={chapter3.memories}
        isOpen={isPhotoRevealOpen}
        onClose={() => setIsPhotoRevealOpen(false)}
        onSelectMemory={(mem) => setSelectedOrbitMemory(mem)}
      />
    </div>
  );
}
