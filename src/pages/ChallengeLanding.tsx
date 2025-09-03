import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Gamepad2, Swords, Wallet, Shield, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChallengeLanding = () => {
  const navigate = useNavigate();

  const handleChallengeMe = () => {
    navigate('/games');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary)_0%,_transparent_50%)] opacity-10" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-gaming text-primary mb-6 leading-tight">
            Put Up or Shut Up.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Skill speaks. Stats prove it. Real rewards.
          </p>
          
          <Button 
            onClick={handleChallengeMe}
            size="lg"
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground relative group"
          >
            <Gamepad2 className="w-6 h-6 mr-3" />
            Challenge Me
            <ChevronDown className="w-5 h-5 ml-3 animate-bounce" />
            <div className="absolute inset-0 bg-primary/20 rounded-md blur-xl group-hover:blur-2xl transition-all duration-300" />
          </Button>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-accent rounded-full animate-pulse delay-500" />
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              🎯 How It Works (3-Step Visual Flow)
            </Badge>
            <h2 className="text-4xl md:text-5xl font-gaming text-primary mb-4">
              Three Steps to Victory
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Gamepad2 className="w-8 h-8 text-primary" />
                </div>
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Xbox Controller</h3>
                <p className="text-muted-foreground">
                  Connect your Series X in dev mode
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Swords className="w-8 h-8 text-primary" />
                </div>
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Crossed Swords</h3>
                <p className="text-muted-foreground">
                  Enter a real skill-based challenge
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Wallet Icon</h3>
                <p className="text-muted-foreground">
                  Win. Get paid. No RNG, no excuses
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground italic">
              Include animated stat capture preview or match replay thumbnail
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              💬 Testimonials (Raw, Attitude-Driven)
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardContent className="p-6">
                <p className="text-foreground font-medium mb-4">
                  "I smoked my rival and got paid. No bots, no BS."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardContent className="p-6">
                <p className="text-foreground font-medium mb-4">
                  "Finally—something that rewards actual gameplay."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <CardContent className="p-6">
                <p className="text-foreground font-medium mb-4">
                  "PutUpOrShutUp is the only place I flex without filters."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              🛡️ Trust Section
            </Badge>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-foreground">Xbox Live verified integration</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-foreground">Wallets secured via Supabase</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-foreground">Payouts backed by real-time match data</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-foreground">Cyber insurance coverage in progress</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4">
              📢 Footer
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-foreground font-bold mb-4">Links:</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
                <span className="text-muted-foreground">|</span>
                <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
                <span className="text-muted-foreground">|</span>
                <a href="/support" className="text-muted-foreground hover:text-primary transition-colors">Support</a>
                <span className="text-muted-foreground">|</span>
                <a href="/dev-setup" className="text-muted-foreground hover:text-primary transition-colors">Dev Mode Setup</a>
              </div>
            </div>

            <div>
              <h4 className="text-foreground font-bold mb-4">Social:</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">TikTok</a>
                <span className="text-muted-foreground">,</span>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">YouTube Shorts</a>
                <span className="text-muted-foreground">,</span>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Discord</a>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-border">
            <p className="text-lg font-gaming text-primary mb-2">
              Built for gamers who don't bluff.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};