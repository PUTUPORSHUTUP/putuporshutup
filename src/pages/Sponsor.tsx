import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, 
  Eye, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Target,
  Star,
  Zap,
  Crown,
  Gift
} from "lucide-react";

const Sponsor = () => {
  const navigate = useNavigate();

  const handleSponsorSignup = () => {
    // For now, redirect to contact or create a sponsor signup modal
    window.open('mailto:sponsors@puosu.com?subject=Tournament Sponsorship Inquiry', '_blank');
  };

  const sponsorshipTiers = [
    {
      name: "Bronze",
      price: "$100",
      multiplier: "2x",
      features: [
        "Logo on tournament banners",
        "Sponsor mention in match intros",
        "Basic analytics report"
      ],
      color: "border-orange-400 bg-orange-50 dark:bg-orange-950"
    },
    {
      name: "Silver", 
      price: "$250",
      multiplier: "2.5x",
      features: [
        "All Bronze features",
        "Logo on lobby screens",
        "Social media shoutouts",
        "Mid-tournament highlights"
      ],
      color: "border-gray-400 bg-gray-50 dark:bg-gray-950"
    },
    {
      name: "Gold",
      price: "$500", 
      multiplier: "3x",
      features: [
        "All Silver features",
        "Featured on winner pages",
        "Custom hashtag campaigns",
        "Priority tournament access"
      ],
      color: "border-yellow-400 bg-yellow-50 dark:bg-yellow-950"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-gaming font-bold mb-6">
            Become a <span className="text-accent">PUOSU</span> Tournament Sponsor
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Support the game. Elevate your brand. Power the prize pool.
            <br />
            <span className="text-accent font-semibold">Direct access to gamers aged 16–35 who are highly engaged</span>
          </p>
          <Button
            onClick={handleSponsorSignup}
            size="lg"
            className="bg-neon-green text-black hover:bg-neon-green/80 font-gaming font-bold text-xl px-12 py-6"
          >
            <Trophy className="w-6 h-6 mr-3" />
            Sponsor a Tournament Now
          </Button>
        </div>

        {/* Sponsorship Tiers */}
        <div className="mb-16">
          <h2 className="text-3xl font-gaming font-bold text-center mb-8">
            <Crown className="inline w-8 h-8 mr-2 text-yellow-500" />
            Choose Your Sponsorship Level
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sponsorshipTiers.map((tier) => (
              <Card key={tier.name} className={`${tier.color} border-2 relative hover:shadow-lg transition-all`}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-gaming">
                    {tier.name}
                  </CardTitle>
                  <div className="text-3xl font-bold text-accent">{tier.price}</div>
                  <Badge variant="secondary" className="mx-auto">
                    {tier.multiplier} Prize Pool Multiplier
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="w-4 h-4 text-accent mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Premium Visibility */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-gaming flex items-center">
                <Eye className="w-6 h-6 mr-3 text-neon-pink" />
                Premium Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <Zap className="w-5 h-5 text-accent mr-3 mt-0.5" />
                <div>
                  <strong>Tournament Banners:</strong> Your logo prominently displayed on all tournament materials
                </div>
              </div>
              <div className="flex items-start">
                <Zap className="w-5 h-5 text-accent mr-3 mt-0.5" />
                <div>
                  <strong>Match Screens:</strong> Sponsor spotlight during lobby screens and match intros
                </div>
              </div>
              <div className="flex items-start">
                <Zap className="w-5 h-5 text-accent mr-3 mt-0.5" />
                <div>
                  <strong>Winner Pages:</strong> Featured prominently when announcing champions
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engaged Audience */}
          <Card className="bg-gradient-to-br from-secondary/10 to-neon-green/10 border-secondary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-gaming flex items-center">
                <Users className="w-6 h-6 mr-3 text-neon-green" />
                Engaged Gaming Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <Target className="w-5 h-5 text-neon-green mr-3 mt-0.5" />
                <div>
                  <strong>Perfect Demographics:</strong> Direct access to active gamers aged 16–35
                </div>
              </div>
              <div className="flex items-start">
                <Target className="w-5 h-5 text-neon-green mr-3 mt-0.5" />
                <div>
                  <strong>High Engagement:</strong> Players actively competing, watching, and sharing
                </div>
              </div>
              <div className="flex items-start">
                <Target className="w-5 h-5 text-neon-green mr-3 mt-0.5" />
                <div>
                  <strong>Perfect Timing:</strong> Reach them when they're most focused and competitive
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social & Viral Reach */}
          <Card className="bg-gradient-to-br from-neon-pink/10 to-purple-500/10 border-neon-pink/20">
            <CardHeader>
              <CardTitle className="text-2xl font-gaming flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-neon-pink" />
                Social Media & Viral Reach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <Star className="w-5 h-5 text-neon-pink mr-3 mt-0.5" />
                <div>
                  <strong>Highlight Clips:</strong> Featured in official tournament reels and stories
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-neon-pink mr-3 mt-0.5" />
                <div>
                  <strong>Co-Branded Campaigns:</strong> Custom hashtags like "The [Brand] $1K Showdown"
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-neon-pink mr-3 mt-0.5" />
                <div>
                  <strong>Organic Sharing:</strong> Players naturally share their sponsored victories
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & ROI */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-2xl font-gaming flex items-center">
                <BarChart3 className="w-6 h-6 mr-3 text-blue-400" />
                Analytics & ROI Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <BarChart3 className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <strong>Detailed Metrics:</strong> Views, impressions, sign-ups, and engagement rates
                </div>
              </div>
              <div className="flex items-start">
                <BarChart3 className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <strong>Audience Insights:</strong> Demographics and behavior analytics
                </div>
              </div>
              <div className="flex items-start">
                <BarChart3 className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <strong>Performance Tracking:</strong> ROI measurement and conversion metrics
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Sponsorship Ideas */}
        <div className="mb-16">
          <h2 className="text-3xl font-gaming font-bold text-center mb-8">
            <Gift className="inline w-8 h-8 mr-2 text-accent" />
            Smart Sponsorship Strategies
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="text-xl text-accent">🏆 "Sponsor a Winner"</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Highlight how your brand backed their victory. Create powerful testimonials and success stories that resonate with the gaming community.</p>
              </CardContent>
            </Card>
            
            <Card className="border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-xl text-neon-green">⭐ Exclusive Perks</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Get first access to major tournaments, special events, or exclusive moderator privileges within the PUOSU community.</p>
              </CardContent>
            </Card>
            
            <Card className="border-neon-pink/30">
              <CardHeader>
                <CardTitle className="text-xl text-neon-pink">🎮 Brand Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Add your products, merchandise, or powerups directly into gameplay experiences for seamless brand integration.</p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-xl text-blue-400">💰 Affiliate Bonuses</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Create trackable promo codes (e.g., "PUOSU10") that generate commission-based revenue from tournament participants.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg p-12">
          <h2 className="text-3xl font-gaming font-bold mb-4">
            Ready to Support the Next Wave of Champions?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the brands that power competitive gaming excellence
          </p>
          <Button
            onClick={handleSponsorSignup}
            size="lg"
            className="bg-neon-green text-black hover:bg-neon-green/80 font-gaming font-bold text-xl px-12 py-6"
          >
            <Trophy className="w-6 h-6 mr-3" />
            Sponsor a Tournament Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sponsor;