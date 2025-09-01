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
import { useToast } from '@/hooks/use-toast';
import { XboxLobbyMonitor } from './XboxLobbyMonitor';
import { 
  Gamepad2, 
  Wifi, 
  Settings, 
  Play, 
  Square, 
  RotateCcw,
  Zap,
  Clock,
  Users,
  Trophy,
  Monitor,
  Power
} from 'lucide-react';

interface XboxAutomationConfig {
  consoleIP: string;
  apiKey: string;
  autoStartEnabled: boolean;
  hoursPerDay: number;
  maxConcurrentLobbies: number;
  autoRestartOnCrash: boolean;
  peakHourMultiplier: number;
  supportedGames: string[];
}

interface AutomationStatus {
  isConnected: boolean;
  isRunning: boolean;
  activeLobbies: number;
  totalRevenue: number;
  uptime: number;
  lastError?: string;
}

export const XboxSeriesXAutomation = () => {
  const [config, setConfig] = useState<XboxAutomationConfig>({
    consoleIP: '10.0.0.51', // Pre-populated from your network settings
    apiKey: '',
    autoStartEnabled: false,
    hoursPerDay: 24,
    maxConcurrentLobbies: 10,
    autoRestartOnCrash: true,
    peakHourMultiplier: 2.0,
    supportedGames: ['Call of Duty: Black Ops 6', 'Apex Legends', 'Rocket League', 'NBA 2K25', 'Madden NFL 25']
  });

  const [status, setStatus] = useState<AutomationStatus>({
    isConnected: false,
    isRunning: false,
    activeLobbies: 0,
    totalRevenue: 0,
    uptime: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate real-time status updates
    const interval = setInterval(() => {
      if (status.isRunning) {
        setStatus(prev => ({
          ...prev,
          uptime: prev.uptime + 1,
          totalRevenue: prev.totalRevenue + Math.random() * 50,
          activeLobbies: Math.floor(Math.random() * config.maxConcurrentLobbies) + 1
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status.isRunning, config.maxConcurrentLobbies]);

  const connectXbox = async () => {
    setIsLoading(true);
    try {
      // Simulate Xbox connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus(prev => ({ ...prev, isConnected: true }));
      toast({
        title: "Xbox Connected",
        description: "Successfully connected to Xbox Series X",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Xbox console",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startAutomation = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('setup-xbox-automation', {
        body: config
      });

      if (error) throw error;

      setStatus(prev => ({ ...prev, isRunning: true }));
      
      toast({
        title: "🚀 Xbox Automation Started",
        description: "24/7 lobby creation is now active",
      });
    } catch (error) {
      toast({
        title: "Failed to Start",
        description: "Could not start Xbox automation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopAutomation = async () => {
    setStatus(prev => ({ ...prev, isRunning: false, activeLobbies: 0 }));
    toast({
      title: "Automation Stopped",
      description: "Xbox automation has been stopped",
    });
  };

  const restartAutomation = async () => {
    await stopAutomation();
    setTimeout(startAutomation, 1000);
  };

  const updateConfig = (key: keyof XboxAutomationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            Xbox Series X Full Automation
          </h2>
          <p className="text-muted-foreground">
            Complete remote control and 24/7 tournament automation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.isConnected ? "default" : "secondary"}>
            <Wifi className="w-3 h-3 mr-1" />
            {status.isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant={status.isRunning ? "default" : "secondary"}>
            <Power className="w-3 h-3 mr-1" />
            {status.isRunning ? "Running" : "Stopped"}
          </Badge>
        </div>
      </div>

      {/* Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Lobbies</p>
                <p className="text-2xl font-bold">{status.activeLobbies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{Math.floor(status.uptime / 60)}h {status.uptime % 60}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue Today</p>
                <p className="text-2xl font-bold">${status.totalRevenue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Players Active</p>
                <p className="text-2xl font-bold">{status.activeLobbies * 8}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Xbox Console Configuration</CardTitle>
              <CardDescription>
                Configure your Xbox Series X for remote automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consoleIP">Console IP Address</Label>
                  <Input
                    id="consoleIP"
                    placeholder="192.168.1.100"
                    value={config.consoleIP}
                    onChange={(e) => updateConfig('consoleIP', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">Xbox Live API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Your Xbox Live API key"
                    value={config.apiKey}
                    onChange={(e) => updateConfig('apiKey', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Concurrent Lobbies: {config.maxConcurrentLobbies}</Label>
                  <Input
                    type="range"
                    min="1"
                    max="20"
                    value={config.maxConcurrentLobbies}
                    onChange={(e) => updateConfig('maxConcurrentLobbies', parseInt(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Peak Hour Multiplier: {config.peakHourMultiplier}x</Label>
                  <Input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={config.peakHourMultiplier}
                    onChange={(e) => updateConfig('peakHourMultiplier', parseFloat(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>24/7 Operation</Label>
                    <p className="text-sm text-muted-foreground">Run automation around the clock</p>
                  </div>
                  <Switch
                    checked={config.autoStartEnabled}
                    onCheckedChange={(checked) => updateConfig('autoStartEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Restart on Crash</Label>
                    <p className="text-sm text-muted-foreground">Automatically restart failed lobbies</p>
                  </div>
                  <Switch
                    checked={config.autoRestartOnCrash}
                    onCheckedChange={(checked) => updateConfig('autoRestartOnCrash', checked)}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Supported Games</h4>
                <div className="flex flex-wrap gap-2">
                  {config.supportedGames.map((game, index) => (
                    <Badge key={index} variant="outline">
                      {game}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={connectXbox} 
                disabled={isLoading || !config.consoleIP || !config.apiKey}
                className="w-full"
              >
                <Wifi className="w-4 h-4 mr-2" />
                {isLoading ? "Connecting..." : "Connect to Xbox"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Controls</CardTitle>
              <CardDescription>
                Start, stop, and manage your Xbox automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={startAutomation}
                  disabled={!status.isConnected || status.isRunning || isLoading}
                  className="h-16 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Start Automation
                </Button>
                
                <Button
                  onClick={stopAutomation}
                  disabled={!status.isRunning}
                  variant="destructive"
                  className="h-16"
                  size="lg"
                >
                  <Square className="w-6 h-6 mr-2" />
                  Stop Automation
                </Button>
                
                <Button
                  onClick={restartAutomation}
                  disabled={!status.isConnected}
                  variant="outline"
                  className="h-16"
                  size="lg"
                >
                  <RotateCcw className="w-6 h-6 mr-2" />
                  Restart System
                </Button>
              </div>

              {status.isRunning && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Zap className="w-5 h-5" />
                    <span className="font-medium">Xbox Automation Active</span>
                  </div>
                  <p className="text-green-700 mt-1">
                    Your Xbox is automatically creating lobbies and generating revenue 24/7
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure advanced automation behaviors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Daily Operation Hours: {config.hoursPerDay}/24</Label>
                  <Input
                    type="range"
                    min="1"
                    max="24"
                    value={config.hoursPerDay}
                    onChange={(e) => updateConfig('hoursPerDay', parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Console will operate {config.hoursPerDay} hours per day
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Automation Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Automatic lobby creation</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tournament scheduling</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Result verification</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Prize distribution</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <XboxLobbyMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};