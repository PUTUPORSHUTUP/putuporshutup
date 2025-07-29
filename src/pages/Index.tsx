import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, DollarSign, Gamepad2, ArrowRight, LogOut, Shield, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNavigation } from '@/components/ui/mobile-navigation';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ShareButton } from '@/components/ui/share-button';
import { RealTimeStats } from '@/components/ui/real-time-stats';
import { VisitorCounter } from '@/components/ui/visitor-counter';
import { LiveGamingTrends } from '@/components/ui/live-gaming-trends';
import { RulesOfEngagementModal } from '@/components/games/RulesOfEngagementModal';
import { SponsorCarousel } from '@/components/ui/sponsor-carousel';

const Index = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<any>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user?.id)
        .single();
      
      // Check if user has moderator role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .in('role', ['mod', 'admin']);
      
      const isModerator = roleData && roleData.length > 0;
      
      setProfile({ ...data, is_moderator: isModerator });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Maintenance Notice */}
      <div className="bg-blue-600 text-white py-3 text-center">
        <p className="font-orbitron text-sm sm:text-base font-semibold">
          🎮 BETA TESTING IN PROGRESS - Platform launching around August 11th. Stay tuned for updates!
        </p>
      </div>

      {/* Header Navigation */}
      <header className="bg-neon-green text-black py-6 text-center">
        <h1 className="font-orbitron text-2xl sm:text-4xl font-semibold tracking-wider">
          Put Up or Shut Up
        </h1>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-black/80 backdrop-blur-md border-b border-neon-green/20">
        <div className="container mx-auto px-4 py-4">
          {isMobile ? (
            <div className="flex justify-end">
              <MobileNavigation profile={profile} />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <NotificationCenter />
                <Link to="/games">
                  <Button variant="ghost" className="text-white hover:bg-white/20">
                    Games
                  </Button>
                </Link>
                <Link to="/tournaments">
                  <Button variant="ghost" className="text-white hover:bg-white/20">
                    Tournaments
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="text-white hover:bg-white/20">
                    Profile
                  </Button>
                </Link>
                <Link to="/social">
                  <Button variant="ghost" className="text-white hover:bg-white/20">
                    Social
                  </Button>
                </Link>
                <Link to="/leaderboards">
                  <Button variant="ghost" className="text-white hover:bg-white/20">
                    Leaderboards
                  </Button>
                </Link>
                {profile?.is_admin && (
                  <Link to="/admin">
                    <Button variant="ghost" className="text-white hover:bg-white/20 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                {profile?.is_moderator && (
                  <Link to="/moderator">
                    <Button variant="ghost" className="text-white hover:bg-white/20 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Moderator
                    </Button>
                  </Link>
                )}
              </div>
              
              {user ? (
                <Button
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-black"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/auth">
                    <Button variant="ghost" className="text-white hover:bg-white/20">
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/3f2b1827-906a-40f5-b33e-a7bd8db103de.png')`
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-semibold mb-6 md:mb-8 text-neon-green">
            DON'T BRAG. COMPETE AND LOSE. COMPETE. WIN. BRAG!
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-gray-200 max-w-2xl mx-auto font-orbitron">
            Prove your skills in head-to-head video game challenges. Real competition. Real rewards. No luck — just skill.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg mx-auto">
            {user ? (
              <Link to="/games" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-neon-green text-black hover:bg-neon-green/90 font-orbitron font-semibold">
                  PUT UP OR SHUT UP
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-neon-green text-black hover:bg-neon-green/90 font-orbitron font-semibold">
                    Enter the Arena
                    <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/games" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-orbitron font-semibold">
                    Browse Games
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Rules of Engagement Button - Made prominent for mobile visibility */}
          <div className="mt-8 flex flex-col gap-4 max-w-md mx-auto">
            <Button
              variant="outline" 
              size="lg"
              onClick={() => setRulesModalOpen(true)}
              className="w-full border-neon-green text-neon-green hover:bg-neon-green hover:text-black text-lg py-6 font-orbitron font-bold bg-black/60 backdrop-blur-sm"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Rules of Engagement
            </Button>
            
            <ShareButton 
              variant="outline" 
              size="lg"
              className="w-full border-white text-white hover:bg-white hover:text-black text-lg py-6"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-orbitron font-bold mb-4">Features</h2>
            <p className="text-xl text-muted-foreground font-orbitron">Everything you need to dominate the competition</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-2 border-neon-green bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron font-semibold mb-4">🎮 Supported Titles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-orbitron mb-4">
                  Madden 25, NBA 2K25, MLB The Show, Call of Duty, Fortnite — and more to come.
                </p>
                <Link to="/games">
                  <Button variant="outline" size="sm" className="border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-orbitron">
                    View All Games
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-2 border-neon-green bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron font-semibold mb-4">💰 Secure Entry Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-orbitron">
                  Your money is held safely in escrow until the match is complete. Winner receives prize pool after match verification.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-2 border-neon-green bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron font-semibold mb-4">🛡️ No Cheaters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-orbitron">
                  Advanced rules + manual review + auto-ban for foul play. Cheaters forfeit deposits.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-2 border-neon-green bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron font-semibold mb-4">📱 Easy to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-orbitron">
                  Link gamertag, create or accept a challenge, submit result. We handle the rest.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-gaming font-bold mb-4">THE NUMBERS DON'T LIE</h2>
            <p className="text-xl text-muted-foreground">Join thousands of competitive gamers</p>
          </div>
          
          <RealTimeStats />
          
          {/* Live Gaming Trends */}
          <div className="mt-16 flex justify-center">
            <LiveGamingTrends />
          </div>
          
          {/* Visitor Counter */}
          <div className="mt-16">
            <h3 className="text-2xl font-orbitron font-bold mb-8 text-center">Live Stats & Traffic</h3>
            <VisitorCounter />
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground font-orbitron">
                📊 Real-time stat tracking coming soon! Challenge results will be automatically tracked and displayed live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor Carousel Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-orbitron font-bold mb-4">Our Partners</h2>
            <p className="text-lg text-muted-foreground font-orbitron">
              Trusted by leading gaming brands
            </p>
          </div>
          <SponsorCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neon-green">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-gaming font-bold text-black mb-6">
            READY TO PUT UP OR SHUT UP?
          </h2>
          <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto font-gaming">
            Stop talking. Start proving. Earn rewards by winning skill-based matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/games">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-black text-black hover:bg-black hover:text-neon-green font-gaming font-bold">
                  BROWSE CHALLENGES
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-black text-black hover:bg-black hover:text-neon-green font-gaming font-bold">
                    JOIN THE BATTLE
                  </Button>
                </Link>
                <Link to="/games">
                  <Button size="lg" className="text-lg px-8 py-6 bg-black text-neon-green hover:bg-black/80 font-gaming font-bold">
                    BROWSE CHALLENGES
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-8 px-4 bg-muted/30 border-t border-muted-foreground/20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h3 className="font-orbitron font-semibold text-lg mb-3 text-foreground">
              Disclaimer:
            </h3>
            <p className="font-orbitron text-muted-foreground leading-relaxed">
              Put Up or Shut Up is a skill-based video game competition platform. This service does not offer gambling, fantasy sports, or games of chance. All matches are based solely on user performance.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-muted-foreground">
        <div className="container mx-auto">
          <p className="font-orbitron text-sm">
            &copy; 2025 Put Up or Shut Up. All rights reserved.
          </p>
          <p className="font-orbitron text-sm mt-2">
            Need help? Contact us at support@putuporshutup.online
          </p>
        </div>
      </footer>

      {/* Rules of Engagement Modal */}
      <RulesOfEngagementModal 
        open={rulesModalOpen}
        onOpenChange={setRulesModalOpen}
      />
    </div>
  );
};

export default Index;
