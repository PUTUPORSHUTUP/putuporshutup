import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Swords, Wallet, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChallengeLanding = () => {
  const navigate = useNavigate();

  const handleChallengeMe = () => {
    navigate('/games');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 text-primary" 
              style={{ 
                textShadow: '0 0 20px hsl(var(--primary))', 
                fontFamily: 'Orbitron, monospace' 
              }}>
            Put Up or Shut Up.
          </h1>
          
          <h2 className="text-2xl md:text-3xl mb-12 text-secondary"
              style={{ fontFamily: 'Orbitron, monospace' }}>
            Skill speaks. Stats prove it. Real rewards, no luck.
          </h2>
          
          <Button 
            onClick={handleChallengeMe}
            size="lg"
            className="text-xl px-8 py-6 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transform hover:scale-105 transition-all duration-200"
            style={{ 
              boxShadow: '0 0 20px hsl(var(--secondary))',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            🎮 Challenge Me Now
          </Button>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            <Card className="bg-card border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-lg font-bold text-foreground" style={{ fontFamily: 'Orbitron, monospace' }}>
                  1️⃣ Connect your Series X in dev mode
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-lg font-bold text-foreground" style={{ fontFamily: 'Orbitron, monospace' }}>
                  2️⃣ Enter a real skill-based challenge
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-lg font-bold text-foreground" style={{ fontFamily: 'Orbitron, monospace' }}>
                  3️⃣ Win. Get paid. No RNG, no excuses
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-muted-foreground">
        <div style={{ fontFamily: 'Orbitron, monospace' }}>
          Built for gamers who don't bluff. | 
          <a href="/terms" className="hover:text-primary transition-colors mx-2">Terms</a> | 
          <a href="/privacy" className="hover:text-primary transition-colors mx-2">Privacy</a> | 
          <a href="/support" className="hover:text-primary transition-colors mx-2">Support</a>
        </div>
      </footer>
    </div>
  );
};