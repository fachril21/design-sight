import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, Loader2, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';
import { usePvpStore } from '../../store/pvpStore';
import { useMatchSession } from '../../hooks/useMatchSession';
import { updateMatchReady, leaveMatch } from '../../lib/pvp';
import PageTransition from '../../components/layout/PageTransition';

export default function Lobby() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { username, tag } = useUserStore();
  const { setOpponent } = usePvpStore();
  const match = useMatchSession(matchId!);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const currentUsername = `${username}#${tag}`;

  useEffect(() => {
    if (!match) return;

    // Track opponent
    const opponent = match.player1 === currentUsername ? match.player2 : match.player1;
    if (opponent) setOpponent(opponent);

    // Start countdown when both ready
    if (match.player1_ready && match.player2_ready && countdown === null) {
      setCountdown(5);
    }
  }, [match, currentUsername, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate(`/pvp/match/${matchId}`);
    }
  }, [countdown, matchId, navigate]);

  const handleLeave = async () => {
    if (matchId) {
      await leaveMatch(matchId, currentUsername);
    }
    navigate('/');
  };

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-text-secondary">Connecting to match lobby...</p>
      </div>
    );
  }

  if (match.status === 'cancelled') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-2xl font-bold">Match Cancelled</h2>
        <p className="text-text-secondary mb-4">The opponent has left the lobby.</p>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const isPlayer1 = match.player1 === currentUsername;
  const amReady = isPlayer1 ? match.player1_ready : match.player2_ready;
  const opponentReady = isPlayer1 ? match.player2_ready : match.player1_ready;
  const opponentName = isPlayer1 ? match.player2 : match.player1;

  const toggleReady = () => {
    updateMatchReady(matchId!, currentUsername, !amReady);
  };

  return (
    <PageTransition className="flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto px-6">
      <h1 className="text-4xl font-black mb-12 text-center uppercase tracking-tighter">
        Pre-Match Lobby
      </h1>

      <div className="grid grid-cols-3 items-center w-full gap-8 mb-16">
        {/* Player 1 */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-surface border-2 border-border rounded-full flex items-center justify-center relative overflow-hidden">
            <User className="w-12 h-12 text-text-secondary" />
            {match.player1_ready && (
              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{match.player1}</p>
            <p className={`text-xs font-bold uppercase tracking-widest ${match.player1_ready ? 'text-emerald-500' : 'text-text-secondary'}`}>
              {match.player1_ready ? 'READY' : 'WAITING'}
            </p>
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center font-black text-sm bg-background">
            VS
          </div>
        </div>

        {/* Player 2 */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-surface border-2 border-border rounded-full flex items-center justify-center relative overflow-hidden">
            {!match.player2 ? (
              <Loader2 className="w-10 h-10 animate-spin text-text-secondary" />
            ) : (
              <>
                <User className="w-12 h-12 text-text-secondary" />
                {match.player2_ready && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{match.player2 || 'Finding...'}</p>
            <p className={`text-xs font-bold uppercase tracking-widest ${match.player2_ready ? 'text-emerald-500' : 'text-text-secondary'}`}>
              {match.player2_ready ? 'READY' : 'WAITING'}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {countdown !== null ? (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center mb-12"
          >
            <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Match Starting In</span>
            <span className="text-8xl font-black font-mono text-primary leading-none">{countdown}</span>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Button 
              size="lg" 
              className={`h-14 text-lg ${amReady ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={toggleReady}
              disabled={!match.player2}
            >
              {amReady ? 'Ready!' : 'I\'m Ready'}
            </Button>
            <Button variant="secondary" size="lg" className="h-12" onClick={handleLeave}>
              Leave Lobby
            </Button>
          </div>
        )}
      </AnimatePresence>

      <p className="mt-12 text-sm text-text-secondary text-center max-w-xs leading-relaxed">
        Wait for your opponent to click "Ready" to start the match.
      </p>
    </PageTransition>
  );
}
