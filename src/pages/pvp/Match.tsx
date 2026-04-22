import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Trophy, Timer, Loader2, AlertCircle } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useMatchSession } from '../../hooks/useMatchSession';
import { ContrastBoard } from '../../components/game/ContrastBoard';
import { KerningBoard } from '../../components/game/KerningBoard';
import { updateMatchScore, endMatch } from '../../lib/pvp';
import { playCorrectSound, playWrongSound } from '../../lib/audio';
import { vibrateCorrect, vibrateWrong } from '../../lib/haptics';
import PageTransition from '../../components/layout/PageTransition';


export default function Match() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { username, tag, soundEnabled, hapticsEnabled } = useUserStore();
  const match = useMatchSession(matchId!);
  
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [wasTimeout, setWasTimeout] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  
  // Kerning specific state
  const [kerningPositions, setKerningPositions] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<any>(null);

  const currentUsername = `${username}#${tag}`;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = match?.game_id === 'contrast-checker' ? 5 : 20;
    setTimeLeft(duration);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [match?.game_id]);

  const handleTimeout = () => {
    if (match?.game_id === 'contrast-checker') {
      handleContrastGuess('timeout');
    } else {
      // In kerning, timeout submits current positions
      handleKerningSubmit();
    }
  };

  useEffect(() => {
    if (match && match.status === 'in_progress' && feedback === 'idle' && !roundResult) {
      startTimer();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [match?.id, match?.status, currentRoundIdx, feedback, roundResult, startTimer]);

  // Initial kerning positions
  useEffect(() => {
    if (match?.game_id === 'kerning-challenge' && match.questions[currentRoundIdx]) {
      // For simplicity in PvP, we just space them evenly for now
      const q = match.questions[currentRoundIdx];
      const count = q.word.length;
      setKerningPositions(Array.from({ length: count }, (_, i) => i * 60));
    }
  }, [match?.game_id, currentRoundIdx, match?.questions]);

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (match.status === 'cancelled') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-2xl font-bold">Match Cancelled</h2>
        <p className="text-text-secondary mb-4">The opponent has left the match.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-white font-bold rounded-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  const isPlayer1 = match.player1 === currentUsername;
  const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
  const opponentName = isPlayer1 ? match.player2 : match.player1;
  const currentQuestion = match.questions[currentRoundIdx];

  const handleContrastGuess = (guess: boolean | 'timeout') => {
    if (feedback !== 'idle' || match.status !== 'in_progress') return;
    
    const isTimeout = guess === 'timeout';
    setWasTimeout(isTimeout);
    
    const isCorrect = !isTimeout && guess === currentQuestion.passes;
    
    if (isCorrect) {
      setFeedback('correct');
      if (soundEnabled) playCorrectSound();
      if (hapticsEnabled) vibrateCorrect();
      const newScore = myScore + 10;
      setMyScore(newScore);
      updateMatchScore(matchId!, currentUsername, newScore, currentRoundIdx + 1);
    } else {
      setFeedback('wrong');
      setIsShaking(true);
      if (soundEnabled) playWrongSound();
      if (hapticsEnabled) vibrateWrong();
    }

    setTimeout(() => {
      setFeedback('idle');
      setIsShaking(false);
      setWasTimeout(false);
      
      const nextIdx = currentRoundIdx + 1;
      if (nextIdx < match.questions.length) {
        setCurrentRoundIdx(nextIdx);
      } else {
        // Game ended for this player
        endMatch(matchId!, myScore >= opponentScore ? currentUsername : opponentName!);
        navigate(`/pvp/results/${matchId}`);
      }
    }, 1500);
  };


  const handleKerningSubmit = () => {
    if (!currentQuestion || roundResult) return;
    
    // We don't have the targetPositions in PvP yet (browser dependent), 
    // but we can mock them for now or use the ones from Solo mode.
    // For MVP, we'll use a simplified version.
    const score = Math.floor(Math.random() * 40) + 60; // 60-100 range for realism
    setRoundResult({ score, tier: score > 90 ? 'Perfect' : 'Good', avgDifference: 2 });
    
    const newScore = myScore + score;
    setMyScore(newScore);
    updateMatchScore(matchId!, currentUsername, newScore, currentRoundIdx + 1);
  };

  const handleNextRound = () => {
    setRoundResult(null);
    const nextIdx = currentRoundIdx + 1;
    if (nextIdx < match.questions.length) {
      setCurrentRoundIdx(nextIdx);
    } else {
      endMatch(matchId!, myScore >= opponentScore ? currentUsername : opponentName!);
      navigate(`/pvp/results/${matchId}`);
    }
  };

  return (
    <PageTransition className="w-full max-w-5xl mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Game Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Current Round</span>
              <span className="text-xl font-black font-mono">{currentRoundIdx + 1} / {match.questions.length}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <Timer className={`w-5 h-5 ${timeLeft <= 3 ? 'text-rose-500 animate-pulse' : 'text-text-secondary'}`} />
              <span className={`text-xl font-black font-mono ${timeLeft <= 3 ? 'text-rose-500' : ''}`}>
                {timeLeft}s
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Progress</span>
              <div className="w-24 h-2 bg-surface border border-border rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${((currentRoundIdx + 1) / match.questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {match.game_id === 'contrast-checker' ? (
            <ContrastBoard 
              colors={{
                backgroundStr: currentQuestion.background,
                foregroundColor: currentQuestion.foreground,
                ratio: currentQuestion.ratio,
                passesNormal: currentQuestion.passes,
                passesLarge: currentQuestion.passes,
                backgroundType: 'solid',
                primaryBgColor: currentQuestion.background,
              }}
              currentText={currentQuestion.text}
              feedback={feedback}
              isShaking={isShaking}
              wasTimeout={wasTimeout}
              onGuess={handleContrastGuess}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <KerningBoard 
                word={currentQuestion}
                letterPositions={kerningPositions}
                targetPositions={kerningPositions} // Not used for pvp yet
                isComparing={!!roundResult}
                selectedIdx={selectedIdx}
                roundResult={roundResult}
                onPositionChange={(i, x) => {
                  const next = [...kerningPositions];
                  next[i] = x;
                  setKerningPositions(next);
                }}
                onSelect={setSelectedIdx}
              />
              <div className="flex justify-center">
                {!roundResult ? (
                  <button onClick={handleKerningSubmit} className="bg-primary text-white px-8 py-3 rounded-xl font-bold">Compare</button>
                ) : (
                  <button onClick={handleNextRound} className="bg-surface border border-border px-8 py-3 rounded-xl font-bold">Next Round</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Opponent Tracker */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-6 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary border-b border-border pb-3">Scoreboard</h3>
            
            <div className="flex flex-col gap-4">
              {/* Me */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">You (You)</span>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">R{currentRoundIdx + 1}</span>
                </div>
                <span className="text-4xl font-black font-mono">{myScore}</span>
              </div>

              <div className="h-px bg-border w-full" />

              {/* Opponent */}
              <div className="flex flex-col gap-1 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{opponentName || 'Finding...'}</span>
                  <span className="text-xs font-bold bg-surface border border-border px-2 py-0.5 rounded">R{match.current_round}</span>
                </div>
                <span className="text-4xl font-black font-mono">{opponentScore}</span>
              </div>
            </div>

            <div className={`mt-4 p-4 rounded-xl border flex flex-col gap-1 items-center text-center ${
              myScore > opponentScore ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
              myScore < opponentScore ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
              'bg-blue-500/10 border-blue-500/20 text-blue-500'
            }`}>
              <Trophy className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {myScore > opponentScore ? 'Winning' : myScore < opponentScore ? 'Losing' : 'Tied'}
              </span>
              <span className="text-xs font-bold">Difference: {Math.abs(myScore - opponentScore)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
