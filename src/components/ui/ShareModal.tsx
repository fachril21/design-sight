import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Modal } from './Modal';
import { Button } from './Button';
import { ShareCard } from './ShareCard';
import type { ShareCardProps } from './ShareCard';
import { Download, Copy, Share2, Check, Loader2 } from 'lucide-react';

interface ShareModalProps extends ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose, ...cardProps }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePng = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 2,
        cacheBust: true,
      });
      return dataUrl;
    } catch (err) {
      console.error('[DesignSight] Failed to generate share card:', err);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generatePng();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `designsight-score-${cardProps.username}.png`;
    link.href = dataUrl;
    link.click();
  }, [generatePng, cardProps.username]);

  const handleCopy = useCallback(async () => {
    const dataUrl = await generatePng();
    if (!dataUrl) return;

    try {
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy text
      const statsText = cardProps.stats.map(s => `${s.label}: ${s.value}`).join(' | ');
      const text = `I scored ${cardProps.score.toLocaleString()} on DesignSight ${cardProps.gameName}! 🎯 ${statsText}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatePng, cardProps]);

  const handleShare = useCallback(async () => {
    const statsText = cardProps.stats.map(s => `${s.label}: ${s.value}`).join(' | ');
    const shareText = `I scored ${cardProps.score.toLocaleString()} on DesignSight ${cardProps.gameName}! 🎯🔥 ${statsText} — Can you beat it?`;

    // Try native Web Share API first (mobile)
    if (navigator.share) {
      const dataUrl = await generatePng();
      if (dataUrl) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], 'designsight-score.png', { type: 'image/png' });

          await navigator.share({
            text: shareText,
            files: [file],
          });
          return;
        } catch {
          // User cancelled or share failed, fall through to Twitter
        }
      }
    }

    // Fallback: Twitter intent
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  }, [generatePng, cardProps]);

  return (
    <>
      {/* Hidden container for the capture card — must be in DOM but not visible */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 1200, height: 630, overflow: 'hidden', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
        <ShareCard ref={cardRef} {...cardProps} />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Share Your Score"
        description="Show off your design skills!"
        className="max-w-lg"
      >
        <div className="flex flex-col gap-4 mt-2">
          {/* Card Preview */}
          <div className="rounded-xl overflow-hidden border border-border bg-black shadow-lg">
            <div
              style={{
                aspectRatio: '1200/630',
                width: '100%',
                background: 'linear-gradient(145deg, #0a0a0f 0%, #111127 40%, #1a1a3e 100%)',
                position: 'relative',
                overflow: 'hidden',
                padding: '5% 6%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Grid pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Top */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🎨</span>
                  <span className="text-[11px] font-extrabold text-white tracking-tight">DesignSight</span>
                </div>
                <span className="text-[8px] font-semibold text-white/40 uppercase tracking-[3px]">{cardProps.gameName}</span>
              </div>

              {/* Center */}
              <div className="flex flex-col items-center gap-1 relative z-10">
                <span className="text-[7px] font-bold text-white/40 uppercase tracking-[4px]">Final Score</span>
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none font-mono">
                  {cardProps.score.toLocaleString()}
                </span>
                <div className="flex gap-4 mt-2 px-4 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  {cardProps.stats.map((stat, i) => (
                    <React.Fragment key={stat.label}>
                      <div className="flex flex-col items-center">
                        <span className="text-[6px] font-semibold text-white/40 uppercase tracking-widest">{stat.label}</span>
                        <span className={`text-xs font-extrabold ${stat.colorClass || 'text-white'}`}>{stat.value}</span>
                      </div>
                      {i < cardProps.stats.length - 1 && (
                        <div className="w-px bg-white/10" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Bottom */}
              <div className="flex items-end justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
                  <span className="text-[10px] font-bold text-white/60">
                    {cardProps.username}<span className="text-white/30">#{cardProps.tag}</span>
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-white/25">Beat my score! →</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center justify-center gap-1.5"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="text-xs">Download</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleCopy}
              disabled={generating}
              className="flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleShare}
              disabled={generating}
              className="flex items-center justify-center gap-1.5"
            >
              <Share2 size={14} />
              <span className="text-xs">Share</span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
