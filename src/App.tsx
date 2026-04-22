import { Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Home from './pages/Home';
import ContrastGame from './pages/ContrastGame';
import KerningGame from './pages/KerningGame';
import Leaderboard from './pages/Leaderboard';
import Matchmaking from './pages/pvp/Matchmaking';
import Lobby from './pages/pvp/Lobby';
import Match from './pages/pvp/Match';
import Results from './pages/pvp/Results';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="game/contrast" element={<ContrastGame />} />
        <Route path="game/kerning-challenge" element={<KerningGame />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        
        {/* PvP Routes */}
        <Route path="pvp/matchmaking" element={<Matchmaking />} />
        <Route path="pvp/lobby/:matchId" element={<Lobby />} />
        <Route path="pvp/match/:matchId" element={<Match />} />
        <Route path="pvp/results/:matchId" element={<Results />} />
      </Route>
    </Routes>
  );
}

export default App;
