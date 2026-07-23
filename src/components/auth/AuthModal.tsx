import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { Input } from '@/components/ui/Input';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useSession } from '@/state/session';

const RESEND_COOLDOWN_S = 60;

type Phase = 'idle' | 'sending' | 'sent' | 'error';

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Magic link + Google OAuth + guest escape hatch (Epic 01, US1.3).
 * Degrades to an explanatory message when Supabase is not configured
 * (plan edge case E1). Errors surface as readable text (E4), and repeat
 * magic-link sends are blocked by a visible cooldown countdown.
 */
export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<number | null>(null);
  const ensureGuestId = useSession((s) => s.ensureGuestId);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current !== null) window.clearInterval(cooldownTimer.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_S);
    cooldownTimer.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && cooldownTimer.current !== null) {
          window.clearInterval(cooldownTimer.current);
          cooldownTimer.current = null;
        }
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  const sendMagicLink = async () => {
    const supabase = getSupabase();
    if (!supabase || cooldown > 0) return;
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('That does not look like an email address.');
      return;
    }
    setPhase('sending');
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setPhase('error');
      setError(
        err.status === 429
          ? 'Too many requests — wait a minute and try again.'
          : err.message,
      );
      return;
    }
    setPhase('sent');
    startCooldown();
  };

  const signInWithGoogle = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser redirects away; an error means we stay here
    // (popup blocked / user cancelled) and must recover to idle (E5).
    if (err) {
      setPhase('idle');
      setError(err.message);
    }
  };

  const playAsGuest = () => {
    ensureGuestId();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Join Design Sight">
      {!isSupabaseConfigured() ? (
        <div className="space-y-4">
          <p className="text-arcade-muted">
            Sign in is unavailable — the backend is not configured yet. You can
            still play as a guest; your progress stays on this device.
          </p>
          <ArcadeButton variant="ghost" onClick={playAsGuest} className="w-full">
            Play as guest
          </ArcadeButton>
        </div>
      ) : (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMagicLink();
            }}
            className="space-y-2"
          >
            <label htmlFor="auth-email" className="block text-sm text-arcade-muted">
              Email — we will send you a magic link
            </label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={phase === 'sending'}
            />
            <ArcadeButton
              type="submit"
              className="w-full"
              disabled={phase === 'sending' || cooldown > 0}
            >
              {phase === 'sending'
                ? 'Sending…'
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : phase === 'sent'
                    ? 'Resend link'
                    : 'Send magic link'}
            </ArcadeButton>
          </form>

          {phase === 'sent' && (
            <p role="status" className="text-arcade-lime text-sm">
              Check your inbox — the link signs you in on this device.
            </p>
          )}
          {error && (
            <p role="alert" className="text-arcade-accent text-sm">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 text-arcade-muted text-xs uppercase">
            <span className="h-px flex-1 bg-arcade-border" /> or
            <span className="h-px flex-1 bg-arcade-border" />
          </div>

          <ArcadeButton variant="ghost" onClick={() => void signInWithGoogle()} className="w-full">
            Continue with Google
          </ArcadeButton>
          <ArcadeButton variant="ghost" onClick={playAsGuest} className="w-full">
            Play as guest
          </ArcadeButton>
        </div>
      )}
    </Modal>
  );
}
