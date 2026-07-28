import { useEffect, useState, type ComponentType } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Home } from '@/pages/Home';
import { Gallery } from '@/pages/Gallery';
import { AuthCallback } from '@/pages/AuthCallback';
import { Play } from '@/pages/Play';
import { useSession } from '@/state/session';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
    </AnimatePresence>
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
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
