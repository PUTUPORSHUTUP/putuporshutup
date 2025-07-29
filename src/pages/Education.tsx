import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Shield, DollarSign, Gamepad2, Users, Trophy, Target, AlertTriangle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Education = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-neon-green to-primary py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="text-center text-black">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">
              Education Center
            </h1>
            <p className="text-xl md:text-2xl font-orbitron max-w-3xl mx-auto">
              Learn everything you need to know about competitive gaming, wagering, and winning
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="getting-started" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
            <TabsTrigger value="wagering">Wagering Guide</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-orbitron font-bold mb-4">🚀 Getting Started Guide</h2>
              <p className="text-xl text-muted-foreground">Your journey to competitive gaming starts here</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Step 1: Create Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Sign up with your email and create a secure profile. Link your gaming accounts and verify your identity.
                  </p>
                  <Link to="/auth">
                    <Button className="w-full">Create Account</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    Step 2: Choose Your Game
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Browse our supported games including Apex Legends, Call of Duty, FIFA, and more. Find your specialty.
                  </p>
                  <Link to="/games">
                    <Button variant="outline" className="w-full">Browse Games</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Step 3: Start Competing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Create challenges or join existing ones. Deposit your entry fee and prove your skills to win prizes.
                  </p>
                  <Link to="/games">
                    <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                      Start Competing Now!
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                <strong>Pro Tip:</strong> Start with smaller entry fees to get familiar with the platform before wagering larger amounts. Practice makes perfect!
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* How It Works Tab */}
          <TabsContent value="how-it-works" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-orbitron font-bold mb-4">⚙️ How The Platform Works</h2>
              <p className="text-xl text-muted-foreground">Understanding our competitive gaming ecosystem</p>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">🎮 Challenge System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Creating Challenges</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Choose your game and platform</li>
                        <li>• Set entry fee and rules</li>
                        <li>• Wait for opponents to join</li>
                        <li>• Play and submit results</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Joining Challenges</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Browse available challenges</li>
                        <li>• Pay entry fee to join</li>
                        <li>• Get matched with opponents</li>
                        <li>• Compete and win prizes</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">🏆 Tournament System</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Join scheduled tournaments with multiple players competing for larger prize pools. Tournaments use bracket systems and can span multiple days.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <h5 className="font-semibold">Single Elimination</h5>
                      <p className="text-sm text-muted-foreground">One loss = elimination</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <h5 className="font-semibold">Double Elimination</h5>
                      <p className="text-sm text-muted-foreground">Two losses = elimination</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <h5 className="font-semibold">Round Robin</h5>
                      <p className="text-sm text-muted-foreground">Play everyone once</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wagering Guide Tab */}
          <TabsContent value="wagering" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-orbitron font-bold mb-4">💰 Wagering Guide</h2>
              <p className="text-xl text-muted-foreground">Learn about entry fees, prizes, and responsible gaming</p>
            </div>

            <Alert className="border-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This is skill-based competition, not gambling. All matches are determined by player performance, not chance.
              </AlertDescription>
            </Alert>

            <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  🛡️ Fair Play Protection System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <strong>Our commitment to fairness:</strong> We use advanced skill-based matchmaking to ensure pros don't dominate beginners. Every player gets fair competition at their skill level.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">✅ What We Do</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• <strong>Skill Tier System:</strong> 6 tiers from Novice to Pro</li>
                      <li>• <strong>Entry Fee Limits:</strong> Novices max $10, Amateurs max $25</li>
                      <li>• <strong>Rating Gaps:</strong> Limited skill differences in matches</li>
                      <li>• <strong>Tier Protection:</strong> Beginners can't face experts</li>
                      <li>• <strong>Anti-Sandbagging:</strong> Verified stats prevent fake rankings</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">🎯 Skill Tiers</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Badge className="bg-gray-500 text-white">NOVICE</Badge>
                        </span>
                        <span className="text-muted-foreground">$10 max</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Badge className="bg-green-500 text-white">AMATEUR</Badge>
                        </span>
                        <span className="text-muted-foreground">$25 max</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Badge className="bg-blue-500 text-white">INTERMEDIATE</Badge>
                        </span>
                        <span className="text-muted-foreground">$50 max</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Badge className="bg-purple-500 text-white">ADVANCED</Badge>
                        </span>
                        <span className="text-muted-foreground">$100 max</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Badge className="bg-orange-500 text-white">EXPERT</Badge>
                        </span>
                        <span className="text-muted-foreground">$500 max</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Badge className="bg-red-500 text-white">PRO</Badge>
                        </span>
                        <span className="text-muted-foreground">No limits</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-green-500">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Transparency Promise:</strong> All skill ratings are visible to participants before matches. No hidden rankings or unfair advantages.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>💵 Entry Fees & Prizes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">How Prizes Work</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Entry fees create the prize pool</li>
                      <li>• Winners take majority of the pool</li>
                      <li>• Platform takes a small service fee</li>
                      <li>• Payments processed securely</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Typical Prize Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>1st Place:</span>
                        <Badge>60-70%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>2nd Place:</span>
                        <Badge variant="secondary">20-25%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>3rd Place:</span>
                        <Badge variant="outline">10-15%</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🛡️ Responsible Gaming</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Our Commitments</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Skill-based competition only</li>
                      <li>• Age verification required</li>
                      <li>• Spending limits available</li>
                      <li>• Self-exclusion options</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Play Responsibly</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Only use money you can afford</li>
                      <li>• Set personal limits</li>
                      <li>• Take breaks regularly</li>
                      <li>• Seek help if needed</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-orbitron font-bold mb-4">💳 Payment Methods</h2>
              <p className="text-xl text-muted-foreground">Secure deposits and fast withdrawals</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Deposit Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Credit/Debit Cards</span>
                      <Badge>Instant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>PayPal</span>
                      <Badge>Instant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Cash App</span>
                      <Badge>Instant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Bank Transfer</span>
                      <Badge variant="secondary">1-3 days</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Withdrawal Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>PayPal</span>
                      <Badge>1-24 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Payoneer</span>
                      <Badge>1-24 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Cash App</span>
                      <Badge>1-24 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Bank Transfer</span>
                      <Badge variant="secondary">2-5 days</Badge>
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertDescription>
                      Minimum withdrawal: $10. Processing times may vary during high volume periods.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-orbitron font-bold mb-4">🛡️ Safety & Security</h2>
              <p className="text-xl text-muted-foreground">Your security and fair play are our top priorities</p>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>🔒 Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Data Protection</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• End-to-end encryption</li>
                        <li>• Secure payment processing</li>
                        <li>• Regular security audits</li>
                        <li>• GDPR compliant</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Account Protection</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Two-factor authentication</li>
                        <li>• Strong password requirements</li>
                        <li>• Login monitoring</li>
                        <li>• Instant alerts</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>⚖️ Fair Play & Anti-Cheat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Our Anti-Cheat System</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Manual result verification</li>
                      <li>• AI-powered fraud detection</li>
                      <li>• Community reporting system</li>
                      <li>• Immediate bans for violations</li>
                      <li>• Forfeit of deposits for cheaters</li>
                    </ul>
                  </div>
                  
                  <Alert className="border-red-500">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Zero Tolerance:</strong> Cheating results in immediate account suspension and forfeiture of all deposits. We maintain detailed logs of all matches.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📞 Dispute Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you encounter issues with a match result, our dispute system ensures fair resolution:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      <span>Submit dispute within 24 hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      <span>Provide evidence (screenshots, videos)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      <span>Moderator reviews all evidence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      <span>Decision made within 48 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-orbitron font-bold mb-4">❓ Frequently Asked Questions</h2>
              <p className="text-xl text-muted-foreground">Got questions? We have answers!</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    General Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Is this gambling?</h4>
                    <p className="text-muted-foreground">
                      No, this is skill-based competition. Outcomes are determined entirely by player performance, not chance. This makes it legal in most jurisdictions where gambling is restricted.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">What happens if someone doesn't show up?</h4>
                    <p className="text-muted-foreground">
                      If a player doesn't show up within 15 minutes of the scheduled start time, they automatically forfeit and the other player wins by default.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">How do you verify results?</h4>
                    <p className="text-muted-foreground">
                      Players submit screenshots or video proof of their results. Our moderation team reviews all submissions and can request additional evidence if needed.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>💰 Payment Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">How long do withdrawals take?</h4>
                    <p className="text-muted-foreground">
                      Most withdrawals are processed within 1-24 hours. Bank transfers may take 2-5 business days depending on your bank.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Are there any fees?</h4>
                    <p className="text-muted-foreground">
                      We take a small platform fee (typically 10%) from prize pools. There are no deposit fees, and withdrawal fees depend on your chosen method.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">What if I lose money unfairly?</h4>
                    <p className="text-muted-foreground">
                      You can file a dispute within 24 hours of the match. Our moderation team will review all evidence and make a fair decision. If you're right, you'll get your money back.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎮 Technical Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What platforms do you support?</h4>
                    <p className="text-muted-foreground">
                      We support PC, PlayStation, Xbox, and Nintendo Switch for most games. Some games may be limited to specific platforms.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Do I need special software?</h4>
                    <p className="text-muted-foreground">
                      No special software is required. You just need the game itself and a way to capture screenshots or record gameplay for proof submission.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">What if the game has server issues?</h4>
                    <p className="text-muted-foreground">
                      If widespread server issues affect a match, we'll reschedule or refund entry fees. Individual connection issues are the player's responsibility.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Support Section */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Still have questions?</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Our support team is here to help you succeed on the platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <a href="mailto:support@putuporshutup.online">
                  Contact Support
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/social">
                  Join Community
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Education;