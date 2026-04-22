import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';
import { usePvpStore } from '../../store/pvpStore';
import { findMatch } from '../../lib/pvp';
import { generateColorCombination } from '../../lib/colorGenerator';
import { getRandomWord } from '../../lib/kerning';
import PageTransition from '../../components/layout/PageTransition';

const TEXT_SAMPLES = [
  "Visual Hierarchy", "Aesthetic Usability", "Contrast Matters",
  "Accessibility", "Design Sight", "Color Theory",
  "Proximity Principle", "User Experience", "Readability"
];

export default function Matchmaking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get('gameId') || 'contrast-checker';
  
  const { username, tag } = useUserStore();
  const { setCurrentMatch, resetPvp } = usePvpStore();
  
  const [status, setStatus] = useState<'searching' | 'timeout' | 'error'>('searching');
  const [error, setError] = useState<string | null>(null);

  const startMatchmaking = async () => {
    if (!username || !tag) {
      setError('Username not set');
      setStatus('error');
      return;
    }

    setStatus('searching');
    setError(null);

    // Generate questions for the first player
    let questions: any[] = [];
    if (gameId === 'contrast-checker') {
      questions = Array.from({ length: 20 }, () => {
        const combo = generateColorCombination();
        return {
          background: combo.backgroundStr,
          foreground: combo.foregroundColor,
          ratio: combo.ratio,
          passes: combo.passesNormal,
          text: TEXT_SAMPLES[Math.floor(Math.random() * TEXT_SAMPLES.length)]
        };
      });
    } else {
      questions = Array.from({ length: 10 }, () => getRandomWord([]));
    }

    const fullUsername = `${username}#${tag}`;
    const matchId = await findMatch(fullUsername, gameId, questions);

    if (matchId) {
      setCurrentMatch(matchId);
      navigate(`/pvp/lobby/${matchId}`);
    } else {
      setError('Could not connect to matchmaking server.');
      setStatus('error');
    }
  };

  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    resetPvp();
    startMatchmaking();
    
    const timeout = setTimeout(() => {
      setStatus(prev => prev === 'searching' ? 'timeout' : prev);
    }, 30000);

    return () => clearTimeout(timeout);
  }, [gameId, username, tag]);

  return (
    <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto px-6">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8 relative">
        {status === 'searching' && (
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        <Users className="w-10 h-10 text-primary" />
      </div>

      <h1 className="text-3xl font-black mb-2 text-center">
        {status === 'searching' ? 'Finding Opponent' : 
         status === 'timeout' ? 'No Match Found' : 'Matchmaking Error'}
      </h1>
      
      <p className="text-text-secondary text-center mb-10">
        {status === 'searching' ? `Looking for a worthy designer to play ${gameId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}...` :
         status === 'timeout' ? "We couldn't find anyone playing right now. Try again or invite a friend!" :
         error || "Something went wrong while trying to find a match."}
      </p>

      {status === 'searching' ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-3 bg-surface border border-border px-4 py-3 rounded-xl w-full">
            <Search className="w-5 h-5 text-text-secondary animate-pulse" />
            <span className="text-sm font-medium animate-pulse">Scanning the design world...</span>
          </div>
          <Button variant="secondary" className="w-full h-12" onClick={() => navigate('/')}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          <Button className="w-full h-12" onClick={startMatchmaking}>
            Try Again
          </Button>
          <Button variant="secondary" className="w-full h-12" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      )}
    </PageTransition>
  );
}
