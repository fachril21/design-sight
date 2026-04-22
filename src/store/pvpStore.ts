import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PvpState {
  currentMatchId: string | null;
  opponentUsername: string | null;
  isHost: boolean;
  
  setCurrentMatch: (matchId: string | null, isHost?: boolean) => void;
  setOpponent: (username: string | null) => void;
  resetPvp: () => void;
}

export const usePvpStore = create<PvpState>()(
  persist(
    (set) => ({
      currentMatchId: null,
      opponentUsername: null,
      isHost: false,

      setCurrentMatch: (matchId, isHost = false) => set({ currentMatchId: matchId, isHost }),
      setOpponent: (username) => set({ opponentUsername: username }),
      resetPvp: () => set({ currentMatchId: null, opponentUsername: null, isHost: false }),
    }),
    {
      name: 'designsight-pvp-storage',
    }
  )
);
