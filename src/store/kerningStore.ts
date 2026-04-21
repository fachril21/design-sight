import { create } from 'zustand';
import { getRandomWord, type KerningWord } from '../lib/kerning';

export interface KerningRoundResult {
  word: string;
  score: number;   // 0-100
  tier: string;
}

interface KerningState {
  // Session
  currentWord: KerningWord | null;
  usedIds: string[];
  currentRound: number;       // 1-based
  totalRounds: number;        // fixed at 10
  roundResults: KerningRoundResult[];
  isGameOver: boolean;
  isComparing: boolean;       // showing the "Compare" overlay

  // Actions
  startGame: () => void;
  loadNextWord: () => void;
  setComparing: (v: boolean) => void;
  submitRound: (score: number, tier: string) => void;
  resetGame: () => void;
}

export const useKerningStore = create<KerningState>((set, get) => ({
  currentWord: null,
  usedIds: [],
  currentRound: 1,
  totalRounds: 10,
  roundResults: [],
  isGameOver: false,
  isComparing: false,

  startGame: () => {
    const word = getRandomWord([]);
    set({
      currentWord: word,
      usedIds: [word.id],
      currentRound: 1,
      roundResults: [],
      isGameOver: false,
      isComparing: false,
    });
  },

  loadNextWord: () => {
    const { usedIds, currentRound, totalRounds } = get();
    if (currentRound >= totalRounds) {
      set({ isGameOver: true, isComparing: false });
      return;
    }
    const next = getRandomWord(usedIds);
    set({
      currentWord: next,
      usedIds: [...usedIds, next.id],
      currentRound: currentRound + 1,
      isComparing: false,
    });
  },

  setComparing: (v) => set({ isComparing: v }),

  submitRound: (score, tier) => {
    const { currentWord, roundResults } = get();
    if (!currentWord) return;
    set({
      roundResults: [...roundResults, { word: currentWord.word, score, tier }],
      isComparing: true,
    });
  },

  resetGame: () => {
    set({
      currentWord: null,
      usedIds: [],
      currentRound: 1,
      roundResults: [],
      isGameOver: false,
      isComparing: false,
    });
  },
}));
