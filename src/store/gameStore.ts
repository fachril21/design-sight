import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  score: number;
  highScore: number;
  streak: number;
  
  incrementScore: () => { pointsAdded: number; newStreak: number };
  decrementScore: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      score: 0,
      highScore: 0,
      streak: 0,

      incrementScore: () => {
        const { score, streak, highScore } = get();
        
        // Increase streak first
        const newStreak = streak + 1;
        
        // Calculate points based on new streak
        let multiplier = 1;
        if (newStreak >= 20) multiplier = 3;
        else if (newStreak >= 15) multiplier = 2.5;
        else if (newStreak >= 10) multiplier = 2;
        else if (newStreak >= 5) multiplier = 1.5;
        
        const pointsAdded = 10 * multiplier;
        const newScore = score + pointsAdded;

        set({ 
          score: newScore, 
          streak: newStreak,
          highScore: Math.max(highScore, newScore)
        });

        return { pointsAdded, newStreak };
      },

      decrementScore: () => {
        const { score } = get();
        // Minus 5, minimum 0
        const newScore = Math.max(0, score - 5);
        set({ score: newScore, streak: 0 });
      },

      resetGame: () => {
        set({ score: 0, streak: 0 });
      }
    }),
    {
      name: 'design-sight-game-storage',
      // We only want to persist highScore, but storing the whole state is also fine.
      // Often games only want highscore stored between full app resets.
      partialize: (state) => ({ highScore: state.highScore }),
    }
  )
);
