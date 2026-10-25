'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid administrator password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'radial-gradient(circle at 50% 20%, #29081a 0%, #0d0f1e 50%, #07080e 100%)',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '32px 24px',
          border: '1.5px solid rgba(243, 207, 122, 0.3)',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #e2587f 0%, #750e33 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(226, 88, 127, 0.5)',
          }}
        >
          <Lock size={26} color="#ffffff" />
        </div>

        <h1
          className="gold-gradient-text"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            marginBottom: '6px',
          }}
        >
          Aether Love Portal
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Enter password to curate Rainy&apos;s birthday universe
        </p>

        {error && (
          <div
            style={{
              background: 'rgba(226, 88, 127, 0.2)',
              border: '1px solid var(--color-rose)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.82rem',
              color: 'var(--color-blush)',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--color-champagne)',
                marginBottom: '6px',
                fontWeight: 500,
              }}
            >
              Master Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master password"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(10, 11, 20, 0.7)',
                border: '1px solid rgba(243, 207, 122, 0.25)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            <span>{isLoading ? 'Unlocking...' : 'Access Dashboard'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link
            href="/"
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Heart size={12} color="var(--color-rose)" />
            <span>Return to Public Experience</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
