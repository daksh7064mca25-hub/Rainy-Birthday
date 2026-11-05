'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  maxOpacity: number;
  pulseSpeed: number;
  color: string;
  glowColor: string;
}

export default function CosmicParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect user's motion preferences
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Responsive particle count: fewer on mobile for optimal 60fps performance
    const isMobile = width < 768;
    const particleCount = isMobile ? 28 : 52;

    const palette = [
      { base: 'rgba(243, 207, 122, ', glow: 'rgba(243, 207, 122, 0.35)' }, // champagne gold
      { base: 'rgba(226, 88, 127, ', glow: 'rgba(226, 88, 127, 0.35)' }, // rose pink
      { base: 'rgba(255, 235, 240, ', glow: 'rgba(255, 235, 240, 0.3)' }, // star white
      { base: 'rgba(180, 100, 160, ', glow: 'rgba(180, 100, 160, 0.3)' }, // soft violet
    ];

    const particles: Particle[] = Array.from({ length: particleCount }).map(() => {
      const col = palette[Math.floor(Math.random() * palette.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.6,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: -Math.random() * 0.3 - 0.06, // gentle upward drift
        opacity: Math.random() * 0.7 + 0.1,
        maxOpacity: Math.random() * 0.55 + 0.25,
        pulseSpeed: Math.random() * 0.012 + 0.004,
        color: col.base,
        glowColor: col.glow,
      };
    });

    let isPageVisible = true;
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) {
        render();
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const render = () => {
      if (!isPageVisible) return;

      ctx.clearRect(0, 0, width, height);

      // Draw each drifting particle with hardware-accelerated concentric glow
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Pulse opacity
        p.opacity += p.pulseSpeed;
        if (p.opacity > p.maxOpacity || p.opacity < 0.1) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = Math.max(0, Math.min(1, p.opacity));

        // Soft outer glow halo (fast arc fill without CPU shadowBlur)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${(currentAlpha * 0.35).toFixed(2)})`;
        ctx.fill();

        // Bright inner core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentAlpha.toFixed(2)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.85,
        transform: 'translateZ(0)',
      }}
      aria-hidden="true"
    />
  );
}
