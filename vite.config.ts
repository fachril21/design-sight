/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
    // Force the offline referee in unit tests regardless of .env.local.
    // Vite loads .env.local into `test` mode the same as `dev`, so once
    // real Supabase credentials exist for manual testing, tests silently
    // started hitting the live (often undeployed) Edge Functions over the
    // network — breaking hermeticity for every payload-purity/referee
    // test, not just the ones added by this epic. Unit tests must never
    // depend on network reachability or deployed backend state.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
});
