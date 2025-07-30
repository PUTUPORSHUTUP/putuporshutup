import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Gamepad2, 
  Timer, 
  Trophy,
  Zap,
  Target,
  Settings,
  Play
} from 'lucide-react';

interface ProfitStream {
  id: string;
  name: string;
  description: string;
  estimatedRevenue: number;
  automationLevel: number;
  isActive: boolean;
  icon: React.ReactNode;
  setupInstructions: string[];
}

const TOP_PROFIT_STREAMS: ProfitStream[] = [
  {
    id: 'premium_tournaments',
    name: 'Premium Tournament Series',
    description: 'High-stakes tournaments with entry fees and sponsorships',
    estimatedRevenue: 50000,
    automationLevel: 90,
    isActive: false,
    icon: <Trophy className="w-5 h-5" />,
    setupInstructions: [
      'Create premium tournament tiers ($25, $50, $100 entry)',
      'Automate bracket generation every 2 hours',
      'Set up sponsor integration for prize pools',
      'Enable live streaming revenue share'
    ]
  },
  {
    id: 'dynamic_pricing',
    name: 'Dynamic Challenge Pricing',
    description: 'AI-powered pricing based on demand and player skill',
    estimatedRevenue: 35000,
    automationLevel: 95,
    isActive: false,
    icon: <TrendingUp className="w-5 h-5" />,
    setupInstructions: [
      'Implement surge pricing during peak hours',
      'Skill-based entry fee adjustments',
      'Real-time demand monitoring',
      'Automated price optimization'
    ]
  },
  {
    id: 'xbox_lobby_automation',
    name: 'Xbox Remote Lobby System',
    description: '24/7 automated lobby creation and management',
    estimatedRevenue: 40000,
    automationLevel: 85,
    isActive: false,
    icon: <Gamepad2 className="w-5 h-5" />,
    setupInstructions: [
      'Set up Xbox Remote Play API',
      'Create automated lobby scripts',
      'Implement 24/7 tournament rotation',
      'Monitor and restart failed lobbies'
    ]
  },
  {
    id: 'subscription_tiers',
    name: 'Premium Subscription System',
    description: 'Tiered subscriptions with exclusive features',
    estimatedRevenue: 30000,
    automationLevel: 100,
    isActive: false,
    icon: <Users className="w-5 h-5" />,
    setupInstructions: [
      'Create VIP, Pro, Elite tiers',
      'Exclusive tournament access',
      'Reduced platform fees',
      'Priority matchmaking'
    ]
  },
  {
    id: 'sponsored_challenges',
    name: 'Sponsored Challenge Program',
    description: 'Brand-sponsored challenges with premium rewards',
    estimatedRevenue: 45000,
    automationLevel: 80,
    isActive: false,
    icon: <Target className="w-5 h-5" />,
    setupInstructions: [
      'Partner with gaming brands',
      'Automated challenge creation',
      'Sponsor logo integration',
      'Performance tracking dashboard'
    ]
  },
  {
    id: 'peak_hour_multipliers',
    name: 'Peak Hour Revenue Multipliers',
    description: 'Increased fees during high-traffic periods',
    estimatedRevenue: 25000,
    automationLevel: 100,
    isActive: false,
    icon: <Timer className="w-5 h-5" />,
    setupInstructions: [
      'Identify peak gaming hours',
      'Implement 1.5x-3x multipliers',
      'Auto-adjust based on player count',
      'Weekend special rates'
    ]
  },
  {
    id: 'api_game_integration',
    name: 'API-Powered Game Stats',
    description: 'Automatic stat verification for premium games',
    estimatedRevenue: 28000,
    automationLevel: 95,
    isActive: false,
    icon: <Zap className="w-5 h-5" />,
    setupInstructions: [
      'Integrate Call of Duty API',
      'Apex Legends stat tracking',
      'Fortnite performance data',
      'Real-time verification system'
    ]
  },
  {
    id: 'high_roller_vip',
    name: 'High Roller VIP Program',
    description: 'Exclusive high-stakes challenges for whales',
    estimatedRevenue: 60000,
    automationLevel: 70,
    isActive: false,
    icon: <DollarSign className="w-5 h-5" />,
    setupInstructions: [
      'Create $500+ entry tournaments',
      'Personal concierge service',
      'Custom challenge creation',
      'Exclusive gaming hardware prizes'
    ]
  },
  {
    id: 'automated_leagues',
    name: 'Seasonal League System',
    description: 'Monthly leagues with promotion/relegation',
    estimatedRevenue: 35000,
    automationLevel: 90,
    isActive: false,
    icon: <Trophy className="w-5 h-5" />,
    setupInstructions: [
      'Bronze, Silver, Gold, Platinum tiers',
      'Monthly season automation',
      'Automated promotion/relegation',
      'Season-end rewards distribution'
    ]
  },
  {
    id: 'franchise_tournaments',
    name: 'Franchise Tournament System',
    description: 'Team-based franchise tournaments with buy-ins',
    estimatedRevenue: 55000,
    automationLevel: 75,
    isActive: false,
    icon: <Users className="w-5 h-5" />,
    setupInstructions: [
      'Franchise buy-in system ($1000+)',
      'Team draft automation',
      'Revenue sharing model',
      'Playoff bracket automation'
    ]
  }
];

