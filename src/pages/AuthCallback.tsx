import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { getSupabase } from '@/lib/supabase';

/**
 * Magic link / OAuth redirect landing (Epic 01, step 6). Handles error
 * query params (expired or invalid links, plan edge case E2) instead of
 * spinning forever.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase appends errors as query or hash params on failed links.
    const params = new URLSearchParams(
      window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.search,
    );
    const errDescription =
      params.get('error_description') ?? params.get('error') ?? null;
    if (errDescription) {
      setError(errDescription.replace(/\+/g, ' '));
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError('Backend not configured.');
      return;
    }

    // detectSessionInUrl handles the token exchange; wait for a session,
    // with a timeout so a dead link cannot hang the page.
    const timeout = window.setTimeout(() => {
      setError('This sign-in link did not work. It may have expired.');
    }, 8000);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        window.clearTimeout(timeout);
        navigate('/', { replace: true });
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.clearTimeout(timeout);
        navigate('/', { replace: true });
      }
    });

    return () => {
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <SurfaceCard className="max-w-md w-full text-center">
        {error ? (
          <>
            <h1 className="font-display text-xl mb-2 text-arcade-accent">
              Sign-in failed
            </h1>
            <p className="text-arcade-muted mb-4">{error}</p>
            <Link to="/" className="text-arcade-primary-hot underline">
              Back home — request a new link
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl mb-2">Signing you in…</h1>
            <p className="text-arcade-muted">One moment.</p>
          </>
        )}
      </SurfaceCard>
    </main>
  );
}
