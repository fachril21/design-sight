import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Game Hub</h1>
        <p className="text-text-secondary">Welcome to DesignSight. Select a game to begin training your design eye.</p>
      </div>

      <div className="flex flex-col gap-10 mt-2">
        {/* Featured Game Card - Hero style */}
        <Card hoverEffect className="flex flex-col border-accent/20 shadow-sm relative overflow-hidden bg-surface/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-purple-500" />
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 flex flex-col p-6 md:p-8">
              <CardTitle className="text-3xl md:text-4xl mb-4 text-text-primary">Contrast Checker</CardTitle>
              <CardDescription className="text-lg md:text-xl mb-8 max-w-xl text-text-secondary leading-relaxed">
                Test your eye for WCAG contrast compliance in this fast-paced arcade game. How long can you maintain your streak?
              </CardDescription>
              <div className="mt-auto pt-4">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg shadow-lg hover:shadow-accent/25 transition-all duration-300" onClick={() => navigate('/game/contrast')}>
                  Play Now
                </Button>
              </div>
            </div>
            <div className="hidden md:flex md:w-2/5 bg-background/50 border-l border-border/50 items-center justify-center p-8">
               <div className="w-full aspect-square max-w-[220px] rounded-2xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <span className="text-7xl drop-shadow-2xl">⚡️</span>
               </div>
            </div>
          </div>
        </Card>
        
        {/* Coming Soon Games Grid */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Coming Soon</h2>
            <div className="h-px bg-border/50 flex-1 mt-1"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Kerning Challenge", desc: "Perfect your letter spacing skills.", icon: "🔤" },
              { title: "Shadow Matcher", desc: "Spot the correct elevation patterns.", icon: "📐" },
              { title: "Golden Ratio", desc: "Train your eye for perfect proportions.", icon: "✨" },
              { title: "Font Pairing", desc: "Match typefaces for optimal hierarchy.", icon: "Aa" }
            ].map(game => (
              <Card key={game.title} className="flex flex-col opacity-70 border-dashed bg-background/50 transition-colors">
                <CardHeader className="flex flex-row gap-4 items-start pb-2">
                  <div className="text-3xl bg-surface p-3 rounded-xl border border-border/50">{game.icon}</div>
                  <div className="flex flex-col gap-1 mt-1">
                    <CardTitle className="text-xl text-text-primary">{game.title}</CardTitle>
                    <CardDescription>{game.desc}</CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="mt-auto pt-6">
                  <div className="bg-surface/80 text-text-secondary rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase border border-border/50">
                    In Development
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
