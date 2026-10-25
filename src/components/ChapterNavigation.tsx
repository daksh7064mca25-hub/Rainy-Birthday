'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Image, Mail, Heart, Clock, Award } from 'lucide-react';

interface ChapterNavigationProps {
  visible: boolean;
}

const chapters = [
  { id: 'top', label: 'Start', icon: Sparkles },
  { id: 'universe', label: 'Memories', icon: Image },
  { id: 'museum', label: 'Stories', icon: Compass },
  { id: 'letters', label: 'Letter', icon: Mail },
  { id: 'reasons', label: 'Reasons', icon: Heart },
  { id: 'future', label: 'Story', icon: Clock },
  { id: 'final-reveal', label: 'Reveal', icon: Award },
];

export default function ChapterNavigation({ visible }: ChapterNavigationProps) {
  const [activeChapter, setActiveChapter] = useState<string>('top');

  useEffect(() => {
    if (!visible) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight * 0.4;

      for (let i = chapters.length - 1; i >= 0; i--) {
        const item = chapters[i];
        if (item.id === 'top') {
          if (window.scrollY < 300) {
            setActiveChapter('top');
            break;
          }
        } else {
          const el = document.getElementById(item.id);
          if (el && el.offsetTop <= scrollPos) {
            setActiveChapter(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible]);

  if (!visible) return null;

  const scrollToChapter = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className="bottom-chapter-nav"
      aria-label="Chapter navigation"
      role="navigation"
    >
      {chapters.map((ch) => {
        const isActive = activeChapter === ch.id;
        const Icon = ch.icon;

        return (
          <button
            key={ch.id}
            onClick={() => scrollToChapter(ch.id)}
            aria-label={`Jump to ${ch.label}`}
            style={{
              background: isActive ? 'linear-gradient(135deg, #e2587f 0%, #b82352 100%)' : 'transparent',
              border: 'none',
              borderRadius: '9999px',
              padding: isActive ? '6px 12px' : '6px 8px',
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 500,
              transition: 'all 0.25s ease',
              touchAction: 'manipulation',
            }}
          >
            <Icon size={14} color={isActive ? '#ffffff' : 'var(--color-gold)'} />
            {isActive && <span>{ch.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
