import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Null-safe Supabase client (Epic 01 plan, step 4). The app must boot and
 * stay usable in guest-only mode when env vars are absent — auth UI degrades
 * with an explanatory message instead of crashing.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;
if (url && anonKey) {
  client = createClient(url, anonKey);
}

export function getSupabase(): SupabaseClient | null {
  return client;
}

export function isSupabaseConfigured(): boolean {
  return client !== null;
}
