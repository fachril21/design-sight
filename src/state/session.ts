import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getOrCreateGuestId, peekGuestId, upgradeGuestToAccount } from '@/lib/guestStorage';

export interface Profile {
  id: string;
  handle: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak: number;
  streak_freezes: number;
}

interface SessionState {
  status: 'loading' | 'guest' | 'authed';
  user: User | null;
  profile: Profile | null;
  guestId: string | null;
  supabaseConfigured: boolean;
  /** Bootstraps auth listeners; call once from App. */
  init: () => void;
  ensureGuestId: () => string;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, avatar_url, xp, level, streak, streak_freezes')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('[session] profile fetch failed:', error.message);
    return null;
  }
  return data as Profile;
}

export const useSession = create<SessionState>((set, get) => ({
  status: 'loading',
  user: null,
  profile: null,
  guestId: peekGuestId(),
  supabaseConfigured: isSupabaseConfigured(),

  init: () => {
    const supabase = getSupabase();
    if (!supabase) {
      // No backend configured: permanent guest mode (plan edge case E1).
      set({ status: 'guest' });
      return;
    }

    const applySession = async (session: Session | null) => {
      if (session?.user) {
        // Guest -> account upgrade happens on every sign-in; it is
        // idempotent and a no-op when there is no guest history (E8).
        upgradeGuestToAccount(session.user.id);
        set({ status: 'authed', user: session.user, guestId: null });
        const profile = await fetchProfile(session.user.id);
        set({ profile });
      } else {
        set({ status: 'guest', user: null, profile: null });
      }
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });
  },

  ensureGuestId: () => {
    const id = getOrCreateGuestId();
    set({ guestId: id });
    return id;
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await fetchProfile(user.id);
    set({ profile });
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    set({ status: 'guest', user: null, profile: null, guestId: peekGuestId() });
  },
}));
