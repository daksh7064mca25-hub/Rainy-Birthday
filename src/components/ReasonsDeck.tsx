'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LoveReason } from '@/types/content';
import { Heart, Sparkles, ChevronRight } from 'lucide-react';

interface ReasonsDeckProps {
  title: string;
  subtitle: string;
  reasons: LoveReason[];
}

export default function ReasonsDeck({ title, subtitle, reasons }: ReasonsDeckProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleReason = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="reasons" className="mobile-section" style={{ paddingBottom: '60px' }}>
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
          Chapter 5
        </span>
        <h2 className="gold-gradient-text" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reasons.map((reason, index) => {
          const isExpanded = expandedId === reason.id;

          return (
            <motion.div
              key={reason.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div
                className="glass-card-interactive"
                onClick={() => toggleReason(reason.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggleReason(reason.id);
                }}
                aria-expanded={isExpanded}
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  borderColor: isExpanded ? 'var(--color-gold)' : 'rgba(226, 88, 127, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--color-gold)',
                        width: '32px',
                        flexShrink: 0,
                      }}
                    >
                      {reason.number}
                    </span>
                    <h3
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.05rem',
                        color: 'var(--color-champagne)',
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      {reason.title}
                    </h3>
                  </div>

                  <div
                    style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      color: 'var(--color-gold)',
                      marginLeft: '8px',
                      flexShrink: 0,
                    }}
                  >
                    <ChevronRight size={18} />
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(243, 207, 122, 0.15)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '0.92rem',
                        lineHeight: 1.7,
                        color: 'var(--color-blush)',
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{reason.description}&rdquo;
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
