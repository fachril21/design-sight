import { useEffect, useState, type ComponentType } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Gallery } from '@/pages/Gallery';
import { AuthCallback } from '@/pages/AuthCallback';
import { Play } from '@/pages/Play';
import { useSession } from '@/state/session';

/**
 * Plain (unanimated) route swapping. This used to wrap <Routes> in
 * AnimatePresence + a location-keyed remount for an exit-fade between
 * pages, but that combination could get permanently stuck mid-transition
 * (URL updates, page never re-renders) — reproduced on a totally plain
 * <Link>, not specific to any one route. Each page's own motion.main
 * still plays its enter animation on mount (that doesn't need
 * AnimatePresence at all); only the page-leaving fade-out is gone.
 * Reliable navigation matters more than a decorative exit transition.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/play/:slug" element={<Play />} />
      {/* Content-authoring tool (Epic 03 plan §2.4) — dev only, dynamically
          imported so it never ends up in the production bundle. */}
      {import.meta.env.DEV && (
        <Route path="/dev/kern-duel-measure" element={<KernDuelMeasureLazy />} />
      )}
    </Routes>
  );
}

function KernDuelMeasureLazy() {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  useEffect(() => {
    void import('@/pages/dev/KernDuelMeasure').then((m) => setComponent(() => m.KernDuelMeasure));
  }, []);
  return Component ? <Component /> : null;
}

export function App() {
  const init = useSession((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
