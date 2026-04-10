import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Game Hub</h1>
        <p className="text-text-secondary">Welcome to DesignSight. Select a game to begin training your design eye.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <Card hoverEffect className="flex flex-col border-accent/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-purple-500" />
          <CardHeader>
            <CardTitle className="text-2xl">Contrast Checker</CardTitle>
            <CardDescription className="mt-2 text-base">
              Test your eye for WCAG contrast compliance in this fast-paced arcade game.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end min-h-[80px]">
             {/* We can put an image or graphic here in the future */}
          </CardContent>
          <CardFooter>
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/game/contrast')}>
              Play Now
            </Button>
          </CardFooter>
        </Card>
        
        {/* Placeholder Coming Soon Games */}
        {[
          { title: "Kerning Challenge", desc: "Perfect your letter spacing skills." },
          { title: "Shadow Matcher", desc: "Spot the correct elevation patterns." },
          { title: "Golden Ratio", desc: "Train your eye for perfect proportions." }
        ].map(game => (
          <Card key={game.title} className="flex flex-col opacity-75 border-dashed bg-background">
            <CardHeader>
              <CardTitle className="text-xl text-text-secondary">{game.title}</CardTitle>
              <CardDescription>{game.desc}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <div className="bg-surface text-text-secondary rounded-lg px-4 py-2 text-sm font-medium border border-border">
                Coming Soon
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-semibold mb-4">Epic 2 Component Tests</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => setIsTestModalOpen(true)}>Open Test Modal</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </div>

      <Modal 
        isOpen={isTestModalOpen} 
        onClose={() => setIsTestModalOpen(false)}
        title="Epic 2 Shared Components"
        description="This modal demonstrates the smooth spring animation from our new design system using Framer Motion."
      >
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-text-primary">
            The modal locks background scrolling, responds to the Escape key, and can be closed by clicking the backdrop.
          </p>
          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={() => setIsTestModalOpen(false)}>Close Modal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
