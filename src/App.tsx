import { useEffect } from 'react';
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
      </Routes>
    </AnimatePresence>
  );
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
