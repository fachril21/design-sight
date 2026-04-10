import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  score: number;
  highScore: number;
  streak: number;
  
  // Epic 7 metrics
  bestStreak: number;
  correctAnswers: number;
  totalAnswers: number;
  
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
      bestStreak: 0,
      correctAnswers: 0,
      totalAnswers: 0,

      incrementScore: () => {
        const { score, streak, highScore, bestStreak, correctAnswers, totalAnswers } = get();
        
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
          highScore: Math.max(highScore, newScore),
          bestStreak: Math.max(bestStreak, newStreak),
          correctAnswers: correctAnswers + 1,
          totalAnswers: totalAnswers + 1
        });

        return { pointsAdded, newStreak };
      },

      decrementScore: () => {
        const { score, totalAnswers } = get();
        // Minus 5, minimum 0
        const newScore = Math.max(0, score - 5);
        set({ 
          score: newScore, 
          streak: 0,
          totalAnswers: totalAnswers + 1 
        });
      },

      resetGame: () => {
        set({ 
          score: 0, 
          streak: 0,
          bestStreak: 0,
          correctAnswers: 0,
          totalAnswers: 0
        });
      }
    }),
    {
      name: 'design-sight-game-storage',
      partialize: (state) => ({ highScore: state.highScore }),
    }
  )
);
