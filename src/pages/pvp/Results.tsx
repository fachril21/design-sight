import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Share2, Home, RefreshCw, Star, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';
import { useMatchSession } from '../../hooks/useMatchSession';
import { fetchMatchSession } from '../../lib/pvp';
import PageTransition from '../../components/layout/PageTransition';

export default function Results() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { username, tag } = useUserStore();
  const [match, setMatch] = useState<any>(null);
  const currentUsername = `${username}#${tag}`;

  useEffect(() => {
    if (matchId) {
      fetchMatchSession(matchId).then(setMatch);
    }
  }, [matchId]);

  if (!match) return null;

  const myScore = match.player1 === currentUsername ? match.player1_score : match.player2_score;
  const opponentScore = match.player1 === currentUsername ? match.player2_score : match.player1_score;
  const opponentName = match.player1 === currentUsername ? match.player2 : match.player1;
  const isWinner = myScore > opponentScore;
  const isTie = myScore === opponentScore;

  return (
    <PageTransition className="flex flex-col items-center justify-center min-h-[80vh] max-w-2xl mx-auto px-6 py-12">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center mb-12 text-center"
      >
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
          isWinner ? 'bg-amber-500/10 text-amber-500' : isTie ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
        }`}>
          {isWinner ? <Trophy className="w-12 h-12" /> : isTie ? <Star className="w-12 h-12" /> : <Star className="w-12 h-12 opacity-50" />}
        </div>
        
        <h1 className="text-5xl font-black mb-2 uppercase tracking-tighter italic">
          {isWinner ? 'Victory!' : isTie ? 'It\'s a Tie!' : 'Defeat'}
        </h1>
        <p className="text-text-secondary font-medium tracking-wide uppercase text-sm">
          {match.game_id.replace('-', ' ')} • Match Results
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
        {/* Me */}
        <div className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 ${
          isWinner ? 'border-amber-500/50 bg-amber-500/5' : 'border-border bg-surface'
        }`}>
          <div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-text-secondary" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm text-text-secondary uppercase tracking-widest mb-1">Your Score</p>
            <p className="text-6xl font-black font-mono">{myScore}</p>
            <p className="mt-2 text-sm font-bold text-primary italic">You</p>
          </div>
        </div>

        {/* Opponent */}
        <div className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 ${
          !isWinner && !isTie ? 'border-rose-500/50 bg-rose-500/5' : 'border-border bg-surface'
        }`}>
          <div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-text-secondary" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm text-text-secondary uppercase tracking-widest mb-1">Opponent Score</p>
            <p className="text-6xl font-black font-mono">{opponentScore}</p>
            <p className="mt-2 text-sm font-bold text-text-secondary truncate max-w-[150px]">{opponentName}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button size="lg" className="h-14 text-lg gap-2" onClick={() => navigate(`/pvp/matchmaking?gameId=${match.game_id}`)}>
          <RefreshCw size={20} /> Play Again
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" className="h-12 gap-2">
            <Share2 size={18} /> Share
          </Button>
          <Button variant="secondary" size="lg" className="h-12 gap-2" onClick={() => navigate('/')}>
            <Home size={18} /> Home
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
