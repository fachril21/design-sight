import React from 'react';

export interface ShareCardProps {
  score: number;
  bestStreak: number;
  accuracy: number;
  totalAnswers: number;
  username: string;
  tag: string;
}

/**
 * Pure presentational component for the share card.
 * Rendered inside a visually-hidden container, captured via html-to-image.
 * Actual size: 1200×630. Retina is handled by pixelRatio in toPng().
 */
export const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>(
  ({ score, bestStreak, accuracy, totalAnswers, username, tag }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 1200,
          height: 630,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Background */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(145deg, #0a0a0f 0%, #111127 40%, #1a1a3e 100%)',
            padding: '48px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Subtle grid pattern overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Accent glow */}
          <div
            style={{
              position: 'absolute',
              top: -120,
              right: -120,
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* Top: Branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                🎨
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                DesignSight
              </span>
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '3px',
              }}
            >
              Contrast Checker
            </span>
          </div>

          {/* Center: Score Hero */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                letterSpacing: '6px',
              }}
            >
              Final Score
            </span>
            <span
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-4px',
                lineHeight: 1,
              }}
            >
              {score.toLocaleString()}
            </span>

            {/* Stats Row */}
            <div
              style={{
                display: 'flex',
                gap: 32,
                marginTop: 20,
                padding: '14px 32px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Best Streak
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>🔥 {bestStreak}</span>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Accuracy
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>✓ {accuracy}%</span>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Questions
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{totalAnswers}</span>
              </div>
            </div>
          </div>

          {/* Bottom: Player + CTA */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                {username}<span style={{ color: 'rgba(255,255,255,0.35)' }}>#{tag}</span>
              </span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
              Beat my score! →
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = 'ShareCard';
