import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.setState({
      score: 0,
      highScore: 0,
      streak: 0,
      bestStreak: 0,
      correctAnswers: 0,
      totalAnswers: 0
    });
  });

  it('initializes with zero points', () => {
    const state = useGameStore.getState();
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
  });

  it('increases score by 10 on first correct answer', () => {
    const { incrementScore } = useGameStore.getState();
    const result = incrementScore();
    
    expect(result.pointsAdded).toBe(10);
    expect(result.newStreak).toBe(1);
    
    const state = useGameStore.getState();
    expect(state.score).toBe(10);
    expect(state.streak).toBe(1);
    expect(state.correctAnswers).toBe(1);
    expect(state.totalAnswers).toBe(1);
  });

  it('applies multipliers correctly on streaks', () => {
    // Streak 1-4 (1x multiplier = 10 pts each)
    for (let i = 0; i < 4; i++) {
        useGameStore.getState().incrementScore();
    }
    expect(useGameStore.getState().score).toBe(40);
    
    // Streak 5 (1.5x multiplier = 15 pts)
    const res5 = useGameStore.getState().incrementScore();
    expect(res5.pointsAdded).toBe(15);
    expect(res5.newStreak).toBe(5);
    expect(useGameStore.getState().score).toBe(55);

    // Get to Streak 10 (2x multiplier)
    for (let i = 6; i < 10; i++) useGameStore.getState().incrementScore();
    const res10 = useGameStore.getState().incrementScore();
    expect(res10.pointsAdded).toBe(20);
    expect(res10.newStreak).toBe(10);
  });

  it('decrements score by 5 and resets streak on wrong answer', () => {
    useGameStore.setState({ score: 20, streak: 3, totalAnswers: 3 });
    
    useGameStore.getState().decrementScore();
    
    const state = useGameStore.getState();
    expect(state.score).toBe(15);
    expect(state.streak).toBe(0);
    expect(state.totalAnswers).toBe(4);
  });

  it('does not drop score below zero', () => {
    useGameStore.setState({ score: 2 });
    useGameStore.getState().decrementScore();
    
    expect(useGameStore.getState().score).toBe(0);
  });

  it('resets game context correctly without clearing high scores', () => {
    useGameStore.setState({ 
        score: 100, 
        highScore: 200, 
        streak: 10, 
        bestStreak: 10,
        correctAnswers: 10,
        totalAnswers: 15
    });
    
    useGameStore.getState().resetGame();
    
    const state = useGameStore.getState();
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.totalAnswers).toBe(0);
    expect(state.highScore).toBe(200); // Keeps high score
  });
});
