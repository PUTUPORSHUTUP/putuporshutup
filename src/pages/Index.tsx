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
import { UpcomingTournaments } from '@/components/tournaments/UpcomingTournaments';
import { LiveGameStatus } from '@/components/realtime/LiveGameStatus';
import { KillRaceChallenge } from '@/components/games/KillRaceChallenge';
import { LiveTournamentFeed } from '@/components/tournaments/LiveTournamentFeed';

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
      {/* Live Platform Notice */}
      <div className="bg-orange-600 text-white py-3 text-center">
        <p className="font-orbitron text-sm sm:text-base font-semibold">
          🔧 MAINTENANCE - Preparing for Sunday Showdown! Check back soon for the ultimate gaming experience!
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
      {/* Hero Section - Tournament Engine */}
      <section className="relative py-20 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="text-sm px-4 py-2 font-orbitron">
              🔥 TOURNAMENT ENGINE LIVE - New matches every 20 minutes
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold text-neon-green">
              ENDLESS TOURNAMENTS
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-orbitron">
              No Subscriptions. No Waiting. Just Skill + Cash.
            </p>
            
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-orbitron">
              Join automated tournaments every 20 minutes. Entry fees only. Winners get paid instantly. The platform that runs itself.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/tournaments">
                  <Button size="lg" className="text-lg px-8 py-6 bg-neon-green text-black hover:bg-neon-green/90 font-orbitron font-bold">
                    🎮 JOIN NEXT TOURNAMENT
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8 py-6 bg-neon-green text-black hover:bg-neon-green/90 font-orbitron font-bold">
                    🚀 GET STARTED NOW
                  </Button>
                </Link>
              )}
              
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-orbitron">
                  🔥 HOW IT WORKS
                </Button>
              </Link>
            </div>
            
            {/* Tournament Stats Grid - Removed fake numbers */}
          </div>
        </div>
      </section>

      {/* Live Tournament Feed */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <LiveTournamentFeed />
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
                    View All Games →
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

            <Link to="/education">
              <Card className="text-center p-8 hover:shadow-lg transition-all border-2 border-neon-green bg-card/50 cursor-pointer hover:border-neon-green/80 hover:bg-card/70">
                <CardHeader>
                  <CardTitle className="text-xl font-orbitron font-semibold mb-4 flex items-center justify-center gap-2">
                    📱 Easy to Use
                    <BookOpen className="w-5 h-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground font-orbitron mb-4">
                    Link gamertag, create or accept a challenge, submit result. We handle the rest.
                  </p>
                  <Button variant="outline" size="sm" className="border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-orbitron">
                    Learn More →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Sunday Showdown Featured Tournament */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-orbitron font-bold mb-4">Featured Tournament</h2>
            <p className="text-xl text-muted-foreground font-orbitron">
              Click to view all upcoming tournaments
            </p>
          </div>
          
          {/* Sunday Showdown Poster - Clickable */}
          <div className="flex justify-center mb-16">
            <Link to="/tournaments" className="w-full max-w-2xl">
              <div className="cursor-pointer hover:opacity-90 transition-opacity">
                <img 
                  src="/lovable-uploads/45d7073b-0f70-4555-95ab-c80162886810.png"
                  alt="Sunday Showdown Championship"
                  className="w-full h-auto rounded-lg shadow-2xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </Link>
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
          
      {/* Live Gaming Trends & Game Status */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <div className="flex justify-center">
          <LiveGamingTrends />
        </div>
        <div className="flex justify-center">
          <LiveGameStatus showAllUsers={true} maxUsers={5} />
        </div>
      </div>
      
      {/* Kill Race Feature Showcase */}
      <div className="mt-16 flex justify-center">
        <div className="max-w-md">
          <h3 className="text-2xl font-orbitron font-bold mb-4 text-center">Try Kill Race Challenges</h3>
          <p className="text-center text-muted-foreground mb-6 text-sm">
            Auto-verified COD multiplayer challenges using Xbox Live APIs
          </p>
          <KillRaceChallenge onChallengeCreate={(data) => {
            console.log('Demo challenge created:', data);
          }} />
        </div>
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
