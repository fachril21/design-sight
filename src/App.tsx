import { Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Home from './pages/Home';
import ContrastGame from './pages/ContrastGame';
import KerningGame from './pages/KerningGame';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="game/contrast" element={<ContrastGame />} />
        <Route path="game/kerning-challenge" element={<KerningGame />} />
        <Route path="leaderboard" element={<Leaderboard />} />
      </Route>
    </Routes>
  );
}

export default App;
