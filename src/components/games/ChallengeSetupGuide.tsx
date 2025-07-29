import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, Copy, Monitor, Gamepad2, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SetupStep {
  step: number;
  title: string;
  description: string;
  tips?: string[];
}

interface PlatformGuide {
  platform: string;
  icon: React.ReactNode;
  steps: SetupStep[];
  screenshots?: string[];
}

interface ChallengeSetupGuideProps {
  gameName?: string;
}

export const ChallengeSetupGuide = ({ gameName = "All Games" }: ChallengeSetupGuideProps) => {
  const [open, setOpen] = useState(false);

  const platformGuides: PlatformGuide[] = [
    {
      platform: "Xbox",
      icon: <Gamepad2 className="w-5 h-5" />,
      steps: [
        {
          step: 1,
          title: "Navigate to Game Mode",
          description: "Open your game and go to Private Match or Custom Game mode",
          tips: ["Look for 'Private Match', 'Custom Game', or 'Create Game' options"]
        },
        {
          step: 2,
          title: "Configure Lobby Settings",
          description: "Set up match rules, time limits, and player count according to your challenge",
          tips: ["Match the settings agreed upon in the challenge", "Take note of lobby ID if available"]
        },
        {
          step: 3,
          title: "Share Lobby Information",
          description: "Invite opponents using Xbox Live party, gamertag invite, or lobby code",
          tips: ["Use Xbox Live party for voice coordination", "Share lobby code in challenge chat"]
        },
        {
          step: 4,
          title: "Start Match & Record",
          description: "Begin the match and use Xbox Game Bar (Win+G) or built-in recording to capture gameplay",
          tips: ["Press Xbox button + X to record last 30 seconds", "Take screenshots of final scores"]
        },
        {
          step: 5,
          title: "Submit Results",
          description: "Upload screenshots/clips and report your placement in the challenge",
          tips: ["Include scoreboard screenshots", "Submit within 10 minutes of match end"]
        }
      ]
    },
    {
      platform: "PlayStation",
      icon: <Monitor className="w-5 h-5" />,
      steps: [
        {
          step: 1,
          title: "Access Private Match",
          description: "Go to multiplayer menu and select Private Match or Custom Game",
          tips: ["Some games call it 'Play with Friends' or 'Custom Room'"]
        },
        {
          step: 2,
          title: "Set Match Parameters",
          description: "Configure game rules, duration, and player limits as specified in challenge",
          tips: ["Double-check all settings match the challenge requirements"]
        },
        {
          step: 3,
          title: "Invite Players",
          description: "Send PlayStation invites to opponents or share room code",
          tips: ["Use PlayStation party chat for coordination", "Share PSN usernames beforehand"]
        },
        {
          step: 4,
          title: "Capture Gameplay",
          description: "Use Share button to record clips or take screenshots during/after match",
          tips: ["Hold Share button for recording options", "Take screenshot of final leaderboard"]
        },
        {
          step: 5,
          title: "Report Outcome",
          description: "Upload proof and submit your result in the challenge system",
          tips: ["Use PlayStation app to easily share screenshots", "Report results promptly"]
        }
      ]
    },
    {
      platform: "PC",
      icon: <Monitor className="w-5 h-5" />,
      steps: [
        {
          step: 1,
          title: "Launch Custom Game",
          description: "Start your game launcher (Steam, Epic, etc.) and create a private lobby",
          tips: ["Each platform has different lobby creation methods", "Check game-specific instructions"]
        },
        {
          step: 2,
          title: "Configure Game Settings",
          description: "Adjust all match settings according to challenge specifications",
          tips: ["Save settings as preset for future challenges", "Screenshot settings for verification"]
        },
        {
          step: 3,
          title: "Coordinate with Opponents",
          description: "Share lobby details via Discord, Steam chat, or challenge messaging",
          tips: ["Use Discord for voice communication", "Share Steam friend codes if needed"]
        },
        {
          step: 4,
          title: "Record Match Evidence",
          description: "Use OBS, GeForce Experience, or built-in recording to capture gameplay",
          tips: ["F9 for GeForce instant replay", "Steam F12 for screenshots", "Alt+F9 to start/stop recording"]
        },
        {
          step: 5,
          title: "Submit Verification",
          description: "Upload recordings/screenshots and report your final placement",
          tips: ["Include timestamp in recordings", "Multiple screenshots increase credibility"]
        }
      ]
    }
  ];

  const generalTips = [
    "Always screenshot the final scoreboard or results screen",
    "Start recording before the match begins to show lobby setup",
    "Take screenshots of lobby settings to prove match configuration", 
    "Submit results within 10 minutes to avoid auto-forfeit",
    "Keep evidence files for 48 hours in case of disputes",
    "Use voice chat for better coordination with teammates",
    "Test your recording software before important matches"
  ];

  const copyAllSteps = (platform: string) => {
    const guide = platformGuides.find(g => g.platform === platform);
    if (!guide) return;

    const content = `${platform} Setup Guide for ${gameName}\n\n` +
      guide.steps.map(step => 
        `${step.step}. ${step.title}\n   ${step.description}\n   Tips: ${step.tips?.join(', ') || 'None'}`
      ).join('\n\n');

    navigator.clipboard.writeText(content);
    toast({
      title: "Guide Copied!",
      description: `${platform} setup guide copied to clipboard`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="w-4 h-4" />
          How to Set Up a Challenge
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Challenge Setup Guide - {gameName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="xbox" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            {platformGuides.map((guide) => (
              <TabsTrigger key={guide.platform} value={guide.platform.toLowerCase()} className="flex items-center gap-2">
                {guide.icon}
                {guide.platform}
              </TabsTrigger>
            ))}
          </TabsList>

          {platformGuides.map((guide) => (
            <TabsContent key={guide.platform} value={guide.platform.toLowerCase()}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{guide.platform} Setup Steps</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyAllSteps(guide.platform)}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Guide
                  </Button>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {guide.steps.map((step) => (
                      <Card key={step.step}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Badge variant="default" className="rounded-full w-6 h-6 p-0 flex items-center justify-center">
                              {step.step}
                            </Badge>
                            {step.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          
                          {step.tips && step.tips.length > 0 && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-xs font-medium text-primary mb-1">💡 Pro Tips:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {step.tips.map((tip, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Universal Tips for All Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {generalTips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary font-bold">•</span>
                  {tip}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};