import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Gamepad2, Users, Trophy, DollarSign, Zap, Target, User, LogOut } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-gaming">
      {/* Header */}
      <header className="relative z-50 border-b border-border/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="font-gaming text-xl font-bold text-primary">
              PUT UP OR SHUT UP
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/profile')}
                className="text-foreground hover:text-primary"
              >
                <User className="w-4 h-4 mr-2" />
                PROFILE
              </Button>
              <Button
                onClick={signOut}
                className="bg-gradient-neon-orange hover:shadow-glow-orange"
              >
                <LogOut className="w-4 h-4 mr-2" />
                SIGN OUT
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 animate-pulse" />
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            {/* Main Logo/Title */}
            <div className="space-y-4">
              <h1 className="font-gaming text-6xl md:text-8xl font-black text-primary animate-neon-pulse">
                PUT UP
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-1 w-20 bg-gradient-primary rounded-full" />
                <span className="font-gaming text-2xl md:text-3xl text-secondary font-bold">OR</span>
                <div className="h-1 w-20 bg-gradient-primary rounded-full" />
              </div>
              <h1 className="font-gaming text-6xl md:text-8xl font-black text-primary animate-neon-pulse">
                SHUT UP
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-foreground font-bold">
              DON'T BRAG. WAGER AND LOSE. WAGER. WIN. BRAG!
            </p>

            {/* Gaming Controller Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <Gamepad2 className="w-20 h-20 text-accent animate-glow-pulse" />
                <div className="absolute -top-2 -right-2">
                  <DollarSign className="w-8 h-8 text-money-green animate-money-float" />
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow-primary text-primary-foreground font-bold text-lg px-8 py-4 rounded-xl border-2 border-primary/50 transition-all duration-300 hover:scale-105"
              >
                <Target className="mr-2 h-5 w-5" />
                CREATE CHALLENGE
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-bold text-lg px-8 py-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-glow-secondary"
              >
                <Users className="mr-2 h-5 w-5" />
                JOIN TOURNAMENT
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/60 transition-all duration-300 hover:shadow-glow-primary group">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center group-hover:animate-pulse">
                <Gamepad2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-gaming text-xl font-bold text-primary">WAGER & WIN</h3>
              <p className="text-muted-foreground">
                Challenge players in your favorite games. Put your money where your mouth is.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-secondary/30 hover:border-secondary/60 transition-all duration-300 hover:shadow-glow-secondary group">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center group-hover:animate-pulse">
                <Trophy className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-gaming text-xl font-bold text-secondary">SECURE ESCROW</h3>
              <p className="text-muted-foreground">
                Funds held safely until match completion. Winner takes all, minus our small cut.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-accent/30 hover:border-accent/60 transition-all duration-300 hover:shadow-glow-accent group">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center group-hover:animate-pulse">
                <Zap className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-gaming text-xl font-bold text-accent">INSTANT PAYOUTS</h3>
              <p className="text-muted-foreground">
                Results verified, money moves fast. Get paid immediately after winning.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Popular Games Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-gaming text-4xl font-bold text-primary mb-4">POPULAR GAMES</h2>
          <p className="text-muted-foreground text-lg">Choose your battlefield</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "MADDEN 24", color: "primary" },
            { name: "NBA 2K24", color: "secondary" },
            { name: "COD MW3", color: "accent" },
            { name: "FIFA 24", color: "destructive" }
          ].map((game, index) => (
            <Card key={index} className="bg-card/80 backdrop-blur-sm border-2 border-muted hover:border-primary transition-all duration-300 cursor-pointer hover:scale-105">
              <CardContent className="p-4 text-center">
                <Badge variant="outline" className={`mb-3 text-${game.color} border-${game.color}`}>
                  LIVE
                </Badge>
                <h3 className="font-gaming font-bold text-foreground">{game.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">Active players betting</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-card/50 backdrop-blur-sm border-y border-border py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-gaming font-bold text-primary">$50K+</div>
              <div className="text-muted-foreground">Total Wagered</div>
            </div>
            <div>
              <div className="text-3xl font-gaming font-bold text-secondary">1,200+</div>
              <div className="text-muted-foreground">Active Players</div>
            </div>
            <div>
              <div className="text-3xl font-gaming font-bold text-accent">500+</div>
              <div className="text-muted-foreground">Matches Today</div>
            </div>
            <div>
              <div className="text-3xl font-gaming font-bold text-destructive">99.9%</div>
              <div className="text-muted-foreground">Payout Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
