import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Game {
  id: string;
  display_name: string;
  description: string;
  platform: string[];
}

interface Wager {
  game: { id: string };
}

interface GamesVisitorViewProps {
  games: Game[];
  wagers: Wager[];
  loading: boolean;
}

export const GamesVisitorView = ({ games, wagers, loading }: GamesVisitorViewProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header for non-authenticated users */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-orbitron font-bold text-neon-green mb-4">
            Available Games
          </h1>
          <p className="text-xl text-muted-foreground mb-8 font-orbitron">
            See what games you can compete in. Sign up to start wagering!
          </p>
        </div>

        {/* Games Grid for visitors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))
          ) : (
            games.map((game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow border-2 border-neon-green/20 hover:border-neon-green/50">
                <CardHeader className="pb-4">
                  <CardTitle className="font-orbitron text-lg">{game.display_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm font-orbitron">{game.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {game.platform.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="font-orbitron">
                      {wagers.filter(w => w.game.id === game.id).length} Active Challenges
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Call to Action for non-authenticated users */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto p-8 border-2 border-neon-green/20">
            <CardContent>
              <h3 className="text-2xl font-orbitron font-bold text-neon-green mb-4">
                Ready to Compete?
              </h3>
              <p className="text-muted-foreground mb-6 font-orbitron">
                Join thousands of gamers putting their skills to the test. Create challenges, accept matches, and win real money.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-neon-green text-black hover:bg-neon-green/90 font-orbitron font-semibold"
                  onClick={() => window.location.href = '/auth'}
                >
                  Sign Up to Play
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-orbitron font-semibold"
                  onClick={() => window.location.href = '/auth'}
                >
                  Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};