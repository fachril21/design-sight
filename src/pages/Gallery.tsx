import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { Badge } from '@/components/ui/Badge';
import { TimerRing } from '@/components/ui/TimerRing';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AuthModal } from '@/components/auth/AuthModal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { pageVariants, pageVariantsReduced, popIn, popInReduced } from '@/lib/motion';
import { sfx } from '@/audio/sfx';

const SWATCHES = [
  ['bg', 'var(--ds-bg)'],
  ['surface', 'var(--ds-surface)'],
  ['raised', 'var(--ds-raised)'],
  ['primary', 'var(--ds-primary)'],
  ['accent', 'var(--ds-accent)'],
  ['lime', 'var(--ds-lime)'],
  ['amber', 'var(--ds-amber)'],
  ['tier perfect', 'var(--ds-tier-perfect)'],
  ['tier great', 'var(--ds-tier-great)'],
  ['tier good', 'var(--ds-tier-good)'],
  ['tier rough', 'var(--ds-tier-rough)'],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="font-display text-xl text-arcade-primary-hot">{title}</h2>
      {children}
    </section>
  );
}

/** Component gallery (Epic 01 AC): every core primitive with motion + sound. */
export function Gallery() {
  const reduced = useReducedMotion();
  const [modalOpen, setModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [muted, setMuted] = useState(sfx.isMuted());
  const [replayKey, setReplayKey] = useState(0);
  const [ringDemo, setRingDemo] = useState(0.72);

  return (
    <motion.main
      variants={reduced ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="max-w-3xl mx-auto px-4 py-10 space-y-10"
    >
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Gallery</h1>
        <div className="flex items-center gap-3">
          <Badge tone={reduced ? 'amber' : 'muted'}>
            reduced motion: {reduced ? 'on' : 'off'}
          </Badge>
          <ArcadeButton
            variant="ghost"
            onClick={() => {
              sfx.setMuted(!muted);
              setMuted(!muted);
            }}
          >
            {muted ? 'Unmute' : 'Mute'} SFX
          </ArcadeButton>
        </div>
      </header>

      <Section title="Tokens — palette">
        <div className="flex flex-wrap gap-3">
          {SWATCHES.map(([name, cssVar]) => (
            <div key={name} className="text-center">
              <div
                className="w-16 h-16 rounded-arcade border-3 border-arcade-border"
                style={{ backgroundColor: cssVar }}
              />
              <span className="text-xs text-arcade-muted">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tokens — type scale">
        <p className="font-display text-5xl">Display / Archivo Black</p>
        <p className="font-display text-2xl">Heading weight</p>
        <p className="text-base">Body — Inter / system-ui for UI copy and reveals.</p>
        <p className="text-sm text-arcade-muted">Muted small text for hints.</p>
      </Section>

      <Section title="Buttons (press for SFX hook)">
        <div className="flex flex-wrap gap-4 items-center">
          <ArcadeButton>Primary</ArcadeButton>
          <ArcadeButton variant="accent">Accent</ArcadeButton>
          <ArcadeButton variant="ghost">Ghost</ArcadeButton>
          <ArcadeButton size="lg">Large</ArcadeButton>
          <ArcadeButton disabled>Disabled</ArcadeButton>
        </div>
      </Section>

      <Section title="Cards & badges">
        <SurfaceCard className="space-y-2">
          <div className="flex gap-2">
            <Badge>Primary</Badge>
            <Badge tone="lime">Lime</Badge>
            <Badge tone="amber">Amber</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="muted">Muted</Badge>
          </div>
          <p className="text-arcade-muted text-sm">
            A raised surface with the chunky border + hard shadow treatment.
          </p>
        </SurfaceCard>
      </Section>

      <Section title="Timer ring">
        <div className="flex items-center gap-6">
          <TimerRing remaining={ringDemo} label={Math.round(ringDemo * 30) + 's'} />
          <TimerRing remaining={0.15} label="4s" />
          <label className="flex items-center gap-2 text-sm text-arcade-muted">
            drag
            <input
              type="range"
              min={0}
              max={100}
              value={ringDemo * 100}
              onChange={(e) => setRingDemo(Number(e.target.value) / 100)}
            />
          </label>
        </div>
      </Section>

      <Section title="Score display">
        <div className="flex items-end gap-8">
          <ScoreDisplay score={4870} />
          <ScoreDisplay score={23450} max={25000} size="xl" />
        </div>
      </Section>

      <Section title="Motion showcase">
        <div className="flex items-center gap-4">
          <motion.div
            key={replayKey}
            variants={reduced ? popInReduced : popIn}
            initial="initial"
            animate="enter"
            className="w-20 h-20 rounded-arcade bg-arcade-primary border-3 border-arcade-border shadow-chunk"
          />
          <ArcadeButton variant="ghost" onClick={() => setReplayKey((k) => k + 1)}>
            Replay transition
          </ArcadeButton>
        </div>
      </Section>

      <Section title="Modals">
        <div className="flex gap-4">
          <ArcadeButton onClick={() => setModalOpen(true)}>Open modal</ArcadeButton>
          <ArcadeButton variant="ghost" onClick={() => setAuthOpen(true)}>
            Open auth modal
          </ArcadeButton>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="max-w-sm space-y-2">
          <Input placeholder="Focus me with Tab — visible ring required" />
        </div>
      </Section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal">
        <p className="text-arcade-muted mb-4">
          Escape closes. Backdrop click closes. Focus lands here on open.
        </p>
        <ArcadeButton onClick={() => setModalOpen(false)}>Done</ArcadeButton>
      </Modal>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </motion.main>
  );
}
