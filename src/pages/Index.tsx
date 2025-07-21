import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, DollarSign, Gamepad2, ArrowRight, LogOut, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNavigation } from '@/components/ui/mobile-navigation';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

const Index = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<any>(null);

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
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-white font-gaming text-lg sm:text-xl font-bold">
            GAMING PLATFORM
          </Link>
              <div className="flex items-center gap-2 sm:gap-4">
            {isMobile ? (
              <MobileNavigation profile={profile} />
            ) : (
              <>
                {user ? (
                  <>
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
                      {profile?.is_admin && (
                        <Link to="/admin">
                          <Button variant="ghost" className="text-white hover:bg-white/20 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Admin
                          </Button>
                        </Link>
                      )}
                    </div>
                    <Button
                      variant="outline" 
                      className="border-white text-white hover:bg-white hover:text-black"
                      onClick={signOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <ThemeToggle />
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
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>
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
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-gaming font-bold mb-4 md:mb-6">
            GAMING PLATFORM
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-gray-200">
            The ultimate gaming wagering platform. Put your skills where your mouth is.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg mx-auto">
            {user ? (
              <Link to="/games" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-primary hover:bg-primary/90">
                  START WAGERING
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-primary hover:bg-primary/90">
                    START WAGERING
                    <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-white text-white hover:bg-white hover:text-black">
                    JOIN NOW
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-gaming font-bold mb-4">HOW IT WORKS</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to gaming glory</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gamepad2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-gaming">1. CHOOSE YOUR GAME</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Select from popular games like Call of Duty, FIFA, NBA 2K, and more. 
                  Create or join wagers that match your skill level.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-gaming">2. PLACE YOUR WAGER</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Put your money where your mouth is. Set the stakes and challenge 
                  other players to prove who's the real champion.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl font-gaming">3. WIN BIG</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Prove your skills and take home the prize pot. Build your reputation 
                  and climb the leaderboards.
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">$2M+</div>
              <div className="text-muted-foreground">Total Winnings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-muted-foreground">Matches Played</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-gaming font-bold text-white mb-6">
            READY TO PUT UP OR SHUT UP?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join the most competitive gaming community. Show your skills, earn respect, and win big.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/games">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  BROWSE WAGERS
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                    CREATE ACCOUNT
                  </Button>
                </Link>
                <Link to="/games">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary">
                    BROWSE WAGERS
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