export const ProfitMaximizer = () => {
  const [profitStreams, setProfitStreams] = useState<ProfitStream[]>(TOP_PROFIT_STREAMS);
  const [xboxSettings, setXboxSettings] = useState({
    consoleIP: '',
    apiKey: '',
    autoStartEnabled: false,
    hoursPerDay: 24
  });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const activeRevenue = profitStreams
      .filter(stream => stream.isActive)
      .reduce((sum, stream) => sum + stream.estimatedRevenue, 0);
    setTotalRevenue(activeRevenue);
  }, [profitStreams]);

  const toggleProfitStream = async (streamId: string) => {
    const updatedStreams = profitStreams.map(stream => 
      stream.id === streamId 
        ? { ...stream, isActive: !stream.isActive }
        : stream
    );
    setProfitStreams(updatedStreams);

    // Save automation config to database
    try {
      const stream = updatedStreams.find(s => s.id === streamId);
      if (stream?.isActive) {
        await supabase.from('automation_config').upsert({
          automation_type: streamId,
          is_enabled: true,
          config_data: { 
            estimatedRevenue: stream.estimatedRevenue,
            automationLevel: stream.automationLevel 
          }
        });

        toast({
          title: "Profit Stream Activated",
          description: `${stream.name} is now generating revenue automatically`,
        });
      }
    } catch (error) {
      console.error('Error saving automation config:', error);
    }
  };

  const setupXboxAutomation = async () => {
    try {
      const { error } = await supabase.functions.invoke('setup-xbox-automation', {
        body: xboxSettings
      });

      if (error) throw error;

      toast({
        title: "Xbox Automation Configured",
        description: "Remote lobby creation is now active 24/7",
      });
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to configure Xbox automation",
        variant: "destructive",
      });
    }
  };

  const startFullAutomation = async () => {
    // Activate all profit streams
    const allActiveStreams = profitStreams.map(stream => ({ ...stream, isActive: true }));
    setProfitStreams(allActiveStreams);

    try {
      // Create automation configs for all streams
      const configs = allActiveStreams.map(stream => ({
        automation_type: stream.id,
        is_enabled: true,
        config_data: {
          estimatedRevenue: stream.estimatedRevenue,
          automationLevel: stream.automationLevel,
          setupInstructions: stream.setupInstructions
        },
        run_frequency_minutes: 30 // Run every 30 minutes
      }));

      for (const config of configs) {
        await supabase.from('automation_config').upsert(config);
      }

      // Start the orchestrator
      await supabase.functions.invoke('automation-orchestrator', {
        body: { activateAll: true }
      });

      toast({
        title: "🚀 FULL AUTOMATION ACTIVATED",
        description: `Estimated annual revenue: $${totalRevenue.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Error starting automation:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profit Maximizer & Xbox Automation</h2>
          <p className="text-muted-foreground">
            Top 10 money-making strategies with full automation
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Estimated Annual Revenue</div>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Start: Full Automation
          </CardTitle>
          <CardDescription>
            Activate all profit streams and Xbox automation with one click
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={startFullAutomation}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            START FULL AUTOMATION SYSTEM
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="profit-streams" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profit-streams">Profit Streams</TabsTrigger>
          <TabsTrigger value="xbox-setup">Xbox Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-streams" className="space-y-4">
          <div className="grid gap-4">
            {profitStreams.map((stream) => (
              <Card key={stream.id} className={`transition-all ${stream.isActive ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stream.icon}
                      <div>
                        <CardTitle className="text-lg">{stream.name}</CardTitle>
                        <CardDescription>{stream.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${stream.estimatedRevenue.toLocaleString()}/year
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stream.automationLevel}% automated
                        </div>
                      </div>
                      <Switch
                        checked={stream.isActive}
                        onCheckedChange={() => toggleProfitStream(stream.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Automation Level</span>
                        <span>{stream.automationLevel}%</span>
                      </div>
                      <Progress value={stream.automationLevel} className="h-2" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Setup Requirements:</Label>
                      <ul className="mt-1 space-y-1">
                        {stream.setupInstructions.map((instruction, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {stream.isActive && (
                      <Badge variant="default" className="bg-green-600">
                        ACTIVE - Generating Revenue
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="xbox-setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Xbox Series X Remote Automation
              </CardTitle>
              <CardDescription>
                Configure your Xbox for 24/7 automated lobby creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consoleIP">Xbox Console IP</Label>
                  <Input
                    id="consoleIP"
                    placeholder="192.168.1.xxx"
                    value={xboxSettings.consoleIP}
                    onChange={(e) => setXboxSettings({...xboxSettings, consoleIP: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">Xbox Live API Key</Label>
                  <Input
                    id="apiKey"
                    placeholder="Your Xbox Live API key"
                    value={xboxSettings.apiKey}
                    onChange={(e) => setXboxSettings({...xboxSettings, apiKey: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>24/7 Auto-Start</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start tournaments when players queue
                  </p>
                </div>
                <Switch
                  checked={xboxSettings.autoStartEnabled}
                  onCheckedChange={(checked) => setXboxSettings({...xboxSettings, autoStartEnabled: checked})}
                />
              </div>

              <div>
                <Label>Daily Operation Hours: {xboxSettings.hoursPerDay}</Label>
                <Input
                  type="range"
                  min="1"
                  max="24"
                  value={xboxSettings.hoursPerDay}
                  onChange={(e) => setXboxSettings({...xboxSettings, hoursPerDay: parseInt(e.target.value)})}
                  className="mt-2"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Xbox Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Enable Xbox Remote Play on your console</li>
                  <li>Set console to "Instant-on" power mode</li>
                  <li>Configure static IP address</li>
                  <li>Install supported games with custom lobby support</li>
                  <li>Create Xbox Live API credentials</li>
                </ol>
              </div>

              <Button onClick={setupXboxAutomation} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Configure Xbox Automation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};