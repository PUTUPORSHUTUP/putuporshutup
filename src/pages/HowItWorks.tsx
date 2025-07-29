import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, GamepadIcon, Users, Trophy, Shield, CreditCard, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-gaming font-bold">HOW IT WORKS</h1>
            <p className="text-muted-foreground">Everything you need to know about our gaming competition platform</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="wagering">Wagering</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="getting-started">Get Started</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GamepadIcon className="w-5 h-5" />
                  How the Platform Works
                </CardTitle>
                <CardDescription>
                  A step-by-step guide to competitive gaming challenges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="font-semibold">Create Account & Deposit Funds</h3>
                      <p className="text-sm text-muted-foreground">Sign up and add funds to your account to participate in challenges</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="font-semibold">Browse Available Challenges</h3>
                      <p className="text-sm text-muted-foreground">Find challenges that match your skill level and preferred games</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                    <div>
                      <h3 className="font-semibold">Join a Challenge</h3>
                      <p className="text-sm text-muted-foreground">Pay the stake amount to join and compete against other players</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                    <div>
                      <h3 className="font-semibold">Play Your Game</h3>
                      <p className="text-sm text-muted-foreground">Compete according to the challenge rules and submit your results</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">5</div>
                    <div>
                      <h3 className="font-semibold">Win & Get Paid</h3>
                      <p className="text-sm text-muted-foreground">Winners receive the prize pool minus platform fees</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Challenge Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Badge variant="secondary">1v1 Matches</Badge>
                      <p className="text-sm mt-1">Direct head-to-head competitions</p>
                    </div>
                    <div>
                      <Badge variant="secondary">Team Challenges</Badge>
                      <p className="text-sm mt-1">Multi-player team competitions</p>
                    </div>
                    <div>
                      <Badge variant="secondary">Lobby Competitions</Badge>
                      <p className="text-sm mt-1">Large group competitive events</p>
                    </div>
                    <div>
                      <Badge variant="secondary">Stat-Based Challenges</Badge>
                      <p className="text-sm mt-1">Competitions based on specific game statistics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Platform Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Real-time Matching</h4>
                      <p className="text-sm text-muted-foreground">Automated opponent matching system</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Multiple Games Supported</h4>
                      <p className="text-sm text-muted-foreground">Fortnite, Call of Duty, Apex Legends, and more</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Tournament System</h4>
                      <p className="text-sm text-muted-foreground">Organized competitive tournaments</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Leaderboards</h4>
                      <p className="text-sm text-muted-foreground">Track your ranking and progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wagering Tab */}
          <TabsContent value="wagering" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How Wagering Works</CardTitle>
                <CardDescription>
                  Understanding stakes, prizes, and competition rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Stakes & Prize Pools</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Each challenge requires participants to contribute a stake amount. All stakes are combined to form the prize pool.
                    </p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm"><strong>Example:</strong> 4 players × $10 stake = $40 prize pool</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Competition Rules</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• All participants must follow the specific challenge rules</li>
                      <li>• Results must be submitted with proof (screenshots, stats, etc.)</li>
                      <li>• Disputes are handled by our moderation team</li>
                      <li>• Winners are determined based on pre-defined criteria</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Platform Fees</h3>
                    <p className="text-sm text-muted-foreground">
                      A small platform fee is deducted from prize pools to maintain and improve our services.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Deposit Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Badge variant="outline">Credit/Debit Cards</Badge>
                      <p className="text-sm mt-1">Visa, Mastercard, American Express</p>
                    </div>
                    <div>
                      <Badge variant="outline">Digital Wallets</Badge>
                      <p className="text-sm mt-1">PayPal, Cash App, and other e-wallets</p>
                    </div>
                    <div>
                      <Badge variant="outline">Bank Transfers</Badge>
                      <p className="text-sm mt-1">Direct bank account transfers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Standard Withdrawals</h4>
                      <p className="text-sm text-muted-foreground">2-5 business days processing time</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Instant Withdrawals</h4>
                      <p className="text-sm text-muted-foreground">Available for verified premium accounts</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Minimum Amounts</h4>
                      <p className="text-sm text-muted-foreground">$10 minimum withdrawal amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Safety Measures
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Responsible Gaming</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Daily and monthly spending limits</li>
                      <li>• Self-exclusion options available</li>
                      <li>• Age verification required (18+)</li>
                      <li>• Problem gaming resources and support</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Dispute Resolution</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 24/7 moderation team</li>
                      <li>• Evidence-based dispute handling</li>
                      <li>• Appeal process for contested decisions</li>
                      <li>• Fair and transparent resolution procedures</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Security Features</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Secure payment processing</li>
                      <li>• Two-factor authentication available</li>
                      <li>• Encrypted data transmission</li>
                      <li>• Regular security audits</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-5 h-5" />
                    Important Notice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-800">
                    This platform is for skill-based gaming competitions only. Participants must be 18 years or older. 
                    Please game responsibly and within your means.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started Guide</CardTitle>
                <CardDescription>
                  Step-by-step onboarding process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 1: Account Setup</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Create your account with email verification</li>
                      <li>• Complete profile setup with gaming usernames</li>
                      <li>• Verify your identity (required for withdrawals)</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 2: Account Funding</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Choose your preferred payment method</li>
                      <li>• Make your first deposit (minimum $10)</li>
                      <li>• Set up responsible gaming limits</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 3: First Challenge</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Browse available challenges</li>
                      <li>• Start with lower stakes to learn the system</li>
                      <li>• Read challenge rules carefully</li>
                      <li>• Submit results with required proof</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 4: Advanced Features</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Join tournaments for bigger prizes</li>
                      <li>• Create custom challenges</li>
                      <li>• Build your reputation on leaderboards</li>
                      <li>• Connect with other competitive gamers</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Link to="/auth">
                    <Button>Create Account</Button>
                  </Link>
                  <Link to="/games">
                    <Button variant="outline">Browse Challenges</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HowItWorks;